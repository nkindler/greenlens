import { getPool, ready, type PreferenceProfileRow } from "./db";
import type { DetailLevel, ReportDimension, UserSettings } from "./settings";
import type { Workspace } from "./orgs";

const DETAIL_INSTRUCTIONS: Record<DetailLevel, string> = {
  brief:
    "Detail level: BRIEF. Keep each dimension rationale to 1 tight sentence. The investment memo should be a single paragraph (4-6 sentences). Limit key_risks, key_strengths, and questions_for_management to 3 items each.",
  standard:
    "Detail level: STANDARD. Keep each dimension rationale to 2-3 sentences. The investment memo should be 3-4 paragraphs. Provide 3-5 items each for key_risks, key_strengths, and questions_for_management.",
  comprehensive:
    "Detail level: COMPREHENSIVE. Each dimension rationale should be 3-5 sentences with specific figures cited from the document. The investment memo should be 5-7 paragraphs covering opportunity, market, team, financials, risks, and recommendation. Provide 5-7 items each for key_risks, key_strengths, and questions_for_management, each with a short explanation.",
};

export function buildAnalysisSystemPrompt(opts: {
  settings: UserSettings;
  preferenceProfile: string | null;
}): string {
  const { settings, preferenceProfile } = opts;
  const dims = settings.dimensions;

  const dimLines = dims
    .map(
      (d) =>
        `    "${d.key}": { "score": <1-10>, "rationale": "${d.description || `Assessment of ${d.label}.`}" }`,
    )
    .join(",\n");

  const profileBlock = preferenceProfile
    ? `

INVESTOR PREFERENCE PROFILE
This investor's model has been trained on their past decisions and outcomes. Use it to inform the "investor_fit" section — how well this specific deal matches what this investor invests in, what they pass on, and where their bets have historically paid off or failed. Do NOT inflate or deflate the objective dimension scores based on the profile; keep those independent.

<profile>
${preferenceProfile}
</profile>`
    : "";

  const fitField = preferenceProfile
    ? `,
  "investor_fit": {
    "score": <1-10 how well this deal matches the investor's learned preferences>,
    "rationale": "2-3 sentences referencing specific patterns from the investor profile"
  }`
    : "";

  return `You are DeckRanker, an expert venture investment analyst. You analyze deal documents (term sheets, pitch decks, project summaries, investor memos) for early- to growth-stage venture investments across all sectors. You apply the same rigorous rubric whether the deal is climate, fintech, B2B SaaS, consumer, healthcare, biotech, hardware, AI, or anything else.

When given a document, produce a structured investment analysis in the following JSON format. Be specific, quantitative where possible, and cite details from the document.

{
  "project_name": "Name of the project or company",
  "technology_type": "What the company does in 1-3 words. Examples: B2B SaaS, Solar PV, AI Agents, Consumer Marketplace, Fintech Lending. Use the most natural sector tag.",
  "location": "Geographic location if mentioned",
  "investment_size": "Capital required if mentioned",
  "stage": "One of: Pre-seed | Seed | Series A | Series B | Series C | Growth — best guess from context",
  "founder_profile": "One of: Solo | Co-founders | Repeat | Technical | Operator — best guess; default Co-founders if unclear",
  "geography": "One of: North America | Europe | Asia | LATAM | Middle East | Africa | Global",
  "scores": {
${dimLines}
  },
  "overall_score": <1-10 weighted average>,
  "recommendation": "STRONG PASS" | "PASS" | "CONDITIONAL" | "FURTHER DILIGENCE" | "DECLINE",
  "key_risks": ["risk 1", "risk 2", "risk 3"],
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "investment_memo": "An executive summary suitable for an investment committee. Cover the opportunity, financial merits, risks, and a recommendation. Professional, concise tone.",
  "questions_for_management": ["question 1", "question 2", "question 3"]${fitField}
}

The scoring dimensions above are this investor's own rubric — score each one on the meaning given in its rationale description.

${DETAIL_INSTRUCTIONS[settings.detailLevel]}
${profileBlock}

IMPORTANT:
- Return ONLY valid JSON, no markdown fencing, no extra text
- Every item in key_risks, key_strengths, and questions_for_management must be a complete, substantive sentence — never an empty string or placeholder. Always include at least 3 questions_for_management.
- Be rigorous and honest. Do not inflate scores.
- If information is missing from the document, note it in the rationale and score conservatively.
- The overall_score should reflect a weighted view where financial and product/readiness dimensions carry slightly more weight, with the rest equal.`;
}

// JSON Schema for structured outputs, built from the investor's dimensions.
export function buildAnalysisSchema(
  dimensions: ReportDimension[],
  includeFit: boolean,
): Record<string, unknown> {
  const scoreObj = (desc: string) => ({
    type: "object",
    description: desc,
    properties: {
      score: { type: "integer", description: "1-10" },
      rationale: { type: "string" },
    },
    required: ["score", "rationale"],
    additionalProperties: false,
  });

  const scoresProps: Record<string, unknown> = {};
  for (const d of dimensions) {
    scoresProps[d.key] = scoreObj(d.description || d.label);
  }

  const properties: Record<string, unknown> = {
    project_name: { type: "string" },
    technology_type: { type: "string" },
    location: { type: "string" },
    investment_size: { type: "string" },
    stage: { type: "string" },
    founder_profile: { type: "string" },
    geography: { type: "string" },
    scores: {
      type: "object",
      properties: scoresProps,
      required: dimensions.map((d) => d.key),
      additionalProperties: false,
    },
    overall_score: { type: "number" },
    recommendation: {
      type: "string",
      enum: ["STRONG PASS", "PASS", "CONDITIONAL", "FURTHER DILIGENCE", "DECLINE"],
    },
    key_risks: { type: "array", items: { type: "string" } },
    key_strengths: { type: "array", items: { type: "string" } },
    investment_memo: { type: "string" },
    questions_for_management: { type: "array", items: { type: "string" } },
  };
  const required = Object.keys(properties);
  if (includeFit) {
    properties.investor_fit = {
      type: "object",
      properties: {
        score: { type: "integer" },
        rationale: { type: "string" },
      },
      required: ["score", "rationale"],
      additionalProperties: false,
    };
    required.push("investor_fit");
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

export async function getPreferenceProfile(
  workspace: Workspace,
  userId: number,
): Promise<PreferenceProfileRow | null> {
  await ready();
  const pool = getPool();
  const r =
    workspace.kind === "org"
      ? await pool.query<PreferenceProfileRow>(
          "SELECT * FROM preference_profiles WHERE org_id = $1",
          [workspace.org.id],
        )
      : await pool.query<PreferenceProfileRow>(
          "SELECT * FROM preference_profiles WHERE user_id = $1",
          [userId],
        );
  return r.rows[0] ?? null;
}
