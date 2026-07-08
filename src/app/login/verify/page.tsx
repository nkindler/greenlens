"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(value: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.expired) {
          router.push("/login");
          return;
        }
        throw new Error(data.error || "Verification failed");
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setLoading(false);
    }
  }

  async function resend() {
    setError(null);
    setResent(false);
    const res = await fetch("/api/auth/2fa/resend", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      if (data.expired) {
        router.push("/login");
        return;
      }
      setError(data.error || "Could not resend the code");
      return;
    }
    setResent(true);
  }

  function onChange(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && !loading) submit(digits);
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-6">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.10), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <div className="bg-card/70 border border-card-border rounded-2xl p-8">
          <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center mb-5">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-xl font-semibold mb-1">Check your email</h1>
          <p className="text-sm text-muted mb-6">
            We sent a 6-digit verification code to your email. It expires in 10
            minutes.
          </p>
          <input
            ref={inputRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          />
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
          {resent && (
            <p className="text-sm text-accent mt-3 flex items-center gap-1.5">
              <MailCheck className="w-4 h-4" /> New code sent.
            </p>
          )}
          <button
            onClick={() => code.length === 6 && submit(code)}
            disabled={loading || code.length !== 6}
            className="w-full mt-4 py-3 px-4 bg-accent hover:bg-accent-light disabled:opacity-40 text-background font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Verify & sign in
          </button>
          <div className="flex items-center justify-between mt-5 text-sm">
            <button
              onClick={resend}
              className="text-accent hover:text-accent-light"
              type="button"
            >
              Resend code
            </button>
            <Link href="/login" className="text-muted hover:text-foreground">
              Back to sign in
            </Link>
          </div>
        </div>
        <p className="text-xs text-muted text-center mt-6">
          Two-factor authentication protects your deal flow. Manage it in
          Settings.
        </p>
      </div>
    </div>
  );
}
