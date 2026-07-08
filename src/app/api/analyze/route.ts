import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/orgs";
import { parseUserSettings } from "@/lib/settings";
import {
  buildAnalysisSchema,
  buildAnalysisSystemPrompt,
  getPreferenceProfile,
} from "@/lib/analysis";

const client = new Anthropic();

// Deep analyses on Opus can take a while; give the route room to finish.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const textInput = formData.get("text") as string | null;

    if (!file && !textInput) {
      return NextResponse.json(
        { error: "No file or text provided" },
        { status: 400 },
      );
    }

    const settings = parseUserSettings(user);
    const workspace = await getWorkspace(user);
    const profile = await getPreferenceProfile(workspace, user.id);

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

    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      system: buildAnalysisSystemPrompt({
        settings,
        preferenceProfile: profile?.profile_md ?? null,
      }),
      output_config: {
        format: {
          type: "json_schema",
          schema: buildAnalysisSchema(settings.dimensions, !!profile),
        },
      },
      messages: [{ role: "user", content }],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The document could not be analyzed." },
        { status: 422 },
      );
    }

    const responseText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    let analysis;
    try {
      // Structured outputs return bare JSON; keep the fence-stripping
      // fallback for resilience.
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[1].trim() : responseText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse analysis", raw: responseText },
        { status: 500 },
      );
    }

    // The model occasionally emits blank items in list fields — strip them
    // so empty rows never reach the report.
    for (const key of ["key_risks", "key_strengths", "questions_for_management"]) {
      if (Array.isArray(analysis[key])) {
        analysis[key] = analysis[key].filter(
          (x: unknown) => typeof x === "string" && x.trim().length > 0,
        );
      }
    }

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
