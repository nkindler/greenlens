import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "deckranker.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __dr_db: Database.Database | undefined;
}

function init(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL,
      technology_type TEXT,
      location TEXT,
      investment_size TEXT,
      stage TEXT,
      founder_profile TEXT,
      geography TEXT,
      overall_score REAL,
      recommendation TEXT,
      analysis_json TEXT NOT NULL,
      decision TEXT NOT NULL DEFAULT 'looking',
      decision_at INTEGER,
      decision_notes TEXT,
      outcome TEXT NOT NULL DEFAULT 'unknown',
      outcome_updated_at INTEGER,
      outcome_evidence TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
    CREATE INDEX IF NOT EXISTS idx_decks_decision ON decks(user_id, decision);
  `);
}

export function getDb(): Database.Database {
  if (!global.__dr_db) {
    const db = new Database(DB_PATH);
    init(db);
    global.__dr_db = db;
  }
  return global.__dr_db;
}

export type DeckRow = {
  id: number;
  user_id: number;
  company_name: string;
  technology_type: string | null;
  location: string | null;
  investment_size: string | null;
  stage: string | null;
  founder_profile: string | null;
  geography: string | null;
  overall_score: number | null;
  recommendation: string | null;
  analysis_json: string;
  decision: "looking" | "invested" | "passed";
  decision_at: number | null;
  decision_notes: string | null;
  outcome: "unknown" | "succeeded" | "failed";
  outcome_updated_at: number | null;
  outcome_evidence: string | null;
  created_at: number;
};

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  is_demo: number;
  created_at: number;
};
