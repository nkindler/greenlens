"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Leaf,
  Loader2,
  Upload,
} from "lucide-react";

type AnalysisShape = {
  project_name?: string;
  technology_type?: string;
  location?: string;
  investment_size?: string;
  stage?: string;
  founder_profile?: string;
  geography?: string;
  overall_score?: number;
  recommendation?: string;
  scores?: Record<string, { score: number; rationale: string }>;
  key_strengths?: string[];
  key_risks?: string[];
  investment_memo?: string;
  questions_for_management?: string[];
};

export function UploadClient({ isDemo }: { isDemo: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [phase, setPhase] = useState<"idle" | "analyzing" | "saving">("idle");

  const handleAnalyzeAndSave = useCallback(
    async (file?: File, text?: string) => {
      setLoading(true);
      setError(null);
      setPhase("analyzing");
      try {
        const formData = new FormData();
        if (file) formData.append("file", file);
        else if (text) formData.append("text", text);

        const res = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        const analysis: AnalysisShape = data.analysis;

        setPhase("saving");
        const saveRes = await fetch("/api/decks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysis }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData.error || "Save failed");

        router.push(`/dashboard/decks/${saveData.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setPhase("idle");
        setLoading(false);
      }
    },
    [router],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        setFileName(file.name);
        handleAnalyzeAndSave(file);
      }
    },
    [handleAnalyzeAndSave],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        handleAnalyzeAndSave(file);
      }
    },
    [handleAnalyzeAndSave],
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border bg-card/40 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-accent" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Deck<span className="text-accent">Ranker</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Portfolio
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-1">Analyze a new deal</h1>
        <p className="text-muted mb-8">
          The model evaluates the deck and adds it to your portfolio. You can
          mark invested / passed / looking from the deck detail page.
        </p>

        {!loading && (
          <>
            <div className="flex gap-1 mb-6 bg-card rounded-lg p-1 w-fit">
              <button
                onClick={() => setInputMode("upload")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === "upload"
                    ? "bg-accent/20 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Upload PDF
              </button>
              <button
                onClick={() => setInputMode("paste")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === "paste"
                    ? "bg-accent/20 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Paste text
              </button>
            </div>

            {inputMode === "upload" ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-accent bg-accent/5"
                    : "border-card-border hover:border-accent/50 hover:bg-card/50"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx,.md"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? "text-accent" : "text-muted"}`} />
                <p className="text-base font-medium mb-1">
                  {fileName ?? "Drop a deal document here"}
                </p>
                <p className="text-sm text-muted">PDF, TXT, DOC. Pitch decks, term sheets, memos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste the deal summary, term sheet, or pitch text…"
                  className="w-full h-56 bg-card border border-card-border rounded-2xl p-5 text-foreground placeholder:text-muted resize-none focus:outline-none focus:border-accent/50"
                />
                <button
                  onClick={() => textInput.trim() && handleAnalyzeAndSave(undefined, textInput)}
                  disabled={!textInput.trim()}
                  className="w-full py-3 px-6 bg-accent hover:bg-accent-light disabled:opacity-30 disabled:cursor-not-allowed text-background font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Analyze & save to portfolio
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 text-accent mx-auto mb-5 animate-spin" />
            <h2 className="text-xl font-semibold mb-1">
              {phase === "analyzing" ? "Reading the deck…" : "Saving to your portfolio…"}
            </h2>
            <p className="text-sm text-muted">
              {phase === "analyzing"
                ? "Scoring technology readiness, financial viability, carbon impact, regulatory risk, market timing, and scalability."
                : "Linking this evaluation to your investor model."}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {isDemo && !loading && (
          <p className="text-xs text-muted mt-8 text-center italic">
            Demo session. Your upload will join the demo investor&apos;s portfolio for this session.
          </p>
        )}
      </main>
    </div>
  );
}
