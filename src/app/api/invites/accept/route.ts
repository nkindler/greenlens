import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { acceptInvite, setWorkspaceCookie } from "@/lib/orgs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { token } = await req.json();
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "missing token" }, { status: 400 });
  }
  try {
    const org = await acceptInvite(token, user);
    await setWorkspaceCookie(String(org.id));
    return NextResponse.json({ ok: true, org: { id: org.id, name: org.name } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not accept invite" },
      { status: 400 },
    );
  }
}
