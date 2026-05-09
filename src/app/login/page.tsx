"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"login" | "demo" | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("login");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(null);
    }
  }

  async function handleDemo() {
    setError(null);
    setLoading("demo");
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) throw new Error("Demo unavailable");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo failed");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-3 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-accent" />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            Deck<span className="text-accent">Ranker</span>
          </span>
        </Link>

        <button
          onClick={handleDemo}
          disabled={loading !== null}
          className="w-full mb-4 py-3 px-4 bg-accent hover:bg-accent-light disabled:opacity-50 text-background font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading === "demo" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Try the demo investor
        </button>
        <p className="text-xs text-muted text-center mb-8">
          Pre-seeded portfolio, real model insights, no signup.
        </p>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-card-border" />
          <span className="text-xs text-muted">or sign in</span>
          <div className="flex-1 h-px bg-card-border" />
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
          />
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading !== null}
            className="w-full py-3 px-4 bg-card border border-card-border hover:border-accent/50 disabled:opacity-50 text-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading === "login" && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          New here?{" "}
          <Link href="/signup" className="text-accent hover:text-accent-light">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
