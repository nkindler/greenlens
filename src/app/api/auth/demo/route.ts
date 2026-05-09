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
  // Behind Railway's proxy req.url uses the internal listen URL.
  // Reconstruct the public origin from the forwarded headers.
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "deckranker.com";
  return NextResponse.redirect(`${proto}://${host}/dashboard`, 303);
}
