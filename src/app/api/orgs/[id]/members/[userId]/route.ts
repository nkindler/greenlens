import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMembership } from "@/lib/orgs";
import { getPool, ready } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id, userId } = await ctx.params;
  const orgId = parseInt(id, 10);
  const targetId = parseInt(userId, 10);
  if (!Number.isFinite(orgId) || !Number.isFinite(targetId)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const me = await getMembership(orgId, user.id);
  if (!me) return NextResponse.json({ error: "not a member" }, { status: 403 });

  const removingSelf = targetId === user.id;
  const canManage = me.role === "owner" || me.role === "admin";
  if (!removingSelf && !canManage) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const target = await getMembership(orgId, targetId);
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.role === "owner") {
    return NextResponse.json(
      { error: "The owner cannot be removed" },
      { status: 400 },
    );
  }

  await ready();
  await getPool().query(
    "DELETE FROM org_members WHERE org_id = $1 AND user_id = $2",
    [orgId, targetId],
  );
  return NextResponse.json({ ok: true });
}
