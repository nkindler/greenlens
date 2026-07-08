import { NextResponse } from "next/server";
import { getPending2faUserId, issueLoginCode } from "@/lib/auth";
import { getPool, ready, type UserRow } from "@/lib/db";
import { sendLoginCodeEmail } from "@/lib/mailer";

export async function POST() {
  const userId = await getPending2faUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Session expired. Sign in again.", expired: true },
      { status: 401 },
    );
  }
  await ready();
  const r = await getPool().query<UserRow>("SELECT * FROM users WHERE id = $1", [
    userId,
  ]);
  const user = r.rows[0];
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  const code = await issueLoginCode(user.id);
  try {
    await sendLoginCodeEmail(user.email, code);
  } catch (e) {
    console.error("[2fa] failed to resend code:", e);
    return NextResponse.json(
      { error: "Could not send verification email. Try again shortly." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
