import { Pool, types } from "pg";

// Return BIGINT (oid 20) and NUMERIC (oid 1700) as JS numbers. Safe here:
// our BIGINT columns hold ms epoch timestamps and serial IDs, both well
// within Number.MAX_SAFE_INTEGER for the foreseeable future.
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

declare global {
  // eslint-disable-next-line no-var
  var __dr_pool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __dr_ready: Promise<void> | undefined;
}

function buildPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Set it in your env (Railway provides it automatically when a Postgres service is attached). Local dev: postgres://postgres:postgres@localhost:5432/deckranker",
    );
  }
  // Railway internal proxy is plain TCP. External and most managed
  // Postgres services require SSL; default to allowing self-signed.
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  const ssl = isLocal ? false : { rejectUnauthorized: false };
  return new Pool({ connectionString: url, ssl, max: 10 });
}

export function getPool(): Pool {
  if (!global.__dr_pool) {
    global.__dr_pool = buildPool();
  }
  return global.__dr_pool;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    is_demo INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS decks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    technology_type TEXT,
    location TEXT,
    investment_size TEXT,
    stage TEXT,
    founder_profile TEXT,
    geography TEXT,
    overall_score DOUBLE PRECISION,
    recommendation TEXT,
    analysis_json TEXT NOT NULL,
    decision TEXT NOT NULL DEFAULT 'looking',
    decision_at BIGINT,
    decision_notes TEXT,
    outcome TEXT NOT NULL DEFAULT 'unknown',
    outcome_updated_at BIGINT,
    outcome_evidence TEXT,
    created_at BIGINT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
  CREATE INDEX IF NOT EXISTS idx_decks_decision ON decks(user_id, decision);
`;

// Lazy schema init; idempotent. Called from query sites via `await ready()`.
export async function ready(): Promise<void> {
  if (!global.__dr_ready) {
    const pool = getPool();
    global.__dr_ready = pool.query(SCHEMA).then(() => {});
  }
  return global.__dr_ready;
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
