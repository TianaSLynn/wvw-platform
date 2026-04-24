/**
 * WVW Scoring Engine
 * Processes SurveyResponse records into AuditResult / DomainResult / PatternFlag
 */

export type RiskBand = "CRITICAL" | "AT_RISK" | "NEEDS_STRENGTHENING" | "STRONG";

export function getRiskBand(score: number): RiskBand {
  if (score < 40) return "CRITICAL";
  if (score < 60) return "AT_RISK";
  if (score < 80) return "NEEDS_STRENGTHENING";
  return "STRONG";
}

export function getRiskBandLabel(band: RiskBand): string {
  switch (band) {
    case "CRITICAL": return "Critical";
    case "AT_RISK": return "At Risk";
    case "NEEDS_STRENGTHENING": return "Needs Strengthening";
    case "STRONG": return "Strong";
  }
}

export function getRiskBandColor(band: RiskBand): string {
  switch (band) {
    case "CRITICAL": return "text-red-700 bg-red-50 border-red-200";
    case "AT_RISK": return "text-orange-700 bg-orange-50 border-orange-200";
    case "NEEDS_STRENGTHENING": return "text-amber-700 bg-amber-50 border-amber-200";
    case "STRONG": return "text-green-700 bg-green-50 border-green-200";
  }
}

/** Parse guidance string metadata */
export function parseGuidance(guidance: string | null): {
  code: string | null;
  reverseScored: boolean;
  riskTag: string | null;
  benchmarkTag: string | null;
  isLikert: boolean;
} {
  if (!guidance) return { code: null, reverseScored: false, riskTag: null, benchmarkTag: null, isLikert: false };

  const codeMatch = guidance.match(/code:([^\s|]+)/);
  const reverseScored = guidance.includes("reverse:true");
  const riskMatch = guidance.match(/risk:([^\s|]+)/);
  const benchmarkMatch = guidance.match(/benchmark:([^\s|]+)/);
  const isLikert = guidance.includes("scale:1-5");

  return {
    code: codeMatch?.[1] ?? null,
    reverseScored,
    riskTag: riskMatch?.[1] ?? null,
    benchmarkTag: benchmarkMatch?.[1] ?? null,
    isLikert,
  };
}

/** Normalize a raw Likert 1-5 to 0-100, with optional reverse scoring */
export function normalizeScore(raw: number, reverseScored: boolean): number {
  const effective = reverseScored ? 6 - raw : raw;
  return ((effective - 1) / 4) * 100;
}

export type ChecklistItemMeta = {
  id: string;
  guidance: string | null;
  riskWeight: number;
  sectionId: string;
  sectionTitle: string;
};

export type SurveyResponseRecord = {
  responses: Record<string, string>; // itemId -> "1"|"2"|"3"|"4"|"5"
};

export type DomainScore = {
  sectionId: string;
  sectionTitle: string;
  score: number;
  riskBand: RiskBand;
  questionCount: number;
  answeredCount: number;
  flaggedRiskTags: string[];
};

export type PatternFlagData = {
  riskTag: string;
  severity: "critical" | "elevated" | "moderate";
  avgScore: number;
  questionCount: number;
};

export type ScoringResult = {
  overallScore: number;
  riskBand: RiskBand;
  responseCount: number;
  questionCount: number;
  flaggedRiskTags: string[];
  domainScores: DomainScore[];
  patternFlags: PatternFlagData[];
};

/**
 * Compute aggregate scores from multiple survey responses.
 * items: all checklist items in the audit (Likert only)
 * responses: all SurveyResponse records for the audit
 */
export function computeAuditScores(
  items: ChecklistItemMeta[],
  responses: SurveyResponseRecord[]
): ScoringResult {
  if (responses.length === 0 || items.length === 0) {
    return {
      overallScore: 0,
      riskBand: "CRITICAL",
      responseCount: 0,
      questionCount: items.length,
      flaggedRiskTags: [],
      domainScores: [],
      patternFlags: [],
    };
  }

  // Build item meta map
  const itemMap = new Map<string, ChecklistItemMeta & { parsed: ReturnType<typeof parseGuidance> }>();
  for (const item of items) {
    itemMap.set(item.id, { ...item, parsed: parseGuidance(item.guidance) });
  }

  // Aggregate scores per item across all responses
  const itemScores = new Map<string, { total: number; count: number }>();
  for (const resp of responses) {
    for (const [itemId, rawVal] of Object.entries(resp.responses)) {
      const raw = parseInt(rawVal, 10);
      if (isNaN(raw) || raw < 1 || raw > 5) continue;
      const meta = itemMap.get(itemId);
      if (!meta) continue;

      const normalized = normalizeScore(raw, meta.parsed.reverseScored);
      const existing = itemScores.get(itemId) ?? { total: 0, count: 0 };
      itemScores.set(itemId, { total: existing.total + normalized, count: existing.count + 1 });
    }
  }

  // Group by section
  const sectionMap = new Map<string, {
    title: string;
    items: Array<{ itemId: string; weight: number; riskTag: string | null }>;
  }>();

  for (const item of items) {
    const { parsed } = itemMap.get(item.id)!;
    if (!sectionMap.has(item.sectionId)) {
      sectionMap.set(item.sectionId, { title: item.sectionTitle, items: [] });
    }
    sectionMap.get(item.sectionId)!.items.push({
      itemId: item.id,
      weight: item.riskWeight ?? 1,
      riskTag: parsed.riskTag,
    });
  }

  // Compute domain scores
  const domainScores: DomainScore[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const allFlaggedTags = new Set<string>();

  // Accumulate riskTag scores for pattern detection
  const riskTagAccum = new Map<string, { total: number; count: number }>();

  for (const [sectionId, { title, items: sItems }] of sectionMap) {
    let sectionWeightedScore = 0;
    let sectionTotalWeight = 0;
    let answeredCount = 0;
    const domainRiskTags = new Set<string>();

    for (const { itemId, weight, riskTag } of sItems) {
      const scores = itemScores.get(itemId);
      if (!scores) continue;

      const avgItemScore = scores.total / scores.count;
      answeredCount++;
      sectionWeightedScore += avgItemScore * weight;
      sectionTotalWeight += weight;

      if (riskTag) {
        // Accumulate for pattern detection
        const existing = riskTagAccum.get(riskTag) ?? { total: 0, count: 0 };
        riskTagAccum.set(riskTag, { total: existing.total + avgItemScore, count: existing.count + 1 });

        // Flag domain if score is in concern zone (< 60)
        if (avgItemScore < 60) {
          domainRiskTags.add(riskTag);
          allFlaggedTags.add(riskTag);
        }
      }
    }

    const sectionScore = sectionTotalWeight > 0
      ? sectionWeightedScore / sectionTotalWeight
      : 0;

    totalWeightedScore += sectionScore * sectionTotalWeight;
    totalWeight += sectionTotalWeight;

    domainScores.push({
      sectionId,
      sectionTitle: title,
      score: Math.round(sectionScore),
      riskBand: getRiskBand(sectionScore),
      questionCount: sItems.length,
      answeredCount,
      flaggedRiskTags: [...domainRiskTags],
    });
  }

  const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

  // Build pattern flags
  const patternFlags: PatternFlagData[] = [];
  for (const [riskTag, { total, count }] of riskTagAccum) {
    const avg = total / count;
    if (avg < 60) {
      let severity: "critical" | "elevated" | "moderate";
      if (avg < 40) severity = "critical";
      else if (avg < 50) severity = "elevated";
      else severity = "moderate";

      patternFlags.push({ riskTag, severity, avgScore: Math.round(avg), questionCount: count });
    }
  }

  // Sort pattern flags by severity
  patternFlags.sort((a, b) => a.avgScore - b.avgScore);

  return {
    overallScore,
    riskBand: getRiskBand(overallScore),
    responseCount: responses.length,
    questionCount: items.length,
    flaggedRiskTags: [...allFlaggedTags],
    domainScores,
    patternFlags,
  };
}

/** Map pattern flags to recommended pathway slugs */
const RISK_TAG_TO_PATHWAY: Record<string, string[]> = {
  "retaliation": ["psychological-safety", "voice-inclusion"],
  "psychological-safety": ["psychological-safety"],
  "burnout": ["workload-sustainability", "psychological-safety"],
  "bias": ["dei-equity", "voice-inclusion"],
  "communication": ["communication-clarity", "leadership-alignment"],
  "leadership": ["leadership-alignment", "executive-alignment"],
  "trust": ["psychological-safety", "leadership-alignment"],
  "inclusion": ["dei-equity", "voice-inclusion"],
  "equity": ["dei-equity"],
  "workload": ["workload-sustainability"],
  "conflict": ["conflict-resolution", "psychological-safety"],
  "accountability": ["leadership-alignment", "performance-accountability"],
  "recognition": ["recognition-retention"],
  "retention": ["recognition-retention", "workload-sustainability"],
  "compliance": ["policy-compliance"],
  "policy": ["policy-compliance"],
  "neurodiversity": ["neurodiversity-inclusion"],
  "pipeline": ["talent-pipeline"],
};

export function getRecommendedPathways(patternFlags: PatternFlagData[]): string[] {
  const slugSet = new Set<string>();
  for (const flag of patternFlags) {
    const slugs = RISK_TAG_TO_PATHWAY[flag.riskTag] ?? [];
    slugs.forEach((s) => slugSet.add(s));
  }
  return [...slugSet];
}
