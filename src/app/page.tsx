import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  Leaf,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Atmospheric background, replaces flat fill */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 0%, rgba(16,185,129,0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 0% 30%, rgba(52,211,153,0.06), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 30%, black 30%, transparent 80%)",
        }}
      />

      <header className="relative border-b border-card-border/60 bg-background/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-accent" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Deck<span className="text-accent">Ranker</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/login"
              className="text-sm text-muted hover:text-foreground px-3 py-1.5 rounded-lg"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-accent hover:bg-accent-light text-background font-medium px-3 py-1.5 rounded-lg"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main className="relative flex-1 max-w-6xl mx-auto px-6 py-14 md:py-20 w-full">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left: hero text, left-aligned */}
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-accent border border-accent/25 bg-accent/5 rounded-full px-2.5 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Investor pattern intelligence
            </span>
            <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-bold leading-[1.02] tracking-tight">
              Your deals.
              <br />
              <span className="text-accent">Your model.</span>
              <br />
              <span className="text-foreground/85">Your blindspots.</span>
            </h1>
            <p className="mt-6 text-muted text-lg leading-relaxed max-w-lg">
              Upload a deck. Mark invested or passed. DeckRanker learns from
              every decision and the outcome, then surfaces the deals you
              should have backed and the patterns where you lose money.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/login"
                className="group bg-accent hover:bg-accent-light text-background font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_0_1px_rgba(16,185,129,0.4),0_8px_30px_-12px_rgba(16,185,129,0.6)]"
              >
                <Sparkles className="w-4 h-4" />
                Try the demo investor
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/signup"
                className="text-foreground/80 hover:text-foreground font-medium px-5 py-3 rounded-xl flex items-center justify-center gap-2"
              >
                Create your account
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted">
              Pre-seeded portfolio. Real model insights. No signup needed for the demo.
            </p>
          </div>

          {/* Right: a real product fragment, the actual visual anchor */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-accent/10 to-transparent blur-3xl pointer-events-none" />

            {/* Stack of two real-looking widgets, slightly offset */}
            <div className="relative">
              <ModelWidgetPreview />
              <div className="mt-4 grid grid-cols-1 gap-3">
                <BlindspotPreview
                  kind="missed"
                  title="You pass on Solar PV winners"
                  detail="2 Solar PV deals you passed on later succeeded. Reconsider your thesis here."
                />
                <BlindspotPreview
                  kind="trap"
                  title="Green Hydrogen is a recurring loss"
                  detail="2 hydrogen investments failed. Pattern: high carbon score paired with weak financials."
                />
              </div>
            </div>
          </div>
        </div>

        {/* What changes for you, single row, asymmetric not 3-col */}
        <div className="mt-24 md:mt-32 border-t border-card-border/60 pt-12">
          <p className="text-xs uppercase tracking-[0.18em] text-muted mb-3">
            How it actually works
          </p>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 max-w-5xl">
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Every decision is a training signal.
              </h2>
              <p className="text-muted leading-relaxed">
                Mark invested, passed, or looking. Add a one-line rationale.
                When the outcome lands, the model recomputes your hit rate by
                stage, sector, and founder profile, and finds the patterns
                you can&apos;t see from inside your own deal flow.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Blindspots, named and quantified.
              </h2>
              <p className="text-muted leading-relaxed">
                The model tracks the calls you got right, the wins you
                walked away from, and the categories where you keep losing
                money. Not vibes. Counts, with the deck names attached.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative border-t border-card-border/60 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-xs text-muted flex items-center justify-between flex-wrap gap-2">
          <span>DeckRanker</span>
          <span>Pattern intelligence for the climate-tech investor</span>
        </div>
      </footer>
    </div>
  );
}

function ModelWidgetPreview() {
  return (
    <div className="relative bg-card/80 backdrop-blur border border-accent/30 rounded-2xl p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">
              Your investor model
            </p>
            <p className="text-[11px] text-muted">
              Trained on 212 signals · last retrained 9 min ago
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Live
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <PreviewMetric label="Hit rate" value="40%" hint="5 invested · 9 resolved" />
        <PreviewMetric
          label="Accuracy"
          value="56%"
          hint="Decision vs. recommended"
          accent
        />
        <PreviewMetric
          label="Confidence"
          value="92%"
          hint="15 decks training"
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
        <PreviewPill icon={<CheckCircle className="w-3 h-3" />} label="Invested" count={5} tone="accent" />
        <PreviewPill icon={<XCircle className="w-3 h-3" />} label="Passed" count={7} tone="red" />
        <PreviewPill icon={<Clock className="w-3 h-3" />} label="Looking" count={3} tone="blue" />
      </div>
    </div>
  );
}

function PreviewMetric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted mb-1">{label}</p>
      <p
        className={`text-2xl font-semibold tabular-nums leading-none ${accent ? "text-accent" : ""}`}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted mt-1">{hint}</p>
    </div>
  );
}

function PreviewPill({
  icon,
  label,
  count,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  tone: "accent" | "red" | "blue";
}) {
  const cls = {
    accent: "bg-accent/10 text-accent border-accent/25",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  }[tone];
  return (
    <div className={`rounded-md border px-2 py-1 ${cls} flex items-center gap-1.5`}>
      {icon}
      <span className="uppercase tracking-wider">{label}</span>
      <span className="ml-auto font-semibold tabular-nums">{count}</span>
    </div>
  );
}

function BlindspotPreview({
  kind,
  title,
  detail,
}: {
  kind: "missed" | "trap";
  title: string;
  detail: string;
}) {
  const icon =
    kind === "missed" ? (
      <TrendingUp className="w-4 h-4 text-emerald-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  const ring =
    kind === "missed"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : "border-red-500/30 bg-red-500/5";
  return (
    <div className={`rounded-xl border ${ring} p-4 backdrop-blur`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-background/40 border border-card-border flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted leading-relaxed mt-0.5">{detail}</p>
        </div>
      </div>
    </div>
  );
}
