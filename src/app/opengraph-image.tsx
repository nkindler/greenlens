import { ImageResponse } from "next/og";

export const alt =
  "DeckRanker — Your deals. Your model. Your blindspots.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0b1120",
          backgroundImage:
            "radial-gradient(ellipse 70% 55% at 78% 0%, rgba(16,185,129,0.28), transparent 60%), radial-gradient(ellipse 55% 45% at 0% 30%, rgba(52,211,153,0.14), transparent 70%)",
          color: "#e2e8f0",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c.94 3.21.94 5.97-.02 8.97-1.42 4.42-5.69 7.07-10.18 7.07-1.31 0-2-.17-3-2" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            DeckRanker
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 18,
              textTransform: "uppercase",
              letterSpacing: 4,
              color: "#10b981",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#10b981",
              }}
            />
            Investor pattern intelligence
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Your deals.</span>
            <span style={{ color: "#10b981" }}>Your model.</span>
            <span style={{ color: "rgba(226,232,240,0.85)" }}>
              Your blindspots.
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#64748b",
          }}
        >
          <div>
            Upload a deck. Mark invested or passed. Find the patterns.
          </div>
          <div style={{ color: "#e2e8f0", fontWeight: 600 }}>
            deckranker.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
