import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPool, ready } from "@/lib/db";
import { listWorkspaceDecks } from "@/lib/insights";
import { getWorkspace } from "@/lib/orgs";

const client = new Anthropic();

export const maxDuration = 300;

const TRAIN_SYSTEM = `You are the training engine behind DeckRanker, an investment decision-support tool. You are given an investor's full evaluation history: every deal they analyzed, the objective scores, whether they invested or passed, their stated reasoning, and — where known — whether the deal ultimately succeeded or failed.

Produce an INVESTOR PREFERENCE PROFILE in markdown. It will be injected into future deal analyses to assess fit, so write it as a precise, evidence-grounded reference — not flattery. Structure it as:

## Investment thesis (revealed)
What this investor actually invests in — sectors, stages, check sizes, founder profiles — based on their decisions, not their stated intent.

## What earns a yes
Concrete patterns in deals they invested in (cite deal names).

## What earns a pass
Concrete patterns in deals they passed on (cite deal names).

## What works (validated wins)
Patterns among invested deals that succeeded.

## What fails (validated losses)
Patterns among invested deals that failed — the traps this investor falls into.

## Blindspots
Passed deals that later succeeded, strong-score deals they rejected, biases the data reveals (e.g., penalizing solo founders despite those deals winning).

## Guidance for scoring fit
3-6 bullet rules for judging whether a NEW deal fits this investor, each with a direction (strong fit / weak fit) and the evidence behind it.

Be honest and specific. Cite company names and numbers from the history. If the history is thin, say what can and cannot be inferred yet.`;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const workspace = await getWorkspace(user);
    const decks = await listWorkspaceDecks(workspace, user.id);
    const decided = decks.filter((d) => d.decision !== "looking");

    if (decided.length < 3) {
      return NextResponse.json(
        {
          error:
            "Not enough training data yet. Mark at least 3 deals as invested or passed first.",
        },
        { status: 400 },
      );
    }

    const history = decks.map((d) => {
      let scores: unknown = null;
      try {
        scores = (JSON.parse(d.analysis_json) as { scores?: unknown }).scores;
      } catch {
        // ignore malformed rows
      }
      return {
        company: d.company_name,
        sector: d.technology_type,
        stage: d.stage,
        founder_profile: d.founder_profile,
        geography: d.geography,
        investment_size: d.investment_size,
        overall_score: d.overall_score,
        recommendation: d.recommendation,
        scores,
        decision: d.decision,
        decision_notes: d.decision_notes,
        outcome: d.outcome,
        outcome_evidence: d.outcome_evidence,
      };
    });

    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: TRAIN_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Here is the investor's evaluation history as JSON. Produce the preference profile.\n\n${JSON.stringify(history, null, 2)}`,
        },
      ],
    });
    const message = await stream.finalMessage();
    const profileMd = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!profileMd) {
      return NextResponse.json({ error: "Training produced no profile" }, { status: 500 });
    }

    const stats = {
      totalDecks: decks.length,
      decided: decided.length,
      invested: decks.filter((d) => d.decision === "invested").length,
      passed: decks.filter((d) => d.decision === "passed").length,
      knownOutcomes: decks.filter((d) => d.outcome !== "unknown").length,
    };

    await ready();
    const pool = getPool();
    const now = Date.now();
    if (workspace.kind === "org") {
      await pool.query(
        `INSERT INTO preference_profiles(org_id, profile_md, stats_json, trained_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (org_id) WHERE org_id IS NOT NULL
         DO UPDATE SET profile_md = $2, stats_json = $3, trained_at = $4`,
        [workspace.org.id, profileMd, JSON.stringify(stats), now],
      );
    } else {
      await pool.query(
        `INSERT INTO preference_profiles(user_id, profile_md, stats_json, trained_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) WHERE user_id IS NOT NULL
         DO UPDATE SET profile_md = $2, stats_json = $3, trained_at = $4`,
        [user.id, profileMd, JSON.stringify(stats), now],
      );
    }

    return NextResponse.json({ ok: true, profile: profileMd, stats, trainedAt: now });
  } catch (e) {
    console.error("Training error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Training failed" },
      { status: 500 },
    );
  }
}
