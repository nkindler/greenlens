import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPool, ready } from "@/lib/db";
import { getAccessibleDeck } from "@/lib/insights";

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
  const deck = await getAccessibleDeck(user.id, deckId);
  if (!deck) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await ready();
  await getPool().query(
    `UPDATE decks SET outcome = $1, outcome_updated_at = $2, outcome_evidence = $3
     WHERE id = $4`,
    [outcome, Date.now(), evidence ?? null, deckId],
  );
  return NextResponse.json({ ok: true });
}
