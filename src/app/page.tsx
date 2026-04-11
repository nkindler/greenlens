"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Zap, Shield, TrendingUp, Leaf, Globe, BarChart3, ChevronRight, AlertTriangle, CheckCircle, HelpCircle, Loader2 } from "lucide-react";

interface Score {
  score: number;
  rationale: string;
}

interface Analysis {
  project_name: string;
  technology_type: string;
  location: string;
  investment_size: string;
  scores: {
    technology_readiness: Score;
    financial_viability: Score;
    carbon_impact: Score;
    regulatory_risk: Score;
    market_timing: Score;
    scalability: Score;
  };
  overall_score: number;
  recommendation: string;
  key_risks: string[];
  key_strengths: string[];
  investment_memo: string;
  questions_for_management: string[];
}

const SCORE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  technology_readiness: { label: "Technology Readiness", icon: <Zap className="w-4 h-4" /> },
  financial_viability: { label: "Financial Viability", icon: <TrendingUp className="w-4 h-4" /> },
  carbon_impact: { label: "Carbon Impact", icon: <Leaf className="w-4 h-4" /> },
  regulatory_risk: { label: "Regulatory Risk", icon: <Shield className="w-4 h-4" /> },
  market_timing: { label: "Market Timing", icon: <Globe className="w-4 h-4" /> },
  scalability: { label: "Scalability", icon: <BarChart3 className="w-4 h-4" /> },
};

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

function getRecommendationStyle(rec: string): string {
  switch (rec) {
    case "STRONG PASS": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "PASS": return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
    case "CONDITIONAL": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "FURTHER DILIGENCE": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "DECLINE": return "bg-red-500/10 text-red-400 border-red-500/20";
    default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
}

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");

  const handleAnalyze = useCallback(async (file?: File, text?: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else if (text) {
        formData.append("text", text);
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data.analysis);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      handleAnalyze(file);
    }
  }, [handleAnalyze]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      handleAnalyze(file);
    }
  }, [handleAnalyze]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Green<span className="text-accent">Lens</span>
            </span>
          </div>
          <p className="text-sm text-muted hidden sm:block">
            AI-Powered Clean Energy Investment Analysis
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Hero section */}
        {!analysis && !loading && (
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Analyze clean energy deals
              <br />
              <span className="text-accent">in seconds, not days</span>
            </h1>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Upload a term sheet, pitch deck, or project summary. GreenLens uses AI to
              produce a structured investment analysis with scores, risks, and an
              executive memo.
            </p>
          </div>
        )}

        {/* Upload Area */}
        {!analysis && !loading && (
          <div className="max-w-2xl mx-auto mb-16 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {/* Mode Toggle */}
            <div className="flex gap-1 mb-6 bg-card rounded-lg p-1 w-fit mx-auto">
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
                Paste Text
              </button>
            </div>

            {inputMode === "upload" ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "drop-zone-active border-accent bg-accent/5"
                    : "border-card-border hover:border-accent/50 hover:bg-card/50"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx,.md"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? "text-accent" : "text-muted"}`} />
                <p className="text-lg font-medium mb-2">
                  {fileName ? fileName : "Drop your deal document here"}
                </p>
                <p className="text-sm text-muted">
                  PDF, TXT, or DOC — term sheets, pitch decks, project summaries
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your deal summary, term sheet, or project description here..."
                  className="w-full h-64 bg-card border border-card-border rounded-2xl p-6 text-foreground placeholder:text-muted resize-none focus:outline-none focus:border-accent/50 transition-colors"
                />
                <button
                  onClick={() => textInput.trim() && handleAnalyze(undefined, textInput)}
                  disabled={!textInput.trim()}
                  className="w-full py-3 px-6 bg-accent hover:bg-accent-light disabled:opacity-30 disabled:cursor-not-allowed text-background font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Analyze Document
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-2xl mx-auto text-center py-24 animate-fade-in-up">
            <Loader2 className="w-12 h-12 text-accent mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-semibold mb-2">Analyzing your document</h2>
            <p className="text-muted">
              Evaluating technology readiness, financial viability, carbon impact, regulatory risk, market timing, and scalability...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-3 animate-fade-in-up">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Analysis Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => { setAnalysis(null); setFileName(null); setTextInput(""); setError(null); }}
                  className="text-sm text-muted hover:text-accent transition-colors mb-2 flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 rotate-180" /> New Analysis
                </button>
                <h2 className="text-2xl font-bold">{analysis.project_name}</h2>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted">
                  {analysis.technology_type && (
                    <span className="bg-card border border-card-border rounded-full px-3 py-1">
                      {analysis.technology_type}
                    </span>
                  )}
                  {analysis.location && (
                    <span className="bg-card border border-card-border rounded-full px-3 py-1">
                      {analysis.location}
                    </span>
                  )}
                  {analysis.investment_size && (
                    <span className="bg-card border border-card-border rounded-full px-3 py-1">
                      {analysis.investment_size}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted mb-1">Overall Score</p>
                  <p className={`text-4xl font-bold ${getScoreTextColor(analysis.overall_score)}`}>
                    {analysis.overall_score}<span className="text-lg text-muted">/10</span>
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-xl border font-semibold text-sm ${getRecommendationStyle(analysis.recommendation)}`}>
                  {analysis.recommendation}
                </div>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {Object.entries(analysis.scores).map(([key, value]) => {
                const meta = SCORE_LABELS[key];
                if (!meta) return null;
                return (
                  <div key={key} className="bg-card border border-card-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {meta.icon}
                        {meta.label}
                      </div>
                      <span className={`text-xl font-bold ${getScoreTextColor(value.score)}`}>
                        {value.score}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-card-border rounded-full mb-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full score-bar-fill ${getScoreColor(value.score)}`}
                        style={{ width: `${value.score * 10}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{value.rationale}</p>
                  </div>
                );
              })}
            </div>

            {/* Strengths & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-card-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  Key Strengths
                </h3>
                <ul className="space-y-3">
                  {analysis.key_strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-accent mt-0.5">+</span>
                      <span className="text-muted">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card border border-card-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Key Risks
                </h3>
                <ul className="space-y-3">
                  {analysis.key_risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-warning mt-0.5">!</span>
                      <span className="text-muted">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Investment Memo */}
            <div className="bg-card border border-card-border rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-info" />
                Investment Memo
              </h3>
              <div className="text-sm text-muted leading-relaxed whitespace-pre-line">
                {analysis.investment_memo}
              </div>
            </div>

            {/* Questions for Management */}
            <div className="bg-card border border-card-border rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-accent-light" />
                Questions for Management
              </h3>
              <ol className="space-y-3">
                {analysis.questions_for_management.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-accent font-mono text-xs mt-0.5">{i + 1}.</span>
                    <span className="text-muted">{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Features row */}
        {!analysis && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {[
              { icon: <Zap className="w-5 h-5" />, title: "Instant Analysis", desc: "Get a structured investment memo in under 30 seconds" },
              { icon: <BarChart3 className="w-5 h-5" />, title: "6-Dimension Scoring", desc: "Technology, financial, carbon, regulatory, market, and scalability scores" },
              { icon: <FileText className="w-5 h-5" />, title: "IC-Ready Memos", desc: "Generated executive summaries ready for your investment committee" },
            ].map((f, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-6 text-center">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3 text-accent">
                  {f.icon}
                </div>
                <h3 className="font-medium mb-1">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-card-border py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted">
          GreenLens &mdash; AI-powered clean energy investment analysis
        </div>
      </footer>
    </div>
  );
}
