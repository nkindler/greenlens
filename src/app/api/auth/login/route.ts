import { NextRequest, NextResponse } from "next/server";
import { setSession, verifyCredentials } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const user = await verifyCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    await setSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Login failed" },
      { status: 500 },
    );
  }
}
