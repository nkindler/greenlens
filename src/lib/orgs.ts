import { cookies } from "next/headers";
import crypto from "crypto";
import {
  getPool,
  ready,
  type OrgInviteRow,
  type OrgMemberRow,
  type OrgRow,
  type UserRow,
} from "./db";

const WORKSPACE_COOKIE = "dr_workspace";
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type OrgWithRole = OrgRow & { role: OrgMemberRow["role"]; member_count: number };

export type Workspace =
  | { kind: "personal" }
  | { kind: "org"; org: OrgWithRole };

export async function listUserOrgs(userId: number): Promise<OrgWithRole[]> {
  await ready();
  const r = await getPool().query<OrgWithRole>(
    `SELECT o.*, m.role,
            (SELECT COUNT(*)::int FROM org_members mc WHERE mc.org_id = o.id) AS member_count
     FROM orgs o
     JOIN org_members m ON m.org_id = o.id
     WHERE m.user_id = $1
     ORDER BY o.created_at ASC`,
    [userId],
  );
  return r.rows;
}

export async function getMembership(
  orgId: number,
  userId: number,
): Promise<OrgMemberRow | null> {
  await ready();
  const r = await getPool().query<OrgMemberRow>(
    "SELECT * FROM org_members WHERE org_id = $1 AND user_id = $2",
    [orgId, userId],
  );
  return r.rows[0] ?? null;
}

export async function createOrg(userId: number, name: string): Promise<OrgRow> {
  await ready();
  const pool = getPool();
  const now = Date.now();
  const org = await pool.query<OrgRow>(
    "INSERT INTO orgs(name, created_by, created_at) VALUES ($1, $2, $3) RETURNING *",
    [name, userId, now],
  );
  await pool.query(
    "INSERT INTO org_members(org_id, user_id, role, created_at) VALUES ($1, $2, 'owner', $3)",
    [org.rows[0].id, userId, now],
  );
  return org.rows[0];
}

export async function createInvite(opts: {
  orgId: number;
  email: string;
  role: "admin" | "member";
  invitedBy: number;
}): Promise<OrgInviteRow> {
  await ready();
  const token = crypto.randomBytes(24).toString("base64url");
  const now = Date.now();
  const r = await getPool().query<OrgInviteRow>(
    `INSERT INTO org_invites(org_id, email, role, token, invited_by, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [opts.orgId, opts.email.toLowerCase().trim(), opts.role, token, opts.invitedBy, now + INVITE_TTL_MS, now],
  );
  return r.rows[0];
}

export async function getInviteByToken(token: string): Promise<
  | (OrgInviteRow & {
      org_name: string;
      inviter_name: string | null;
      is_valid: boolean;
    })
  | null
> {
  await ready();
  const r = await getPool().query<
    OrgInviteRow & { org_name: string; inviter_name: string | null }
  >(
    `SELECT i.*, o.name AS org_name, u.name AS inviter_name
     FROM org_invites i
     JOIN orgs o ON o.id = i.org_id
     LEFT JOIN users u ON u.id = i.invited_by
     WHERE i.token = $1`,
    [token],
  );
  const row = r.rows[0];
  if (!row) return null;
  return {
    ...row,
    is_valid: !row.accepted_at && row.expires_at > Date.now(),
  };
}

export async function acceptInvite(token: string, user: UserRow): Promise<OrgRow> {
  await ready();
  const pool = getPool();
  const invite = await getInviteByToken(token);
  if (!invite) throw new Error("Invite not found");
  if (invite.accepted_at) throw new Error("Invite already used");
  if (invite.expires_at < Date.now()) throw new Error("Invite expired");
  const now = Date.now();
  await pool.query(
    `INSERT INTO org_members(org_id, user_id, role, created_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (org_id, user_id) DO NOTHING`,
    [invite.org_id, user.id, invite.role, now],
  );
  await pool.query("UPDATE org_invites SET accepted_at = $1 WHERE id = $2", [
    now,
    invite.id,
  ]);
  const org = await pool.query<OrgRow>("SELECT * FROM orgs WHERE id = $1", [
    invite.org_id,
  ]);
  return org.rows[0];
}

export async function listOrgMembers(
  orgId: number,
): Promise<Array<{ user_id: number; email: string; name: string | null; role: string; created_at: number }>> {
  await ready();
  const r = await getPool().query<{
    user_id: number;
    email: string;
    name: string | null;
    role: string;
    created_at: number;
  }>(
    `SELECT m.user_id, u.email, u.name, m.role, m.created_at
     FROM org_members m JOIN users u ON u.id = m.user_id
     WHERE m.org_id = $1 ORDER BY m.created_at ASC`,
    [orgId],
  );
  return r.rows;
}

export async function listPendingInvites(orgId: number): Promise<OrgInviteRow[]> {
  await ready();
  const r = await getPool().query<OrgInviteRow>(
    `SELECT * FROM org_invites
     WHERE org_id = $1 AND accepted_at IS NULL AND expires_at > $2
     ORDER BY created_at DESC`,
    [orgId, Date.now()],
  );
  return r.rows;
}

// ---- Workspace (personal vs org dashboard) ----

export async function getWorkspace(user: UserRow): Promise<Workspace> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WORKSPACE_COOKIE)?.value;
  if (raw && raw !== "personal") {
    const orgId = parseInt(raw, 10);
    if (Number.isFinite(orgId)) {
      const orgs = await listUserOrgs(user.id);
      const org = orgs.find((o) => o.id === orgId);
      if (org) return { kind: "org", org };
    }
  }
  return { kind: "personal" };
}

export async function setWorkspaceCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
}
