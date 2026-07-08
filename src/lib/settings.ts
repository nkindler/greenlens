import { getPool, ready, type UserRow } from "./db";

export type ReportDimension = {
  key: string;
  label: string;
  description: string;
};

export type DetailLevel = "brief" | "standard" | "comprehensive";

export type UserSettings = {
  detailLevel: DetailLevel;
  dimensions: ReportDimension[];
};

// The defaults mirror the rubric DeckRanker shipped with, so existing decks
// and new ones stay comparable until the user customizes.
export const DEFAULT_DIMENSIONS: ReportDimension[] = [
  {
    key: "product_readiness",
    label: "Product Readiness",
    description:
      "How mature the product/technology is. Use TRL for hardware/biotech, deployment scale for software, customer traction for services. Higher score = more proven.",
  },
  {
    key: "financial_viability",
    label: "Financial Viability",
    description:
      "Unit economics, revenue model, path to profitability. Cite IRR / LTV-CAC / margins / burn / runway when mentioned.",
  },
  {
    key: "mission_impact",
    label: "Mission & Impact",
    description:
      "Magnitude of the problem this solves, the user/customer pain it removes, and the size of the positive outcome if it works. Quantify where possible.",
  },
  {
    key: "regulatory_risk",
    label: "Regulatory Risk",
    description:
      "Regulatory exposure across all relevant regimes (FDA, FERC, GDPR, securities, export controls, AI policy, etc.). 10 = lowest risk.",
  },
  {
    key: "market_timing",
    label: "Market Timing",
    description:
      "Whether the market is ready now. Tailwinds, customer urgency, competitive landscape, secular trends.",
  },
  {
    key: "scalability",
    label: "Scalability",
    description:
      "How the business grows. Software margins vs hardware capex vs services people-leverage. Distribution channels, network effects, repeatability.",
  },
];

export const DEFAULT_SETTINGS: UserSettings = {
  detailLevel: "standard",
  dimensions: DEFAULT_DIMENSIONS,
};

export function slugifyDimensionKey(label: string): string {
  return (
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "dimension"
  );
}

export function parseUserSettings(u: Pick<UserRow, "settings_json">): UserSettings {
  if (!u.settings_json) return DEFAULT_SETTINGS;
  try {
    const raw = JSON.parse(u.settings_json) as Partial<UserSettings>;
    return sanitizeSettings(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function sanitizeSettings(raw: Partial<UserSettings>): UserSettings {
  const detailLevel: DetailLevel = ["brief", "standard", "comprehensive"].includes(
    raw.detailLevel as string,
  )
    ? (raw.detailLevel as DetailLevel)
    : "standard";

  let dimensions: ReportDimension[] = [];
  if (Array.isArray(raw.dimensions)) {
    const seen = new Set<string>();
    for (const d of raw.dimensions) {
      if (!d || typeof d.label !== "string" || !d.label.trim()) continue;
      const label = d.label.trim().slice(0, 60);
      let key =
        typeof d.key === "string" && /^[a-z0-9_]{1,40}$/.test(d.key)
          ? d.key
          : slugifyDimensionKey(label);
      while (seen.has(key)) key = `${key.slice(0, 37)}_x`;
      seen.add(key);
      dimensions.push({
        key,
        label,
        description:
          typeof d.description === "string" ? d.description.trim().slice(0, 400) : "",
      });
    }
  }
  if (dimensions.length < 2 || dimensions.length > 10) {
    dimensions = dimensions.length > 10 ? dimensions.slice(0, 10) : DEFAULT_DIMENSIONS;
  }
  return { detailLevel, dimensions };
}

export async function saveUserSettings(
  userId: number,
  settings: UserSettings,
): Promise<void> {
  await ready();
  await getPool().query("UPDATE users SET settings_json = $1 WHERE id = $2", [
    JSON.stringify(settings),
    userId,
  ]);
}
