import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { ensureDemoUserSeeded } from "@/lib/seed";

export async function POST() {
  const user = await ensureDemoUserSeeded();
  await setSession(user.id);
  return NextResponse.json({ ok: true });
}

// Shareable demo entry: GET /api/auth/demo creates a session and lands on the dashboard.
export async function GET(req: Request) {
  const user = await ensureDemoUserSeeded();
  await setSession(user.id);
  const url = new URL("/dashboard", req.url);
  return NextResponse.redirect(url, 303);
}
