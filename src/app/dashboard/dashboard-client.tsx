"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Brain,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { Blindspot, InvestorModel } from "@/lib/insights";

type SlimDeck = {
  id: number;
  company_name: string;
  technology_type: string | null;
  location: string | null;
  investment_size: string | null;
  stage: string | null;
  founder_profile: string | null;
  overall_score: number | null;
  recommendation: string | null;
  decision: "looking" | "invested" | "passed";
  outcome: "unknown" | "succeeded" | "failed";
  created_at: number;
};

const FILTERS: Array<{
  key: "all" | "looking" | "invested" | "passed";
  label: string;
}> = [
  { key: "all", label: "All decks" },
  { key: "looking", label: "In review" },
  { key: "invested", label: "Invested" },
  { key: "passed", label: "Passed" },
];

const OUTCOME_FILTERS: Array<{
  key: "all" | "unknown" | "succeeded" | "failed";
  label: string;
}> = [
  { key: "all", label: "Any outcome" },
  { key: "succeeded", label: "Succeeded" },
  { key: "failed", label: "Failed" },
  { key: "unknown", label: "Tracking" },
];

function fmtPct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function fmtAge(t: number) {
  const days = Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} mo ago`;
}

function fmtDate(t: number) {
  return new Date(t).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function decisionStyle(d: SlimDeck["decision"]) {
  if (d === "invested") return "bg-accent/15 text-accent border-accent/30";
  if (d === "passed") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-blue-500/10 text-blue-400 border-blue-500/20";
}

function outcomeStyle(o: SlimDeck["outcome"]) {
  if (o === "succeeded")
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (o === "failed") return "bg-red-500/15 text-red-400 border-red-500/30";
  return "bg-card border-card-border text-muted";
}

function severityStyle(s: Blindspot["severity"]) {
  if (s === "high") return "border-red-500/40 bg-red-500/5";
  if (s === "medium") return "border-yellow-500/30 bg-yellow-500/5";
  return "border-card-border bg-card/50";
}

function severityChipStyle(s: Blindspot["severity"]) {
  if (s === "high") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (s === "medium")
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  return "bg-card-border/50 text-muted border-card-border";
}

function blindspotIcon(kind: Blindspot["kind"]) {
  if (kind === "missed_win")
    return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (kind === "value_trap")
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  if (kind === "thesis_drift")
    return <Activity className="w-4 h-4 text-yellow-400" />;
  return <Clock className="w-4 h-4 text-blue-400" />;
}

export function DashboardClient({
  user,
  workspaceName,
  isOrgWorkspace,
  decks,
  model,
  blindspots,
  trainedProfile,
}: {
  user: { email: string; name: string | null; isDemo: boolean };
  workspaceName: string;
  isOrgWorkspace: boolean;
  decks: SlimDeck[];
  model: InvestorModel;
  blindspots: Blindspot[];
  trainedProfile: { trainedAt: number } | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [outcomeFilter, setOutcomeFilter] =
    useState<(typeof OUTCOME_FILTERS)[number]["key"]>("all");
  const [query, setQuery] = useState("");

  const visibleDecks = useMemo(() => {
    let out = decks;
    if (filter !== "all") out = out.filter((d) => d.decision === filter);
    if (outcomeFilter !== "all")
      out = out.filter((d) => d.outcome === outcomeFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (d) =>
          d.company_name.toLowerCase().includes(q) ||
          (d.technology_type ?? "").toLowerCase().includes(q) ||
          (d.location ?? "").toLowerCase().includes(q),
      );
    }
    return out;
  }, [decks, filter, outcomeFilter, query]);

  function jumpToFilter(key: (typeof FILTERS)[number]["key"]) {
    setFilter(key);
    if (typeof document !== "undefined") {
      document
        .getElementById("portfolio")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Workspace banner */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {isOrgWorkspace && <Building2 className="w-5 h-5 text-accent" />}
            {workspaceName} deal flow
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {isOrgWorkspace
              ? "Shared dashboard — every member sees and updates these deals."
              : "Your private dashboard."}
          </p>
        </div>
        {trainedProfile ? (
          <Link
            href="/dashboard/settings#training"
            className="text-xs bg-accent/10 border border-accent/30 text-accent rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:bg-accent/15"
          >
            <Brain className="w-3.5 h-3.5" />
            Preference model trained {fmtDate(trainedProfile.trainedAt)}
          </Link>
        ) : (
          <Link
            href="/dashboard/settings#training"
            className="text-xs bg-card border border-card-border text-muted rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:text-foreground hover:border-accent/40"
          >
            <Brain className="w-3.5 h-3.5" />
            Train your preference model
          </Link>
        )}
      </div>

      {/* Investor Model widget */}
      <section className="bg-card/70 border border-accent/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
                <Brain className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  Your investor model
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Live
                  </span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Learning from {model.totalDecks} decks and{" "}
                  {model.knownOutcomes} resolved outcomes
                </p>
              </div>
            </div>
            <Link
              href="#blindspots"
              className="text-xs text-accent hover:text-accent-light flex items-center gap-1"
            >
              See blindspots <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric
              label="Hit rate"
              value={model.hitRate == null ? "—" : fmtPct(model.hitRate)}
              hint={
                model.hitRate == null
                  ? "Mark outcomes to score"
                  : `${model.knownOutcomes} resolved outcomes`
              }
            />
            <Metric
              label="Model accuracy"
              value={fmtPct(model.modelAccuracy)}
              hint="Decision vs. recommended"
              accent
            />
            <Metric
              label="Missed wins"
              value={String(model.missedWins)}
              hint="Passes that later succeeded"
            />
            <Metric
              label="Traps triggered"
              value={String(model.trapsTriggered)}
              hint="Investments that failed"
            />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Pill
              label="Invested"
              count={model.invested}
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              tone="accent"
              active={filter === "invested"}
              onClick={() => jumpToFilter("invested")}
            />
            <Pill
              label="Passed"
              count={model.passed}
              icon={<XCircle className="w-3.5 h-3.5" />}
              tone="red"
              active={filter === "passed"}
              onClick={() => jumpToFilter("passed")}
            />
            <Pill
              label="In review"
              count={model.looking}
              icon={<Clock className="w-3.5 h-3.5" />}
              tone="blue"
              active={filter === "looking"}
              onClick={() => jumpToFilter("looking")}
            />
          </div>
        </div>
      </section>

      {/* Blindspots */}
      <section id="blindspots">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            Pattern signals from your model
          </h2>
          <p className="text-xs text-muted">Updated continuously</p>
        </div>
        {blindspots.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-6 text-sm text-muted text-center">
            The model needs more outcome data before it surfaces patterns. Mark
            a few deals invested or passed and update outcomes when known.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blindspots.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl border p-5 ${severityStyle(b.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-background/40 flex items-center justify-center shrink-0 border border-card-border">
                    {blindspotIcon(b.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="font-medium text-sm">{b.title}</h3>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 border ${severityChipStyle(b.severity)}`}
                      >
                        {b.severity}
                      </span>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">
                      {b.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Portfolio */}
      <section id="portfolio">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Evaluated decks
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deals…"
                className="bg-card border border-card-border rounded-lg pl-8 pr-3 py-1.5 text-xs w-40 focus:w-52 transition-all focus:outline-none focus:border-accent/50"
              />
            </div>
            <div className="flex gap-1 bg-card rounded-lg p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filter === f.key
                      ? "bg-accent/20 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-card rounded-lg p-1">
              {OUTCOME_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setOutcomeFilter(f.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    outcomeFilter === f.key
                      ? "bg-accent/20 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {visibleDecks.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-10 text-center">
            <FileText className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-muted mb-4">No decks match.</p>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-background font-medium px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Analyze a deck
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background/40 border-b border-card-border text-xs text-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Company</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                    Stage
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Score</th>
                  <th className="text-left px-4 py-3 font-medium">Decision</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                    Outcome
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                    Evaluated
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleDecks.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-card-border last:border-b-0 hover:bg-background/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/decks/${d.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.company_name}</div>
                      <div className="text-xs text-muted">
                        {d.technology_type ?? "—"}
                        {d.location ? ` · ${d.location}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted">
                      {d.stage ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-foreground">
                        {d.overall_score?.toFixed(1) ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-md border capitalize ${decisionStyle(d.decision)}`}
                      >
                        {d.decision === "looking" ? "in review" : d.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-md border capitalize ${outcomeStyle(d.outcome)}`}
                      >
                        {d.outcome === "unknown" ? "tracking" : d.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted text-xs">
                      {fmtAge(d.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {user.isDemo && (
        <p className="text-xs text-muted text-center pt-4 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3" />
          You&apos;re viewing the demo investor. Decisions and uploads persist
          in this browser session.
        </p>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wider mb-1">{label}</p>
      <p
        className={`text-3xl font-semibold tabular-nums ${accent ? "text-accent" : ""}`}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

function Pill({
  label,
  count,
  icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  tone: "accent" | "red" | "blue";
  active?: boolean;
  onClick?: () => void;
}) {
  const idle = {
    accent: "bg-accent/10 text-accent border-accent/30 hover:bg-accent/15",
    red: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/15",
  }[tone];
  const activeCls = {
    accent: "bg-accent/25 text-accent border-accent/60 ring-2 ring-accent/30",
    red: "bg-red-500/20 text-red-400 border-red-500/40 ring-2 ring-red-500/20",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/40 ring-2 ring-blue-500/20",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 flex items-center gap-2 transition-all text-left ${active ? activeCls : idle}`}
    >
      {icon}
      <span className="text-xs uppercase tracking-wider">{label}</span>
      <span className="ml-auto font-semibold tabular-nums">{count}</span>
    </button>
  );
}
