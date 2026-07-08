import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  computeBlindspots,
  computeModel,
  listWorkspaceDecks,
} from "@/lib/insights";
import { getWorkspace, listUserOrgs } from "@/lib/orgs";
import { getPreferenceProfile } from "@/lib/analysis";
import { AppHeader, type WorkspaceOption } from "@/components/app-header";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [orgs, workspace] = await Promise.all([
    listUserOrgs(user.id),
    getWorkspace(user),
  ]);
  const decks = await listWorkspaceDecks(workspace, user.id);
  const model = computeModel(decks);
  const blindspots = computeBlindspots(decks);
  const profile = await getPreferenceProfile(workspace, user.id);

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

  const workspaces: WorkspaceOption[] = [
    { id: "personal", name: "Personal", kind: "personal" },
    ...orgs.map((o) => ({
      id: String(o.id),
      name: o.name,
      kind: "org" as const,
      role: o.role,
    })),
  ];
  const activeWorkspaceId =
    workspace.kind === "org" ? String(workspace.org.id) : "personal";

  return (
    <div className="min-h-screen">
      <AppHeader
        user={{ email: user.email, name: user.name, isDemo: !!user.is_demo }}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
      />
      <DashboardClient
        user={{ email: user.email, name: user.name, isDemo: !!user.is_demo }}
        workspaceName={workspace.kind === "org" ? workspace.org.name : "Personal"}
        isOrgWorkspace={workspace.kind === "org"}
        decks={slim}
        model={model}
        blindspots={blindspots}
        trainedProfile={profile ? { trainedAt: profile.trained_at } : null}
      />
    </div>
  );
}
