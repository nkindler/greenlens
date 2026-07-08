import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createOrg, listUserOrgs, setWorkspaceCookie } from "@/lib/orgs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const orgs = await listUserOrgs(user.id);
  return NextResponse.json({ orgs });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { name } = await req.json();
  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Organization name must be at least 2 characters" },
      { status: 400 },
    );
  }
  const org = await createOrg(user.id, name.trim().slice(0, 80));
  // Switch the creator into the new shared dashboard right away.
  await setWorkspaceCookie(String(org.id));
  return NextResponse.json({ ok: true, org });
}
