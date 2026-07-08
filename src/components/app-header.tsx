"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  ChevronDown,
  LogOut,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { Logo } from "./logo";

export type WorkspaceOption = {
  id: string; // "personal" or org id as string
  name: string;
  kind: "personal" | "org";
  role?: string;
};

export function AppHeader({
  user,
  workspaces,
  activeWorkspaceId,
}: {
  user: { email: string; name: string | null; isDemo: boolean };
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
}) {
  const router = useRouter();
  const [wsOpen, setWsOpen] = useState(false);
  const active =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  async function switchWorkspace(id: string) {
    setWsOpen(false);
    if (id === activeWorkspaceId) return;
    await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace: id }),
    });
    router.push("/dashboard");
    router.refresh();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-card-border bg-card/40 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Logo href="/dashboard" />
          {user.isDemo && (
            <span className="hidden sm:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Demo investor
            </span>
          )}
          {/* Workspace switcher */}
          <div className="relative">
            <button
              onClick={() => setWsOpen((v) => !v)}
              className="flex items-center gap-2 text-sm bg-background/50 border border-card-border hover:border-accent/40 rounded-lg px-3 py-1.5 max-w-[180px]"
            >
              {active?.kind === "org" ? (
                <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-muted shrink-0" />
              )}
              <span className="truncate">{active?.name ?? "Personal"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
            </button>
            {wsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setWsOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-64 bg-card border border-card-border rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                  <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted">
                    Workspaces
                  </p>
                  {workspaces.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => switchWorkspace(w.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-background/60 text-left"
                    >
                      {w.kind === "org" ? (
                        <Building2 className="w-4 h-4 text-accent shrink-0" />
                      ) : (
                        <User className="w-4 h-4 text-muted shrink-0" />
                      )}
                      <span className="flex-1 truncate">
                        {w.name}
                        {w.role && (
                          <span className="ml-1.5 text-[10px] uppercase tracking-wider text-muted">
                            {w.role}
                          </span>
                        )}
                      </span>
                      {w.id === activeWorkspaceId && (
                        <Check className="w-4 h-4 text-accent shrink-0" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-card-border mt-1 pt-1">
                    <Link
                      href="/dashboard/settings#organizations"
                      onClick={() => setWsOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-background/60"
                    >
                      <Plus className="w-4 h-4" /> New organization
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/upload"
            className="text-sm bg-accent hover:bg-accent-light text-background font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Analyze deck</span>
          </Link>
          <Link
            href="/dashboard/settings"
            title="Settings"
            className="text-muted hover:text-foreground p-2 rounded-lg hover:bg-card"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-muted hover:text-foreground p-2 rounded-lg hover:bg-card"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
