import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getWorkspace,
  listOrgMembers,
  listPendingInvites,
  listUserOrgs,
} from "@/lib/orgs";
import { parseUserSettings } from "@/lib/settings";
import { getPreferenceProfile } from "@/lib/analysis";
import { listWorkspaceDecks } from "@/lib/insights";
import { AppHeader, type WorkspaceOption } from "@/components/app-header";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [orgs, workspace] = await Promise.all([
    listUserOrgs(user.id),
    getWorkspace(user),
  ]);

  const orgDetails = await Promise.all(
    orgs.map(async (o) => ({
      id: o.id,
      name: o.name,
      role: o.role,
      members: await listOrgMembers(o.id),
      pendingInvites:
        o.role === "member" ? [] : (await listPendingInvites(o.id)).map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          created_at: i.created_at,
        })),
    })),
  );

  const profile = await getPreferenceProfile(workspace, user.id);
  const decks = await listWorkspaceDecks(workspace, user.id);
  const decidedCount = decks.filter((d) => d.decision !== "looking").length;

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
      <SettingsClient
        user={{
          email: user.email,
          name: user.name,
          isDemo: !!user.is_demo,
          userId: user.id,
        }}
        initialSettings={parseUserSettings(user)}
        twoFactorEnabled={!!user.two_factor_enabled}
        orgs={orgDetails}
        training={{
          workspaceName:
            workspace.kind === "org" ? workspace.org.name : "Personal",
          profileMd: profile?.profile_md ?? null,
          trainedAt: profile?.trained_at ?? null,
          decidedCount,
          totalDecks: decks.length,
        }}
      />
    </div>
  );
}
