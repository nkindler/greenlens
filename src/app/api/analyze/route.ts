import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are DeckRanker, an expert venture investment analyst. You analyze deal documents (term sheets, pitch decks, project summaries, investor memos) for early- to growth-stage venture investments across all sectors. You apply the same rigorous rubric whether the deal is climate, fintech, B2B SaaS, consumer, healthcare, biotech, hardware, AI, or anything else.

When given a document, produce a structured investment analysis in the following JSON format. Be specific, quantitative where possible, and cite details from the document.

{
  "project_name": "Name of the project or company",
  "technology_type": "What the company does in 1-3 words. Examples: B2B SaaS, Solar PV, AI Agents, Consumer Marketplace, Direct Air Capture, Fintech Lending, Synthetic Biology, Clinical Diagnostics. Use the most natural sector tag.",
  "location": "Geographic location if mentioned",
  "investment_size": "Capital required if mentioned",
  "stage": "One of: Pre-seed | Seed | Series A | Series B | Series C | Growth — best guess from context",
  "founder_profile": "One of: Solo | Co-founders | Repeat | Technical | Operator — best guess; default Co-founders if unclear",
  "geography": "One of: North America | Europe | Asia | LATAM | Middle East | Africa | Global",
  "scores": {
    "product_readiness": {
      "score": <1-10>,
      "rationale": "2-3 sentence explanation of how mature the product/technology is. Use TRL for hardware/biotech, deployment scale for software, customer traction for services. Higher score = more proven."
    },
    "financial_viability": {
      "score": <1-10>,
      "rationale": "2-3 sentences on unit economics, revenue model, path to profitability. Cite IRR / LTV-CAC / margins / burn / runway when mentioned."
    },
    "mission_impact": {
      "score": <1-10>,
      "rationale": "2-3 sentences on the magnitude of the problem this solves, the user/customer pain it removes, and the size of the positive outcome if it works. For climate or healthcare, quantify (tCO2/yr, lives improved). For software/consumer, talk about the user-pain magnitude."
    },
    "regulatory_risk": {
      "score": <1-10>,
      "rationale": "2-3 sentences on regulatory exposure across all relevant regimes (FDA, FERC, GDPR, securities, export controls, AI policy, content moderation, etc.). 10 = lowest risk."
    },
    "market_timing": {
      "score": <1-10>,
      "rationale": "2-3 sentences on whether the market is ready now. Cite tailwinds, customer urgency, competitive landscape, secular trends."
    },
    "scalability": {
      "score": <1-10>,
      "rationale": "2-3 sentences on how the business grows. Software margins vs hardware capex vs services people-leverage. Distribution channels, network effects, repeatability."
    }
  },
  "overall_score": <1-10 weighted average>,
  "recommendation": "STRONG PASS" | "PASS" | "CONDITIONAL" | "FURTHER DILIGENCE" | "DECLINE",
  "key_risks": ["risk 1", "risk 2", "risk 3"],
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "investment_memo": "A 3-4 paragraph executive summary suitable for an investment committee. Cover the opportunity, financial merits, risks, and a recommendation. Write in a professional, concise tone.",
  "questions_for_management": ["question 1", "question 2", "question 3"]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown fencing, no extra text
- Be rigorous and honest. Do not inflate scores.
- If information is missing from the document, note it in the rationale and score conservatively.
- The overall_score should reflect a weighted view where financial_viability and product_readiness carry slightly more weight, with the rest equal.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const textInput = formData.get("text") as string | null;

    if (!file && !textInput) {
      return NextResponse.json(
        { error: "No file or text provided" },
        { status: 400 }
      );
    }

    let content: Anthropic.MessageCreateParams["messages"][0]["content"];

    if (file) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");

      if (file.type === "application/pdf") {
        content = [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Analyze this deal document and produce the structured investment analysis.",
          },
        ];
      } else {
        // Treat as text file
        const text = Buffer.from(bytes).toString("utf-8");
        content = [
          {
            type: "text",
            text: `Analyze this deal document and produce the structured investment analysis:\n\n${text}`,
          },
        ];
      }
    } else {
      content = [
        {
          type: "text",
          text: `Analyze this deal document and produce the structured investment analysis:\n\n${textInput}`,
        },
      ];
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON if wrapped in markdown fencing
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[1].trim() : responseText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse analysis", raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
