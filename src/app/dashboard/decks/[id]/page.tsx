import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  findSimilar,
  getDeck,
  listUserDecks,
  type SimilarDeck,
} from "@/lib/insights";
import { DeckDetailClient } from "./deck-detail-client";

export const dynamic = "force-dynamic";

export default async function DeckDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const deckId = parseInt(id, 10);
  if (!Number.isFinite(deckId)) notFound();

  const deck = await getDeck(user.id, deckId);
  if (!deck) notFound();

  const allDecks = await listUserDecks(user.id);
  const similar: SimilarDeck[] = findSimilar(deck, allDecks, 4);

  let analysis: Record<string, unknown> = {};
  try {
    analysis = JSON.parse(deck.analysis_json) as Record<string, unknown>;
  } catch {
    analysis = {};
  }

  return (
    <DeckDetailClient
      deck={{
        id: deck.id,
        company_name: deck.company_name,
        technology_type: deck.technology_type,
        location: deck.location,
        investment_size: deck.investment_size,
        stage: deck.stage,
        founder_profile: deck.founder_profile,
        overall_score: deck.overall_score,
        recommendation: deck.recommendation,
        decision: deck.decision,
        decision_notes: deck.decision_notes,
        outcome: deck.outcome,
        outcome_evidence: deck.outcome_evidence,
        created_at: deck.created_at,
      }}
      analysis={analysis}
      similar={similar}
      isDemo={!!user.is_demo}
    />
  );
}
