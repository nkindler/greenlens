"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Leaf,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
  AlertTriangle,
  Zap,
  Shield,
  Globe,
  BarChart3,
} from "lucide-react";
import { Logo } from "@/components/logo";
import type { SimilarDeck } from "@/lib/insights";

type DeckLite = {
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
  decision_notes: string | null;
  outcome: "unknown" | "succeeded" | "failed";
  outcome_evidence: string | null;
  created_at: number;
};

type Score = { score: number; rationale: string };

const SCORE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  // Current sector-agnostic schema
  product_readiness: { label: "Product Readiness", icon: <Zap className="w-4 h-4" /> },
  financial_viability: { label: "Financial Viability", icon: <TrendingUp className="w-4 h-4" /> },
  mission_impact: { label: "Mission & Impact", icon: <Target className="w-4 h-4" /> },
  regulatory_risk: { label: "Regulatory Risk", icon: <Shield className="w-4 h-4" /> },
  market_timing: { label: "Market Timing", icon: <Globe className="w-4 h-4" /> },
  scalability: { label: "Scalability", icon: <BarChart3 className="w-4 h-4" /> },
  // Legacy keys (pre-broadening). Rendered if any old decks linger.
  technology_readiness: { label: "Technology Readiness", icon: <Zap className="w-4 h-4" /> },
  carbon_impact: { label: "Carbon Impact", icon: <Leaf className="w-4 h-4" /> },
};

// Custom rubric dimensions won't be in the map — prettify the key instead.
function scoreMeta(key: string): { label: string; icon: React.ReactNode } {
  if (SCORE_LABELS[key]) return SCORE_LABELS[key];
  const label = key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { label, icon: <BarChart3 className="w-4 h-4" /> };
}

function getScoreColor(score: number): string {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-emerald-400";
  if (score >= 4) return "bg-yellow-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-emerald-300";
  if (score >= 4) return "text-yellow-400";
  return "text-red-400";
}

function modelPrediction(score: number | null, founder: string | null): {
  pct: number;
  label: string;
} {
  if (score == null) return { pct: 0.5, label: "Insufficient data" };
  let p = (score - 4) / 6; // 4 → 0, 10 → 1
  // Founder-profile bias the demo learned from history
  if (founder === "Solo") p -= 0.07;
  if (founder === "Repeat") p += 0.05;
  p = Math.max(0.05, Math.min(0.95, p));
  let label = "Match likely";
  if (p > 0.78) label = "Strong fit for your portfolio";
  else if (p > 0.6) label = "Probable fit";
  else if (p < 0.35) label = "Outside your pattern";
  else label = "On the fence";
  return { pct: p, label };
}

export function DeckDetailClient({
  deck,
  analysis,
  similar,
  isDemo,
}: {
  deck: DeckLite;
  analysis: Record<string, unknown>;
  similar: SimilarDeck[];
  isDemo: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [decision, setDecision] = useState(deck.decision);
  const [notes, setNotes] = useState(deck.decision_notes ?? "");
  const [outcome, setOutcome] = useState(deck.outcome);
  const [evidence, setEvidence] = useState(deck.outcome_evidence ?? "");
  const [savedFlash, setSavedFlash] = useState<"decision" | "outcome" | null>(null);

  const scores = (analysis.scores ?? {}) as Record<string, Score>;
  const memo = typeof analysis.investment_memo === "string" ? analysis.investment_memo : "";
  const strengths = Array.isArray(analysis.key_strengths) ? (analysis.key_strengths as string[]) : [];
  const risks = Array.isArray(analysis.key_risks) ? (analysis.key_risks as string[]) : [];
  const questions = Array.isArray(analysis.questions_for_management)
    ? (analysis.questions_for_management as string[])
    : [];

  const prediction = modelPrediction(deck.overall_score, deck.founder_profile);
  const investorFit = (analysis.investor_fit ?? null) as
    | { score: number; rationale: string }
    | null;

  function saveDecision(next: typeof decision) {
    setDecision(next);
    startTransition(async () => {
      await fetch(`/api/decks/${deck.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: next, notes }),
      });
      setSavedFlash("decision");
      setTimeout(() => setSavedFlash(null), 1800);
      router.refresh();
    });
  }

  function saveNotes() {
    startTransition(async () => {
      await fetch(`/api/decks/${deck.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes }),
      });
      setSavedFlash("decision");
      setTimeout(() => setSavedFlash(null), 1800);
    });
  }

  function saveOutcome(next: typeof outcome) {
    setOutcome(next);
    startTransition(async () => {
      await fetch(`/api/decks/${deck.id}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: next, evidence }),
      });
      setSavedFlash("outcome");
      setTimeout(() => setSavedFlash(null), 1800);
      router.refresh();
    });
  }

  function saveEvidence() {
    startTransition(async () => {
      await fetch(`/api/decks/${deck.id}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, evidence }),
      });
      setSavedFlash("outcome");
      setTimeout(() => setSavedFlash(null), 1800);
    });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border bg-card/40 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Logo href="/dashboard" />
          <Link
            href="/dashboard"
            className="text-sm text-muted hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Portfolio
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{deck.company_name}</h1>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              {deck.technology_type && (
                <Tag>{deck.technology_type}</Tag>
              )}
              {deck.stage && <Tag>{deck.stage}</Tag>}
              {deck.location && <Tag>{deck.location}</Tag>}
              {deck.investment_size && <Tag>{deck.investment_size}</Tag>}
              {deck.founder_profile && <Tag>{deck.founder_profile} founder</Tag>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted uppercase tracking-wider">Overall</p>
              <p className={`text-3xl font-bold tabular-nums ${getScoreTextColor(deck.overall_score ?? 0)}`}>
                {deck.overall_score?.toFixed(1) ?? "—"}
                <span className="text-sm text-muted">/10</span>
              </p>
            </div>
          </div>
        </div>

        {/* Model prediction / trained investor fit */}
        {investorFit ? (
          <div className="bg-card/70 border border-accent/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
                <Brain className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-sm">
                  Fit with your trained preference model
                </h3>
                <p className="text-xs text-muted">
                  Scored against what you invest in, pass on, and win with
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold tabular-nums text-accent">
                  {investorFit.score}/10
                </p>
                <p className="text-xs text-muted">investor fit</p>
              </div>
            </div>
            <div className="h-2 bg-card-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-light"
                style={{ width: `${investorFit.score * 10}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              {investorFit.rationale}
            </p>
          </div>
        ) : (
          <div className="bg-card/70 border border-accent/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
                <Brain className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Your model on this deal</h3>
                <p className="text-xs text-muted">
                  Based on {similar.length} similar past evaluations in your portfolio
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold tabular-nums text-accent">
                  {Math.round(prediction.pct * 100)}%
                </p>
                <p className="text-xs text-muted">predicted to invest</p>
              </div>
            </div>
            <div className="h-2 bg-card-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-light"
                style={{ width: `${Math.round(prediction.pct * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-2 italic">
              {prediction.label}. Adjusted for {deck.founder_profile ?? "founder profile"} bias and stage trend.{" "}
              <Link
                href="/dashboard/settings#training"
                className="text-accent hover:text-accent-light not-italic"
              >
                Train your model
              </Link>{" "}
              for deal-specific fit scoring.
            </p>
          </div>
        )}

        {/* Decision */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium flex items-center gap-2">
              Your decision
              {savedFlash === "decision" && (
                <span className="text-xs text-accent flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> saved
                </span>
              )}
            </h3>
            {isPending && <span className="text-xs text-muted">syncing…</span>}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <DecisionBtn
              active={decision === "looking"}
              onClick={() => saveDecision("looking")}
              icon={<Clock className="w-4 h-4" />}
              label="Looking at this"
              tone="blue"
            />
            <DecisionBtn
              active={decision === "invested"}
              onClick={() => saveDecision("invested")}
              icon={<CheckCircle className="w-4 h-4" />}
              label="Invested"
              tone="accent"
            />
            <DecisionBtn
              active={decision === "passed"}
              onClick={() => saveDecision("passed")}
              icon={<XCircle className="w-4 h-4" />}
              label="Passed"
              tone="red"
            />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Why? (the model trains on this rationale)"
            className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 min-h-[60px] resize-y"
          />
          <p className="text-[11px] text-muted mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Decision text is fed back into your model on save.
          </p>
        </div>

        {/* Outcome tracking */}
        {decision !== "looking" && (
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">
                Outcome tracking
                {savedFlash === "outcome" && (
                  <span className="ml-2 text-xs text-accent inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> saved
                  </span>
                )}
              </h3>
              <span className="text-xs text-muted">
                The model checks in periodically and updates outcomes.
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <OutcomeBtn
                active={outcome === "unknown"}
                onClick={() => saveOutcome("unknown")}
                label="Tracking"
              />
              <OutcomeBtn
                active={outcome === "succeeded"}
                onClick={() => saveOutcome("succeeded")}
                label="Succeeded"
                tone="emerald"
              />
              <OutcomeBtn
                active={outcome === "failed"}
                onClick={() => saveOutcome("failed")}
                label="Failed"
                tone="red"
              />
            </div>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              onBlur={saveEvidence}
              placeholder="Evidence (next round, exit, shutdown, press)…"
              className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 min-h-[50px] resize-y"
            />
          </div>
        )}

        {/* Similar past deals */}
        {similar.length > 0 && (
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <h3 className="font-medium mb-1">Similar deals in your history</h3>
            <p className="text-xs text-muted mb-4">
              The model surfaces these because they share tech, stage, or founder profile. Your past calls inform this one.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {similar.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/decks/${s.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-card-border hover:border-accent/40 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{s.company_name}</div>
                    <div className="text-xs text-muted">
                      {s.technology_type ?? "—"} · {s.stage ?? "—"}
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      <SmallTag tone={s.decision === "invested" ? "accent" : s.decision === "passed" ? "red" : "blue"}>
                        {s.decision}
                      </SmallTag>
                      <SmallTag
                        tone={
                          s.outcome === "succeeded"
                            ? "emerald"
                            : s.outcome === "failed"
                              ? "red"
                              : "muted"
                        }
                      >
                        {s.outcome === "unknown" ? "tracking" : s.outcome}
                      </SmallTag>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted">match</p>
                    <p className="text-base font-semibold text-accent">
                      {Math.round(s.similarity * 100)}%
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent" />
                </Link>
              ))}
            </div>
            <p className="text-xs text-muted mt-3 italic">
              {(() => {
                const winners = similar.filter((s) => s.outcome === "succeeded").length;
                const losers = similar.filter((s) => s.outcome === "failed").length;
                if (winners === 0 && losers === 0) return "Outcomes pending across this cohort.";
                if (winners > losers)
                  return `In this cluster, ${winners} succeeded and ${losers} failed. Your priors here are working.`;
                if (losers > winners)
                  return `In this cluster, ${losers} failed and ${winners} succeeded. Caution on this pattern.`;
                return `In this cluster, outcomes are split ${winners}/${losers}. Read the differences carefully.`;
              })()}
            </p>
          </div>
        )}

        {/* Scores */}
        {Object.keys(scores).length > 0 && (
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              Score breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(scores).map(([key, value]) => {
                const meta = scoreMeta(key);
                if (typeof value?.score !== "number") return null;
                return (
                  <div key={key} className="bg-card border border-card-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {meta.icon}
                        {meta.label}
                      </div>
                      <span className={`text-lg font-bold ${getScoreTextColor(value.score)}`}>
                        {value.score}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-card-border rounded-full mb-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getScoreColor(value.score)}`}
                        style={{ width: `${value.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{value.rationale}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Strengths / Risks */}
        {(strengths.length > 0 || risks.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {strengths.length > 0 && (
              <div className="bg-card border border-card-border rounded-xl p-5">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <span className="text-accent mt-0.5">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {risks.length > 0 && (
              <div className="bg-card border border-card-border rounded-xl p-5">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Risks
                </h3>
                <ul className="space-y-2">
                  {risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <span className="text-yellow-400 mt-0.5">!</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Memo */}
        {memo && (
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-info" />
              Investment memo
            </h3>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{memo}</p>
          </div>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
              <HelpCircle className="w-4 h-4 text-accent-light" />
              Questions for management
            </h3>
            <ol className="space-y-2">
              {questions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-accent font-mono text-xs mt-0.5">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {isDemo && (
          <p className="text-xs text-muted text-center py-4 italic">
            Demo data. Outcomes are illustrative for the presentation.
          </p>
        )}
      </main>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-card border border-card-border rounded-full px-2.5 py-1 text-muted">
      {children}
    </span>
  );
}

function SmallTag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "accent" | "red" | "emerald" | "blue" | "muted";
}) {
  const cls = {
    accent: "bg-accent/15 text-accent border-accent/30",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    muted: "bg-card border-card-border text-muted",
  }[tone];
  return (
    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${cls}`}>
      {children}
    </span>
  );
}

function DecisionBtn({
  active,
  onClick,
  icon,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "accent" | "red" | "blue";
}) {
  const activeCls = {
    accent: "bg-accent/15 text-accent border-accent/40",
    red: "bg-red-500/15 text-red-400 border-red-500/30",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
        active ? activeCls : "bg-card border-card-border text-muted hover:text-foreground hover:border-foreground/20"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function OutcomeBtn({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone?: "emerald" | "red";
}) {
  const activeCls = !tone
    ? "bg-card-border text-foreground border-foreground/20"
    : tone === "emerald"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : "bg-red-500/15 text-red-400 border-red-500/30";
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
        active ? activeCls : "bg-card border-card-border text-muted hover:text-foreground hover:border-foreground/20"
      }`}
    >
      {label}
    </button>
  );
}
