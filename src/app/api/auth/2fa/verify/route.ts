import { NextRequest, NextResponse } from "next/server";
import {
  clearPending2fa,
  getPending2faUserId,
  setSession,
  verifyLoginCode,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
      return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
    }
    const userId = await getPending2faUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Session expired. Sign in again.", expired: true },
        { status: 401 },
      );
    }
    const result = await verifyLoginCode(userId, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    await clearPending2fa();
    await setSession(userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 500 },
    );
  }
}
