import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMembership, setWorkspaceCookie } from "@/lib/orgs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { workspace } = await req.json();
  if (workspace === "personal") {
    await setWorkspaceCookie("personal");
    return NextResponse.json({ ok: true });
  }
  const orgId = parseInt(String(workspace), 10);
  if (!Number.isFinite(orgId)) {
    return NextResponse.json({ error: "invalid workspace" }, { status: 400 });
  }
  const membership = await getMembership(orgId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "not a member" }, { status: 403 });
  }
  await setWorkspaceCookie(String(orgId));
  return NextResponse.json({ ok: true });
}
