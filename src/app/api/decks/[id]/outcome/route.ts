import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await ctx.params;
  const deckId = parseInt(id, 10);
  if (!Number.isFinite(deckId)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const { outcome, evidence } = await req.json();
  if (!["unknown", "succeeded", "failed"].includes(outcome)) {
    return NextResponse.json({ error: "invalid outcome" }, { status: 400 });
  }
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE decks SET outcome = ?, outcome_updated_at = ?, outcome_evidence = ?
       WHERE id = ? AND user_id = ?`,
    )
    .run(outcome, Date.now(), evidence ?? null, deckId, user.id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
