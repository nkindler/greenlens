import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { ensureDemoUserSeeded } from "@/lib/seed";

export async function POST() {
  const user = ensureDemoUserSeeded();
  await setSession(user.id);
  return NextResponse.json({ ok: true });
}
