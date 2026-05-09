import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (await findUserByEmail(email)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    const user = await createUser(email, password, name);
    await setSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Signup failed" },
      { status: 500 },
    );
  }
}
