import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPool, ready } from "@/lib/db";
import { listWorkspaceDecks } from "@/lib/insights";
import { getWorkspace } from "@/lib/orgs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const workspace = await getWorkspace(user);
  const decks = await listWorkspaceDecks(workspace, user.id);
  return NextResponse.json({ decks });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = await req.json();
  const a = body?.analysis;
  if (!a || typeof a !== "object") {
    return NextResponse.json({ error: "missing analysis" }, { status: 400 });
  }
  const workspace = await getWorkspace(user);
  await ready();
  const result = await getPool().query<{ id: number }>(
    `INSERT INTO decks(
       user_id, org_id, company_name, technology_type, location, investment_size,
       stage, founder_profile, geography, overall_score, recommendation,
       analysis_json, decision, outcome, created_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'looking','unknown',$13)
     RETURNING id`,
    [
      user.id,
      workspace.kind === "org" ? workspace.org.id : null,
      a.project_name ?? "Untitled deal",
      a.technology_type ?? null,
      a.location ?? null,
      a.investment_size ?? null,
      a.stage ?? null,
      a.founder_profile ?? null,
      a.geography ?? null,
      typeof a.overall_score === "number" ? a.overall_score : null,
      a.recommendation ?? null,
      JSON.stringify(a),
      Date.now(),
    ],
  );
  return NextResponse.json({ ok: true, id: result.rows[0].id });
}
