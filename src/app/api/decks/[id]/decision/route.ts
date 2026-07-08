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
  const { decision, notes } = await req.json();
  if (!["looking", "invested", "passed"].includes(decision)) {
    return NextResponse.json({ error: "invalid decision" }, { status: 400 });
  }
  const deck = await getAccessibleDeck(user.id, deckId);
  if (!deck) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await ready();
  await getPool().query(
    `UPDATE decks SET decision = $1, decision_at = $2, decision_notes = $3
     WHERE id = $4`,
    [decision, Date.now(), notes ?? null, deckId],
  );
  return NextResponse.json({ ok: true });
}
