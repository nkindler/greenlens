import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listUserDecks } from "@/lib/insights";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const decks = listUserDecks(user.id);
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
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO decks(
        user_id, company_name, technology_type, location, investment_size,
        stage, founder_profile, geography, overall_score, recommendation,
        analysis_json, decision, outcome, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,'looking','unknown',?)`,
    )
    .run(
      user.id,
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
    );
  return NextResponse.json({ ok: true, id: result.lastInsertRowid });
}
