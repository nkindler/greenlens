"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  CheckCircle,
  Clock,
  Loader2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Logo } from "@/components/logo";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div>
        <div className="mb-10">
          <Logo />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight mb-1">
          Create your account.
        </h1>
        <p className="text-muted mb-8">
          The model starts learning the moment you upload your first deck.
        </p>

        <form onSubmit={handleSignup} className="space-y-3">
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-accent hover:bg-accent-light disabled:opacity-50 text-background font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create account
          </button>
        </form>

        <p className="text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-accent-light">
            Sign in
          </Link>
        </p>
        <p className="text-xs text-muted mt-4">
          Accounts are protected with email two-factor authentication. You can
          manage it later in Settings.
        </p>
      </div>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 70% 0%, rgba(16,185,129,0.10), transparent 60%)",
        }}
      />
      <div className="relative grid lg:grid-cols-[minmax(380px,520px)_1fr] min-h-screen">
        <div className="flex items-center justify-center px-6 py-12 lg:py-10 border-r border-card-border/60">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <div className="hidden lg:flex items-center justify-center px-10 py-12">
          <AuthMarketingPanel />
        </div>
      </div>
    </div>
  );
}

function AuthMarketingPanel() {
  return (
    <div className="max-w-md w-full">
      <p className="text-[11px] uppercase tracking-[0.18em] text-accent mb-5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        What you get
      </p>
      <h2 className="text-2xl font-semibold leading-tight mb-2">
        A model that gets sharper every time you make a call.
      </h2>
      <p className="text-sm text-muted mb-8">
        Live signals from the demo investor&apos;s portfolio. Yours looks
        the same after a few decks.
      </p>

      <div className="bg-card/80 backdrop-blur border border-accent/30 rounded-2xl p-5 mb-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">Your investor model</p>
            <p className="text-[11px] text-muted">Trained on 212 signals</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Stat label="Hit rate" value="40%" />
          <Stat label="Accuracy" value="56%" accent />
          <Stat label="Confidence" value="92%" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <Pill icon={<CheckCircle className="w-3 h-3" />} label="Invested" count={5} tone="accent" />
          <Pill icon={<XCircle className="w-3 h-3" />} label="Passed" count={7} tone="red" />
          <Pill icon={<Clock className="w-3 h-3" />} label="Looking" count={3} tone="blue" />
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-background/40 border border-card-border flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium">You pass on Solar PV winners</p>
            <p className="text-xs text-muted leading-relaxed mt-0.5">
              2 Solar PV deals you passed on later succeeded. Reconsider your thesis here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted mb-1">{label}</p>
      <p
        className={`text-xl font-semibold tabular-nums leading-none ${accent ? "text-accent" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Pill({
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
    <div className={`rounded-md border px-1.5 py-1 ${cls} flex items-center gap-1`}>
      {icon}
      <span className="uppercase tracking-wider">{label}</span>
      <span className="ml-auto font-semibold tabular-nums">{count}</span>
    </div>
  );
}
