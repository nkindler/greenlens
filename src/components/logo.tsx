import Link from "next/link";
import { TrendingUp } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/30 flex items-center justify-center shadow-[0_0_20px_-6px_rgba(16,185,129,0.5)]">
        <TrendingUp className="w-5 h-5 text-accent" />
      </div>
      <span className="text-lg font-semibold tracking-tight">
        Deck<span className="text-accent">Ranker</span>
      </span>
    </Link>
  );
}
