import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createInvite, getMembership } from "@/lib/orgs";
import { getPool, ready, type OrgRow } from "@/lib/db";
import { isMailerConfigured, sendOrgInviteEmail } from "@/lib/mailer";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await ctx.params;
  const orgId = parseInt(id, 10);
  if (!Number.isFinite(orgId)) {
    return NextResponse.json({ error: "bad org id" }, { status: 400 });
  }
  const membership = await getMembership(orgId, user.id);
  if (!membership || membership.role === "member") {
    return NextResponse.json(
      { error: "Only owners and admins can invite" },
      { status: 403 },
    );
  }
  const { email, role } = await req.json();
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  const inviteRole = role === "admin" ? "admin" : "member";

  const invite = await createInvite({
    orgId,
    email,
    role: inviteRole,
    invitedBy: user.id,
  });

  await ready();
  const orgRow = await getPool().query<OrgRow>("SELECT * FROM orgs WHERE id = $1", [
    orgId,
  ]);
  const orgName = orgRow.rows[0]?.name ?? "an organization";

  // Public origin (behind Railway's proxy req URLs are internal).
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "deckranker.com";
  const acceptUrl = `${proto}://${host}/invite/${invite.token}`;

  if (!isMailerConfigured()) {
    return NextResponse.json({
      ok: true,
      emailSent: false,
      acceptUrl,
      warning: "Email delivery is not configured — share the invite link directly.",
    });
  }

  try {
    await sendOrgInviteEmail({
      to: email,
      orgName,
      inviterName: user.name || user.email,
      acceptUrl,
    });
  } catch (e) {
    console.error("[invite] email send failed:", e);
    // The invite still exists; surface the link so the inviter can share it.
    return NextResponse.json({
      ok: true,
      emailSent: false,
      acceptUrl,
      warning: "Email could not be sent — share the invite link directly.",
    });
  }

  return NextResponse.json({ ok: true, emailSent: true, acceptUrl });
}
