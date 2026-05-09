import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getPool, ready, type UserRow } from "./db";

const COOKIE_NAME = "dr_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
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
