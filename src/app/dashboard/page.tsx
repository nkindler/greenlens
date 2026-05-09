import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  computeBlindspots,
  computeModel,
  listUserDecks,
} from "@/lib/insights";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const decks = listUserDecks(user.id);
  const model = computeModel(decks);
  const blindspots = computeBlindspots(decks);

  // Strip analysis_json blobs for the list payload to keep it light.
  const slim = decks.map((d) => ({
    id: d.id,
    company_name: d.company_name,
    technology_type: d.technology_type,
    location: d.location,
    investment_size: d.investment_size,
    stage: d.stage,
    founder_profile: d.founder_profile,
    overall_score: d.overall_score,
    recommendation: d.recommendation,
    decision: d.decision,
    outcome: d.outcome,
    created_at: d.created_at,
  }));

  return (
    <DashboardClient
      user={{ email: user.email, name: user.name, isDemo: !!user.is_demo }}
      decks={slim}
      model={model}
      blindspots={blindspots}
    />
  );
}

