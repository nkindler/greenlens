import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getPool, ready, type UserRow } from "./db";

const COOKIE_NAME = "dr_session";
const PENDING_2FA_COOKIE = "dr_pending_2fa";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const PENDING_2FA_MAX_AGE = 60 * 10;
const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const LOGIN_CODE_MAX_ATTEMPTS = 5;
const DEV_FALLBACK_SECRET =
  "deckranker-dev-secret-replace-in-prod-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET is not set or is too short (min 32 chars). Set it in your production env. Refusing to start with a guessable session secret.",
      );
    }
    return DEV_FALLBACK_SECRET;
  }
  return s;
}

function sign(value: string): string {
  const mac = crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
  return `${value}.${mac}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
  if (mac.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected)))
      return null;
  } catch {
    return null;
  }
  return value;
}

export async function setSession(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sign(String(userId)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const userIdStr = verify(raw);
  if (!userIdStr) return null;
  const userId = parseInt(userIdStr, 10);
  if (!Number.isFinite(userId)) return null;
  await ready();
  const r = await getPool().query<UserRow>(
    "SELECT * FROM users WHERE id = $1",
    [userId],
  );
  return r.rows[0] ?? null;
}

export async function requireUser(): Promise<UserRow> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function createUser(
  email: string,
  password: string,
  name?: string,
  isDemo = false,
): Promise<UserRow> {
  await ready();
  const hash = await bcrypt.hash(password, 10);
  const now = Date.now();
  const r = await getPool().query<UserRow>(
    `INSERT INTO users(email, password_hash, name, is_demo, created_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email.toLowerCase().trim(), hash, name ?? null, isDemo ? 1 : 0, now],
  );
  return r.rows[0];
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<UserRow | null> {
  await ready();
  const r = await getPool().query<UserRow>(
    "SELECT * FROM users WHERE email = $1",
    [email.toLowerCase().trim()],
  );
  const user = r.rows[0];
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  await ready();
  const r = await getPool().query<UserRow>(
    "SELECT * FROM users WHERE email = $1",
    [email.toLowerCase().trim()],
  );
  return r.rows[0] ?? null;
}

// ---- Email 2FA ----
// Login is a two-step handshake when 2FA is on: password check issues a
// short-lived signed "pending" cookie plus an emailed 6-digit code; the
// verify step exchanges both for a real session.

export async function setPending2fa(userId: number) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + PENDING_2FA_MAX_AGE * 1000;
  cookieStore.set(PENDING_2FA_COOKIE, sign(`${userId}:${expiresAt}`), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_2FA_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getPending2faUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PENDING_2FA_COOKIE)?.value;
  if (!raw) return null;
  const value = verify(raw);
  if (!value) return null;
  const [idStr, expStr] = value.split(":");
  const userId = parseInt(idStr, 10);
  const expiresAt = parseInt(expStr, 10);
  if (!Number.isFinite(userId) || !Number.isFinite(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;
  return userId;
}

export async function clearPending2fa() {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_2FA_COOKIE);
}

function hashCode(code: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(code)
    .digest("hex");
}

export async function issueLoginCode(userId: number): Promise<string> {
  await ready();
  const pool = getPool();
  const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  // One active code per user: new code replaces any outstanding one.
  await pool.query("DELETE FROM login_codes WHERE user_id = $1", [userId]);
  await pool.query(
    `INSERT INTO login_codes(user_id, code_hash, expires_at, created_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, hashCode(code), Date.now() + LOGIN_CODE_TTL_MS, Date.now()],
  );
  return code;
}

export async function verifyLoginCode(
  userId: number,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ready();
  const pool = getPool();
  const r = await pool.query<{
    id: number;
    code_hash: string;
    expires_at: number;
    attempts: number;
    consumed: number;
  }>(
    "SELECT id, code_hash, expires_at, attempts, consumed FROM login_codes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    [userId],
  );
  const row = r.rows[0];
  if (!row || row.consumed) {
    return { ok: false, error: "No active code. Request a new one." };
  }
  if (Date.now() > row.expires_at) {
    return { ok: false, error: "Code expired. Request a new one." };
  }
  if (row.attempts >= LOGIN_CODE_MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Request a new code." };
  }
  await pool.query("UPDATE login_codes SET attempts = attempts + 1 WHERE id = $1", [
    row.id,
  ]);
  const expected = Buffer.from(row.code_hash);
  const actual = Buffer.from(hashCode(code.trim()));
  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(expected, actual)
  ) {
    return { ok: false, error: "Incorrect code." };
  }
  await pool.query("UPDATE login_codes SET consumed = 1 WHERE id = $1", [row.id]);
  return { ok: true };
}

export async function updatePassword(userId: number, newPassword: string) {
  await ready();
  const hash = await bcrypt.hash(newPassword, 10);
  await getPool().query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    hash,
    userId,
  ]);
}
