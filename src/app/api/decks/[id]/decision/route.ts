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
  const { decision, notes } = await req.json();
  if (!["looking", "invested", "passed"].includes(decision)) {
    return NextResponse.json({ error: "invalid decision" }, { status: 400 });
  }
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE decks SET decision = ?, decision_at = ?, decision_notes = ?
       WHERE id = ? AND user_id = ?`,
    )
    .run(decision, Date.now(), notes ?? null, deckId, user.id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
