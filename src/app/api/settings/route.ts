import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPool, ready } from "@/lib/db";
import {
  parseUserSettings,
  sanitizeSettings,
  saveUserSettings,
} from "@/lib/settings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({
    settings: parseUserSettings(user),
    profile: { name: user.name, email: user.email },
    twoFactorEnabled: !!user.two_factor_enabled,
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = await req.json();

  await ready();
  const pool = getPool();

  if (typeof body.name === "string") {
    await pool.query("UPDATE users SET name = $1 WHERE id = $2", [
      body.name.trim().slice(0, 80) || null,
      user.id,
    ]);
  }

  if (typeof body.twoFactorEnabled === "boolean") {
    await pool.query("UPDATE users SET two_factor_enabled = $1 WHERE id = $2", [
      body.twoFactorEnabled ? 1 : 0,
      user.id,
    ]);
  }

  if (body.settings && typeof body.settings === "object") {
    const settings = sanitizeSettings(body.settings);
    await saveUserSettings(user.id, settings);
    return NextResponse.json({ ok: true, settings });
  }

  return NextResponse.json({ ok: true });
}
