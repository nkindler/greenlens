import { NextRequest, NextResponse } from "next/server";
import {
  issueLoginCode,
  setPending2fa,
  setSession,
  verifyCredentials,
} from "@/lib/auth";
import { isMailerConfigured, sendLoginCodeEmail } from "@/lib/mailer";

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

    // Email 2FA: on for all non-demo accounts unless disabled in settings.
    // Requires a mail path — in dev (no SendGrid key) the code is logged to
    // the server console; in production without a key we can't deliver codes,
    // so we fail open with a loud warning rather than lock everyone out.
    const canDeliver = isMailerConfigured() || process.env.NODE_ENV !== "production";
    if (user.two_factor_enabled && !user.is_demo && canDeliver) {
      const code = await issueLoginCode(user.id);
      await setPending2fa(user.id);
      try {
        await sendLoginCodeEmail(user.email, code);
      } catch (e) {
        console.error("[2fa] failed to send code:", e);
        return NextResponse.json(
          { error: "Could not send verification email. Try again shortly." },
          { status: 502 },
        );
      }
      return NextResponse.json({ ok: true, requires2fa: true });
    }
    if (user.two_factor_enabled && !user.is_demo && !canDeliver) {
      console.warn(
        "[2fa] SENDGRID_API_KEY missing in production — skipping 2FA challenge",
      );
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
