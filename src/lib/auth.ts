import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb, type UserRow } from "./db";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "deckranker-dev-secret-replace-in-prod-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const COOKIE_NAME = "dr_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function sign(value: string): string {
  const mac = crypto
    .createHmac("sha256", SESSION_SECRET)
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
    .createHmac("sha256", SESSION_SECRET)
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
  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(userId) as UserRow | undefined;
  return user ?? null;
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
  const db = getDb();
  const hash = await bcrypt.hash(password, 10);
  const now = Date.now();
  const result = db
    .prepare(
      "INSERT INTO users(email, password_hash, name, is_demo, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(email.toLowerCase().trim(), hash, name ?? null, isDemo ? 1 : 0, now);
  return db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(result.lastInsertRowid) as UserRow;
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<UserRow | null> {
  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim()) as UserRow | undefined;
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}

export function findUserByEmail(email: string): UserRow | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email.toLowerCase().trim()) as UserRow | undefined) ?? null
  );
}
