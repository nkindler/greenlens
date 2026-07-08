"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Building2,
  Check,
  GripVertical,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { DetailLevel, ReportDimension, UserSettings } from "@/lib/settings";

type OrgDetail = {
  id: number;
  name: string;
  role: string;
  members: Array<{
    user_id: number;
    email: string;
    name: string | null;
    role: string;
    created_at: number;
  }>;
  pendingInvites: Array<{
    id: number;
    email: string;
    role: string;
    created_at: number;
  }>;
};

type TrainingInfo = {
  workspaceName: string;
  profileMd: string | null;
  trainedAt: number | null;
  decidedCount: number;
  totalDecks: number;
};

const DETAIL_LEVELS: Array<{ key: DetailLevel; label: string; blurb: string }> = [
  {
    key: "brief",
    label: "Brief",
    blurb: "One-line rationales, single-paragraph memo. Fast triage.",
  },
  {
    key: "standard",
    label: "Standard",
    blurb: "2-3 sentence rationales, 3-4 paragraph memo. The default.",
  },
  {
    key: "comprehensive",
    label: "Comprehensive",
    blurb: "Deep rationales with cited figures, full IC-style memo.",
  },
];

function fmtDate(t: number) {
  return new Date(t).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SettingsClient({
  user,
  initialSettings,
  twoFactorEnabled: initial2fa,
  orgs,
  training,
}: {
  user: { email: string; name: string | null; isDemo: boolean; userId: number };
  initialSettings: UserSettings;
  twoFactorEnabled: boolean;
  orgs: OrgDetail[];
  training: TrainingInfo;
}) {
  const router = useRouter();

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Your account, your report format, your team, and your trained model.
        </p>
        {user.isDemo && (
          <p className="text-xs text-accent mt-2">
            You&apos;re on the demo account — changes here reset when the demo reseeds.
          </p>
        )}
      </div>

      <ProfileSection user={user} />
      <ReportSection initialSettings={initialSettings} />
      <TrainingSection training={training} onTrained={() => router.refresh()} />
      <OrgsSection orgs={orgs} userId={user.userId} onChanged={() => router.refresh()} />
      <SecuritySection initial2fa={initial2fa} isDemo={user.isDemo} />
    </main>
  );
}

function SectionCard({
  id,
  icon,
  title,
  blurb,
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-card/60 border border-card-border rounded-2xl p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <p className="text-xs text-muted mb-5 ml-12">{blurb}</p>
      <div className="ml-0 sm:ml-12">{children}</div>
    </section>
  );
}

function SaveFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="text-xs text-accent inline-flex items-center gap-1">
      <Check className="w-3 h-3" /> saved
    </span>
  );
}

// ---- Profile ----

function ProfileSection({
  user,
}: {
  user: { email: string; name: string | null };
}) {
  const [name, setName] = useState(user.name ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <SectionCard
      icon={<User className="w-4 h-4 text-accent" />}
      title="Profile"
      blurb="How you appear to teammates in shared organizations."
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted uppercase tracking-wider">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            placeholder="Your name"
            className="mt-1 w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted uppercase tracking-wider">Email</label>
          <input
            value={user.email}
            disabled
            className="mt-1 w-full bg-background/50 border border-card-border rounded-lg px-3 py-2 text-sm text-muted"
          />
        </div>
      </div>
      <div className="mt-2 h-4">
        {saving ? (
          <span className="text-xs text-muted">saving…</span>
        ) : (
          <SaveFlash show={saved} />
        )}
      </div>
    </SectionCard>
  );
}

// ---- Investor report configuration ----

function ReportSection({ initialSettings }: { initialSettings: UserSettings }) {
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(
    initialSettings.detailLevel,
  );
  const [dimensions, setDimensions] = useState<ReportDimension[]>(
    initialSettings.dimensions,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: { detailLevel?: DetailLevel; dimensions?: ReportDimension[] }) {
    setSaving(true);
    setError(null);
    const settings = {
      detailLevel: next.detailLevel ?? detailLevel,
      dimensions: next.dimensions ?? dimensions,
    };
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    if (data.settings) {
      setDetailLevel(data.settings.detailLevel);
      setDimensions(data.settings.dimensions);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function updateDim(i: number, patch: Partial<ReportDimension>) {
    setDimensions((dims) => dims.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }

  function addDim() {
    if (dimensions.length >= 10) return;
    const next = [
      ...dimensions,
      { key: `custom_${dimensions.length + 1}`, label: "", description: "" },
    ];
    setDimensions(next);
  }

  function removeDim(i: number) {
    if (dimensions.length <= 2) return;
    const next = dimensions.filter((_, j) => j !== i);
    setDimensions(next);
    save({ dimensions: next });
  }

  async function restoreDefaults() {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { detailLevel, dimensions: [] } }),
    });
    const data = await res.json();
    if (res.ok && data.settings) {
      setDimensions(data.settings.dimensions);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
  }

  return (
    <SectionCard
      icon={<SlidersHorizontal className="w-4 h-4 text-accent" />}
      title="Investor report"
      blurb="The dimensions every deck is scored on, and how detailed the write-up should be. Applies to your future analyses."
    >
      {/* Detail level */}
      <p className="text-xs text-muted uppercase tracking-wider mb-2">Detail level</p>
      <div className="grid sm:grid-cols-3 gap-2 mb-6">
        {DETAIL_LEVELS.map((l) => (
          <button
            key={l.key}
            onClick={() => {
              setDetailLevel(l.key);
              save({ detailLevel: l.key });
            }}
            className={`text-left rounded-xl border p-3 transition-colors ${
              detailLevel === l.key
                ? "border-accent/60 bg-accent/10"
                : "border-card-border bg-background/40 hover:border-foreground/20"
            }`}
          >
            <p className={`text-sm font-medium ${detailLevel === l.key ? "text-accent" : ""}`}>
              {l.label}
            </p>
            <p className="text-xs text-muted mt-1 leading-relaxed">{l.blurb}</p>
          </button>
        ))}
      </div>

      {/* Dimensions */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted uppercase tracking-wider">
          Scoring dimensions ({dimensions.length}/10)
        </p>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-muted">saving…</span>}
          <SaveFlash show={saved} />
          <button
            onClick={restoreDefaults}
            className="text-xs text-muted hover:text-foreground flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Restore defaults
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {dimensions.map((d, i) => (
          <div
            key={i}
            className="flex items-start gap-2 bg-background/40 border border-card-border rounded-xl p-3"
          >
            <GripVertical className="w-4 h-4 text-muted/50 mt-2 shrink-0" />
            <div className="flex-1 space-y-2">
              <input
                value={d.label}
                onChange={(e) => updateDim(i, { label: e.target.value })}
                onBlur={() => save({})}
                placeholder="Dimension name (e.g. Team Quality)"
                className="w-full bg-transparent border-b border-card-border focus:border-accent/50 px-1 py-1 text-sm font-medium focus:outline-none"
              />
              <input
                value={d.description}
                onChange={(e) => updateDim(i, { description: e.target.value })}
                onBlur={() => save({})}
                placeholder="What should the model assess here? (guides the analysis)"
                className="w-full bg-transparent px-1 py-0.5 text-xs text-muted focus:text-foreground focus:outline-none"
              />
            </div>
            <button
              onClick={() => removeDim(i)}
              disabled={dimensions.length <= 2}
              title="Remove dimension"
              className="text-muted hover:text-red-400 disabled:opacity-20 p-1 mt-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addDim}
        disabled={dimensions.length >= 10}
        className="mt-3 text-sm text-accent hover:text-accent-light disabled:opacity-30 flex items-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Add dimension
      </button>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      <p className="text-xs text-muted mt-4">
        Existing decks keep the rubric they were scored with; new analyses use
        this one.
      </p>
    </SectionCard>
  );
}

// ---- Model training ----

function TrainingSection({
  training,
  onTrained,
}: {
  training: TrainingInfo;
  onTrained: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<string | null>(training.profileMd);
  const [trainedAt, setTrainedAt] = useState<number | null>(training.trainedAt);
  const [expanded, setExpanded] = useState(false);

  async function train() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/train", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Training failed");
      setProfile(data.profile);
      setTrainedAt(data.trainedAt);
      setExpanded(true);
      onTrained();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Training failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <SectionCard
      id="training"
      icon={<Brain className="w-4 h-4 text-accent" />}
      title="Model training"
      blurb={`Train on the ${training.workspaceName} workspace's past deals — what you invested in, what you passed on, and how those bets turned out. The learned profile is fed into every new deck analysis.`}
    >
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button
          onClick={train}
          disabled={running || training.decidedCount < 3}
          className="bg-accent hover:bg-accent-light disabled:opacity-40 text-background font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm"
        >
          {running ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {running
            ? "Training on your deals…"
            : profile
              ? "Retrain model"
              : "Train model"}
        </button>
        <div className="text-xs text-muted">
          <p>
            {training.decidedCount} decided deals of {training.totalDecks} total
            {training.decidedCount < 3 && " — need at least 3 to train"}
          </p>
          {trainedAt && <p>Last trained {fmtDate(trainedAt)}</p>}
        </div>
      </div>
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      {profile && (
        <div className="bg-background/50 border border-card-border rounded-xl p-4">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-accent hover:text-accent-light mb-2"
          >
            {expanded ? "Hide learned profile" : "Show learned profile"}
          </button>
          {expanded && (
            <pre className="text-xs text-muted whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
              {profile}
            </pre>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ---- Organizations ----

function OrgsSection({
  orgs,
  userId,
  onChanged,
}: {
  orgs: OrgDetail[];
  userId: number;
  onChanged: () => void;
}) {
  const [newOrgName, setNewOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newOrgName }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error || "Could not create organization");
      return;
    }
    setNewOrgName("");
    onChanged();
  }

  return (
    <SectionCard
      id="organizations"
      icon={<Building2 className="w-4 h-4 text-accent" />}
      title="Organizations"
      blurb="Share one deal dashboard with your team. Members can add decks, record decisions, and update outcomes together."
    >
      {orgs.length === 0 && (
        <p className="text-sm text-muted mb-4">
          You&apos;re not in any organization yet. Create one and invite your
          partners.
        </p>
      )}
      <div className="space-y-4 mb-5">
        {orgs.map((org) => (
          <OrgCard key={org.id} org={org} userId={userId} onChanged={onChanged} />
        ))}
      </div>
      <form onSubmit={createOrg} className="flex gap-2">
        <input
          value={newOrgName}
          onChange={(e) => setNewOrgName(e.target.value)}
          placeholder="New organization name (e.g. Kindler Capital)"
          className="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
        />
        <button
          type="submit"
          disabled={creating || newOrgName.trim().length < 2}
          className="bg-accent hover:bg-accent-light disabled:opacity-40 text-background font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Create
        </button>
      </form>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </SectionCard>
  );
}

function OrgCard({
  org,
  userId,
  onChanged,
}: {
  org: OrgDetail;
  userId: number;
  onChanged: () => void;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManage = org.role === "owner" || org.role === "admin";

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setNotice(null);
    const res = await fetch(`/api/orgs/${org.id}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) {
      setError(data.error || "Invite failed");
      return;
    }
    setInviteEmail("");
    setNotice(
      data.emailSent
        ? `Invitation emailed to ${data.acceptUrl ? "" : ""}${inviteEmail || "the recipient"}.`
        : `Email delivery unavailable — share this link: ${data.acceptUrl}`,
    );
    onChanged();
  }

  async function removeMember(targetId: number) {
    setError(null);
    const res = await fetch(`/api/orgs/${org.id}/members/${targetId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not remove member");
      return;
    }
    onChanged();
  }

  return (
    <div className="bg-background/40 border border-card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4 text-accent" />
          {org.name}
          <span className="text-[10px] uppercase tracking-wider text-muted border border-card-border rounded px-1.5 py-0.5">
            {org.role}
          </span>
        </p>
      </div>
      <div className="space-y-1.5 mb-3">
        {org.members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-2 text-sm">
            <span className="flex-1 truncate">
              {m.name || m.email}
              {m.user_id === userId && (
                <span className="text-muted text-xs"> (you)</span>
              )}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted">
              {m.role}
            </span>
            {m.role !== "owner" && (canManage || m.user_id === userId) && (
              <button
                onClick={() => removeMember(m.user_id)}
                title={m.user_id === userId ? "Leave organization" : "Remove member"}
                className="text-muted hover:text-red-400 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {org.pendingInvites.map((i) => (
          <div key={i.id} className="flex items-center gap-2 text-sm text-muted">
            <Mail className="w-3.5 h-3.5" />
            <span className="flex-1 truncate">{i.email}</span>
            <span className="text-[10px] uppercase tracking-wider">
              invited · {i.role}
            </span>
          </div>
        ))}
      </div>
      {canManage && (
        <form onSubmit={invite} className="flex flex-wrap gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@firm.com"
            className="flex-1 min-w-[180px] bg-background border border-card-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent/50"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "member" | "admin")}
            className="bg-background border border-card-border rounded-lg px-2 py-1.5 text-sm focus:outline-none"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !inviteEmail}
            className="bg-card border border-card-border hover:border-accent/40 text-foreground text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
          >
            {inviting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            Invite
          </button>
        </form>
      )}
      {notice && <p className="text-xs text-accent mt-2 break-all">{notice}</p>}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}

// ---- Security ----

function SecuritySection({
  initial2fa,
  isDemo,
}: {
  initial2fa: boolean;
  isDemo: boolean;
}) {
  const [enabled, setEnabled] = useState(initial2fa);
  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function toggle2fa() {
    const next = !enabled;
    setEnabled(next);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ twoFactorEnabled: next }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg(null);
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPwSaving(false);
    if (!res.ok) {
      setPwMsg({ ok: false, text: data.error || "Password change failed" });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setPwMsg({ ok: true, text: "Password updated." });
  }

  return (
    <SectionCard
      icon={<ShieldCheck className="w-4 h-4 text-accent" />}
      title="Security"
      blurb="Two-factor authentication and password."
    >
      <div className="flex items-center justify-between bg-background/40 border border-card-border rounded-xl p-4 mb-5">
        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            Email two-factor authentication
            <SaveFlash show={saved} />
          </p>
          <p className="text-xs text-muted mt-0.5">
            Each sign-in requires a 6-digit code sent to your email.
            {isDemo && " (Not applicable to the demo account.)"}
          </p>
        </div>
        <button
          onClick={toggle2fa}
          disabled={isDemo}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 ${
            enabled ? "bg-accent" : "bg-card-border"
          }`}
          aria-label="Toggle two-factor authentication"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-background transition-all ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <form onSubmit={changePassword} className="space-y-2 max-w-sm">
        <p className="text-xs text-muted uppercase tracking-wider flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5" /> Change password
        </p>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          autoComplete="current-password"
          className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (8+ characters)"
          autoComplete="new-password"
          minLength={8}
          className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
        />
        <button
          type="submit"
          disabled={pwSaving || !currentPassword || newPassword.length < 8}
          className="bg-card border border-card-border hover:border-accent/40 text-sm px-4 py-2 rounded-lg disabled:opacity-40 flex items-center gap-2"
        >
          {pwSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Update password
        </button>
        {pwMsg && (
          <p className={`text-xs ${pwMsg.ok ? "text-accent" : "text-red-400"}`}>
            {pwMsg.text}
          </p>
        )}
      </form>
    </SectionCard>
  );
}
