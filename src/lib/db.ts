import { Pool, types } from "pg";

// Return BIGINT (oid 20) and NUMERIC (oid 1700) as JS numbers. Safe here:
// our BIGINT columns hold ms epoch timestamps and serial IDs, both well
// within Number.MAX_SAFE_INTEGER for the foreseeable future.
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

declare global {
  var __dr_pool: Pool | undefined;
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

  ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled INTEGER DEFAULT 1;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS settings_json TEXT;

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

  ALTER TABLE decks ADD COLUMN IF NOT EXISTS org_id BIGINT;

  CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
  CREATE INDEX IF NOT EXISTS idx_decks_decision ON decks(user_id, decision);
  CREATE INDEX IF NOT EXISTS idx_decks_org ON decks(org_id);

  -- Short-lived email verification codes (2FA login challenges).
  CREATE TABLE IF NOT EXISTS login_codes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    expires_at BIGINT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    consumed INTEGER NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_login_codes_user ON login_codes(user_id);

  CREATE TABLE IF NOT EXISTS orgs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS org_members (
    org_id BIGINT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at BIGINT NOT NULL,
    PRIMARY KEY (org_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS org_invites (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    token TEXT UNIQUE NOT NULL,
    invited_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    expires_at BIGINT NOT NULL,
    accepted_at BIGINT,
    created_at BIGINT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_org_invites_email ON org_invites(email);

  -- Learned investor preference profiles, one per workspace
  -- (user_id set for personal workspaces, org_id for org workspaces).
  CREATE TABLE IF NOT EXISTS preference_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    org_id BIGINT REFERENCES orgs(id) ON DELETE CASCADE,
    profile_md TEXT NOT NULL,
    stats_json TEXT,
    trained_at BIGINT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_pref_user ON preference_profiles(user_id) WHERE user_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_pref_org ON preference_profiles(org_id) WHERE org_id IS NOT NULL;
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
  org_id: number | null;
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
  two_factor_enabled: number;
  settings_json: string | null;
  created_at: number;
};

export type OrgRow = {
  id: number;
  name: string;
  created_by: number | null;
  created_at: number;
};

export type OrgMemberRow = {
  org_id: number;
  user_id: number;
  role: "owner" | "admin" | "member";
  created_at: number;
};

export type OrgInviteRow = {
  id: number;
  org_id: number;
  email: string;
  role: "admin" | "member";
  token: string;
  invited_by: number | null;
  expires_at: number;
  accepted_at: number | null;
  created_at: number;
};

export type PreferenceProfileRow = {
  id: number;
  user_id: number | null;
  org_id: number | null;
  profile_md: string;
  stats_json: string | null;
  trained_at: number;
};
