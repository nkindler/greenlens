import { redirect } from "next/navigation";
import Link from "next/link";
import { Brain, Leaf, Sparkles, Target, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-card-border bg-card/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Deck<span className="text-accent">Ranker</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-foreground">
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

      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-accent border border-accent/30 bg-accent/10 rounded-full px-3 py-1 mb-6">
            <Sparkles className="w-3 h-3" /> Investor pattern intelligence
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">
            Your deals.
            <br />
            <span className="text-accent">Your model.</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Upload a deck. Get a structured evaluation. Mark invested or passed.
            DeckRanker learns from your decisions and the outcomes — and shows
            you the deals you should have invested in, the patterns where you
            lose money, and the blindspots in your thesis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="/login"
              className="bg-accent hover:bg-accent-light text-background font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Try the demo investor
            </Link>
            <Link
              href="/signup"
              className="bg-card border border-card-border hover:border-accent/40 text-foreground font-medium px-6 py-3 rounded-xl"
            >
              Create your account
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
          {[
            {
              icon: <Brain className="w-5 h-5" />,
              title: "Trained on your calls",
              body: "The model takes every invested / passed / looking decision and the eventual outcome. Your priors compound.",
            },
            {
              icon: <Target className="w-5 h-5" />,
              title: "Blindspot detection",
              body: "Sectors you pass on that succeed. Patterns where you invest and deals fail. Surfaced as actionable signals, not vague vibes.",
            },
            {
              icon: <TrendingUp className="w-5 h-5" />,
              title: "Outcome tracking",
              body: "Every deal gets followed. Wins train the model. Losses tighten it. You always have a data check on your behavior.",
            },
          ].map((f, i) => (
            <div key={i} className="bg-card border border-card-border rounded-2xl p-6">
              <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h3 className="font-medium mb-1">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-card-border py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-muted">
          DeckRanker — pattern intelligence for the climate-tech investor
        </div>
      </footer>
    </div>
  );
}
