/**
 * WVW Organizational Intelligence Engine™ — Scoring Module v2.0
 *
 * Full WVW Formula:
 *   Questions → Domain Scores → Pattern Detection → Risk Classification →
 *   Confidence Ratings → Contradiction Detection → Pathway Triggering →
 *   Recommendations Engine → Implementation Roadmap
 */

export type RiskBand = "CRITICAL" | "AT_RISK" | "NEEDS_STRENGTHENING" | "STRONG";

export type QuestionType =
  | "Likert"
  | "Frequency"
  | "Severity"
  | "Scenario"
  | "Evidence"
  | "OpenEnded"
  | "Ranking"
  | "Matrix"
  | "Confidence"
  | "HiddenTrigger"
  | "Contradiction"
  | "MultipleChoice";

export function getRiskBand(score: number): RiskBand {
  if (score < 40) return "CRITICAL";
  if (score < 60) return "AT_RISK";
  if (score < 75) return "NEEDS_STRENGTHENING";
  return "STRONG";
}

export function getRiskBandLabel(band: RiskBand): string {
  switch (band) {
    case "CRITICAL":             return "Critical";
    case "AT_RISK":              return "At Risk";
    case "NEEDS_STRENGTHENING":  return "Needs Strengthening";
    case "STRONG":               return "Strong";
  }
}

export function getRiskBandColor(band: RiskBand): string {
  switch (band) {
    case "CRITICAL":             return "text-red-700 bg-red-50 border-red-200";
    case "AT_RISK":              return "text-orange-700 bg-orange-50 border-orange-200";
    case "NEEDS_STRENGTHENING":  return "text-amber-700 bg-amber-50 border-amber-200";
    case "STRONG":               return "text-green-700 bg-green-50 border-green-200";
  }
}

// ─── Guidance parsing (backward compatibility) ────────────────────────────────

export function parseGuidance(guidance: string | null): {
  code: string | null;
  reverseScored: boolean;
  riskTag: string | null;
  benchmarkTag: string | null;
  isLikert: boolean;
  questionType: QuestionType;
} {
  if (!guidance) return { code: null, reverseScored: false, riskTag: null, benchmarkTag: null, isLikert: false, questionType: "Likert" };

  const codeMatch      = guidance.match(/code:([^\s|]+)/);
  const reverseScored  = guidance.includes("reverse:true");
  const riskMatch      = guidance.match(/risk:([^\s|]+)/);
  const benchmarkMatch = guidance.match(/benchmark:([^\s|]+)/);
  const isLikert       = guidance.includes("scale:1-5") || guidance.includes("Likert");
  const typeMatch      = guidance.match(/type:([^\s|]+)/);

  let questionType: QuestionType = "Likert";
  if (typeMatch?.[1]) questionType = typeMatch[1] as QuestionType;
  else if (guidance.includes("frequency")) questionType = "Frequency";
  else if (guidance.includes("severity"))  questionType = "Severity";
  else if (guidance.includes("scenario"))  questionType = "Scenario";
  else if (guidance.includes("evidence"))  questionType = "Evidence";
  else if (guidance.includes("open"))      questionType = "OpenEnded";
  else if (guidance.includes("confidence")) questionType = "Confidence";

  return {
    code:          codeMatch?.[1] ?? null,
    reverseScored,
    riskTag:       riskMatch?.[1] ?? null,
    benchmarkTag:  benchmarkMatch?.[1] ?? null,
    isLikert,
    questionType,
  };
}

// ─── Score normalization ──────────────────────────────────────────────────────

/** Normalize any 1-5 response to 0–100, applying reverse-scoring if needed */
export function normalizeScore(raw: number, reverseScored: boolean, scale = 5): number {
  const effective = reverseScored ? (scale + 1 - raw) : raw;
  return Math.round(((effective - 1) / (scale - 1)) * 100);
}

/**
 * Score a single response based on question type.
 * Returns a 0–100 value, or null for non-scorable types (OpenEnded).
 */
export function scoreResponse(
  rawVal: string,
  questionType: QuestionType,
  reverseScored: boolean,
  scenarioOptions?: Array<{ letter: string; score: number }> | null,
): number | null {
  const type = questionType ?? "Likert";

  switch (type) {
    case "Likert":
    case "Frequency":
    case "Severity":
    case "Confidence":
    case "Matrix": {
      const n = parseInt(rawVal, 10);
      if (isNaN(n) || n < 1 || n > 5) return null;
      return normalizeScore(n, reverseScored);
    }

    case "Scenario":
    case "MultipleChoice": {
      // rawVal = "A" | "B" | "C" | "D" — look up score in scenarioOptions
      if (scenarioOptions && scenarioOptions.length > 0) {
        const opt = scenarioOptions.find((o) => o.letter === rawVal.toUpperCase());
        if (opt) return Math.min(100, Math.max(0, opt.score));
      }
      // Fallback: A=100, B=75, C=50, D=25
      const fallback: Record<string, number> = { A: 100, B: 75, C: 50, D: 25 };
      return fallback[rawVal.toUpperCase()] ?? null;
    }

    case "Evidence": {
      // rawVal = comma-separated list of checked items, or "0"/"1"
      if (rawVal === "1" || rawVal.toLowerCase() === "yes") return 100;
      if (rawVal === "0" || rawVal.toLowerCase() === "no")  return 0;
      // Count of evidence items selected
      const count = rawVal.split(",").filter((v) => v.trim().length > 0).length;
      return Math.min(100, count * 20); // up to 5 items = 100
    }

    case "HiddenTrigger":
    case "Contradiction": {
      const n = parseInt(rawVal, 10);
      if (isNaN(n) || n < 1 || n > 5) return null;
      return normalizeScore(n, reverseScored);
    }

    case "OpenEnded":
    case "Ranking":
      return null; // qualitative — excluded from numeric scoring
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChecklistItemMeta = {
  id: string;
  guidance: string | null;
  riskWeight: number;
  sectionId: string;
  sectionTitle: string;
  // WVW v2 fields (optional for backward compat)
  qId?: string;
  questionType?: QuestionType | null;
  reverseScored?: boolean | null;
  riskTag?: string | null;
  pathwayTriggers?: string[];
  scenarioOptions?: Array<{ letter: string; text: string; score: number }> | unknown;
};

export type SurveyResponseRecord = {
  responses: Record<string, string>;
};

export type DomainScore = {
  sectionId: string;
  sectionTitle: string;
  score: number;
  riskBand: RiskBand;
  questionCount: number;
  answeredCount: number;
  flaggedRiskTags: string[];
  confidenceScore?: number;   // 0–100 confidence in this domain's data
};

export type PatternFlagData = {
  riskTag: string;
  severity: "critical" | "elevated" | "moderate";
  avgScore: number;
  questionCount: number;
};

export type ContradictionFlag = {
  qId1: string;
  qId2: string;
  label: string;
  gapScore: number; // 0–100 (higher = more contradictory)
};

export type ScoringResult = {
  overallScore: number;
  riskBand: RiskBand;
  responseCount: number;
  questionCount: number;
  flaggedRiskTags: string[];
  domainScores: DomainScore[];
  patternFlags: PatternFlagData[];
  contradictions: ContradictionFlag[];
  culturalTruthGap: number;    // 0–100 (average contradiction severity)
  triggeredPathways: string[];  // WVW pathway slugs auto-triggered
};

// ─── Industry benchmarks ──────────────────────────────────────────────────────

const INDUSTRY_BENCHMARKS: Record<string, Record<string, number>> = {
  government_defense: {
    "Leadership Trust & Integrity": 68,
    "Psychological Safety & Communication": 62,
    "Burnout Risk & Sustainability": 45,
    "Neuroinclusion & DEI Reality": 58,
    "Moral Injury & Ethical Alignment": 55,
  },
  tech: {
    "Leadership Trust & Integrity": 72,
    "Psychological Safety & Communication": 58,
    "Burnout Risk & Sustainability": 65,
    "Neuroinclusion & DEI Reality": 65,
    "Moral Injury & Ethical Alignment": 60,
  },
  healthcare: {
    "Leadership Trust & Integrity": 65,
    "Psychological Safety & Communication": 55,
    "Burnout Risk & Sustainability": 70,
    "Neuroinclusion & DEI Reality": 60,
    "Moral Injury & Ethical Alignment": 58,
  },
};

// ─── 28 Hidden Pathway Trigger Rules ─────────────────────────────────────────

export type PathwayTriggerRule = {
  id: string;
  label: string;
  pathways: string[];
  check: (scores: Record<string, number>, flags: string[]) => boolean;
};

const PATHWAY_TRIGGER_RULES: PathwayTriggerRule[] = [
  // Burnout + leadership crisis
  {
    id: "BURN_LT_01",
    label: "Moral Exhaustion + Leadership Crisis",
    pathways: ["moral-exhaustion-intervention", "leadership-alignment", "workload-sustainability"],
    check: (s) => (s["Burnout Risk & Sustainability"] ?? 100) < 40 && (s["Leadership Trust & Integrity"] ?? 100) < 50,
  },
  // Burnout + psych safety
  {
    id: "BURN_PS_01",
    label: "Burnout + Psychological Safety Collapse",
    pathways: ["psych-safety-infrastructure", "workload-sustainability", "burnout-recovery"],
    check: (s) => (s["Burnout Risk & Sustainability"] ?? 100) < 45 && (s["Psychological Safety & Communication"] ?? 100) < 55,
  },
  // Critical psych safety alone
  {
    id: "PS_CRIT_01",
    label: "Psychological Safety Infrastructure Needed",
    pathways: ["psych-safety-infrastructure", "voice-inclusion"],
    check: (s) => (s["Psychological Safety & Communication"] ?? 100) < 50,
  },
  // Moral injury
  {
    id: "MI_HIGH_01",
    label: "Moral Injury Recovery Pathway",
    pathways: ["moral-injury-recovery", "leadership-alignment", "ethics-realignment"],
    check: (s) => (s["Moral Injury & Ethical Alignment"] ?? 100) < 45,
  },
  // DEI + psych safety combined
  {
    id: "DEI_PS_01",
    label: "DEI Reality + Psychological Safety Intervention",
    pathways: ["dei-reality-intervention", "psych-safety-infrastructure", "belonging-inclusion"],
    check: (s) => (s["Neuroinclusion & DEI Reality"] ?? 100) < 50 && (s["Psychological Safety & Communication"] ?? 100) < 55,
  },
  // High representation but low equity (performative DEI)
  {
    id: "DEI_PERF_01",
    label: "Performative DEI Detection",
    pathways: ["performative-dei-intervention", "equity-accountability"],
    check: (s, f) => f.includes("performative-dei"),
  },
  // Neuroinclusion + burnout
  {
    id: "NI_BURN_01",
    label: "Neuroinclusion + Burnout Recovery",
    pathways: ["neuroinclusion-package", "burnout-recovery"],
    check: (s) => (s["Neuroinclusion & DEI Reality"] ?? 100) < 50 && (s["Burnout Risk & Sustainability"] ?? 100) < 55,
  },
  // Retaliation fear
  {
    id: "RET_HIGH_01",
    label: "Retaliation Culture Intervention",
    pathways: ["retaliation-prevention", "psych-safety-infrastructure", "reporting-safety"],
    check: (s, f) => f.includes("retaliation") || f.includes("retaliation-fear"),
  },
  // Leadership integrity crisis
  {
    id: "LT_CRIT_01",
    label: "Leadership Trust Crisis — Emergency Intervention",
    pathways: ["executive-alignment", "leadership-integrity-program"],
    check: (s) => (s["Leadership Trust & Integrity"] ?? 100) < 40,
  },
  // Accountability gap
  {
    id: "ACC_GAP_01",
    label: "Accountability Gap Package",
    pathways: ["performance-accountability", "leadership-alignment"],
    check: (s, f) => f.includes("accountability") || f.includes("follow-through"),
  },
  // Communication breakdown
  {
    id: "COMM_01",
    label: "Communication Clarity Package",
    pathways: ["communication-clarity", "leadership-alignment"],
    check: (s, f) => f.includes("communication"),
  },
  // Full organizational crisis (3+ domains critical)
  {
    id: "ORG_CRIT_01",
    label: "Organizational Crisis — Full Transformation Package",
    pathways: ["organizational-transformation", "executive-alignment", "culture-reset"],
    check: (s) => Object.values(s).filter((v) => v < 40).length >= 3,
  },
  // Strong overall — maintenance pathway
  {
    id: "STRONG_01",
    label: "Culture Excellence — Maintenance & Benchmarking",
    pathways: ["culture-excellence", "continuous-improvement"],
    check: (s) => Object.values(s).every((v) => v >= 75),
  },
  // Burnout severity high
  {
    id: "BURN_SEV_01",
    label: "Burnout Prevention Program",
    pathways: ["burnout-prevention", "workload-sustainability"],
    check: (s) => (s["Burnout Risk & Sustainability"] ?? 100) < 55,
  },
  // DEI systems absent
  {
    id: "DEI_SYS_01",
    label: "DEI Systems & Accountability Build",
    pathways: ["dei-systems-build", "equity-accountability"],
    check: (s, f) => f.includes("dei") || f.includes("equity"),
  },
  // Cynicism high
  {
    id: "CYN_HIGH_01",
    label: "Culture Trust Rebuild",
    pathways: ["culture-trust-rebuild", "leadership-alignment"],
    check: (s, f) => f.includes("cynicism") || f.includes("depersonalization"),
  },
  // Voice suppression
  {
    id: "VOICE_01",
    label: "Voice & Influence Package",
    pathways: ["voice-inclusion", "psych-safety-infrastructure"],
    check: (s, f) => f.includes("voice-safety") || f.includes("speaking-up"),
  },
  // High readiness + multiple risks → accelerated transformation
  {
    id: "ACCEL_01",
    label: "Accelerated Transformation Track",
    pathways: ["accelerated-transformation", "organizational-transformation"],
    check: (s, f) => f.includes("high-readiness") && Object.values(s).filter((v) => v < 60).length >= 2,
  },
  // Neuroinclusion stigma high
  {
    id: "NI_STIG_01",
    label: "Neuroinclusion Awareness & Stigma Reduction",
    pathways: ["neuroinclusion-package", "belonging-inclusion"],
    check: (s, f) => f.includes("neuroinclusion") || f.includes("neurodivergent-stigma"),
  },
  // Moral transgression + betrayal
  {
    id: "MI_BETRAY_01",
    label: "Moral Injury + Betrayal Recovery",
    pathways: ["moral-injury-recovery", "leadership-integrity-program"],
    check: (s, f) => f.includes("moral-transgression") || f.includes("betrayal"),
  },
  // Workload recovery failure
  {
    id: "WL_REC_01",
    label: "Workload & Recovery Intervention",
    pathways: ["workload-sustainability", "burnout-recovery"],
    check: (s, f) => f.includes("workload") || f.includes("recovery"),
  },
  // Belonging crisis
  {
    id: "BEL_CRIT_01",
    label: "Belonging & Authenticity Package",
    pathways: ["belonging-inclusion", "dei-reality-intervention"],
    check: (s, f) => f.includes("belonging") || f.includes("code-switching"),
  },
  // Error culture broken
  {
    id: "ERR_01",
    label: "Error Culture & Learning Safety",
    pathways: ["psych-safety-infrastructure", "learning-culture"],
    check: (s, f) => f.includes("error-response") || f.includes("blame-culture"),
  },
  // Power dynamics / favoritism
  {
    id: "POW_01",
    label: "Power Dynamics & Equity Audit",
    pathways: ["equity-accountability", "leadership-integrity-program"],
    check: (s, f) => f.includes("favoritism") || f.includes("power-dynamics"),
  },
  // Ethical alignment crisis
  {
    id: "ETH_01",
    label: "Ethical Realignment Program",
    pathways: ["ethics-realignment", "moral-injury-recovery"],
    check: (s, f) => f.includes("ethical-misalignment") || f.includes("values-conflict"),
  },
  // Reporting fear
  {
    id: "RPT_01",
    label: "Reporting Safety & Whistleblower Protection",
    pathways: ["reporting-safety", "retaliation-prevention"],
    check: (s, f) => f.includes("reporting-fear") || f.includes("whistleblower"),
  },
  // Accommodation failures
  {
    id: "ACCOM_01",
    label: "Accommodation Access Package",
    pathways: ["neuroinclusion-package", "equity-accountability"],
    check: (s, f) => f.includes("accommodation") || f.includes("accommodation-failure"),
  },
  // Guilt/shame elevated
  {
    id: "GUILT_01",
    label: "Moral Recovery & Support Systems",
    pathways: ["moral-injury-recovery", "burnout-recovery"],
    check: (s, f) => f.includes("guilt-shame") || f.includes("existential-conflict"),
  },
];

// ─── Contradiction detection ──────────────────────────────────────────────────

// Known contradiction pair definitions by riskTag
const CONTRADICTION_PAIRS: Array<{
  tag1: string;
  tag2: string;
  label: string;
}> = [
  { tag1: "leadership-feedback",    tag2: "voice-silence",       label: "Leaders say they want feedback, yet employees stay silent" },
  { tag1: "transparency-claim",     tag2: "info-withheld",       label: "Transparency claimed but information withheld in practice" },
  { tag1: "wellbeing-policy",       tag2: "burnout-reality",     label: "Wellbeing policy exists but burnout is widespread" },
  { tag1: "dei-commitment",         tag2: "equity-gap",          label: "DEI commitment stated but equity gaps persist" },
  { tag1: "values-stated",          tag2: "values-violated",     label: "Stated values vs. daily operational reality" },
  { tag1: "psych-safety-claim",     tag2: "retaliation-fear",    label: "Safety claimed but retaliation fear is real" },
  { tag1: "inclusion-claim",        tag2: "belonging-gap",       label: "Inclusion language vs. lived exclusion experience" },
];

function detectContradictions(
  itemMap: Map<string, { riskTag: string | null; questionType: QuestionType; reverseScored: boolean }>,
  itemScores: Map<string, number>,
): ContradictionFlag[] {
  const tagScores = new Map<string, number[]>();
  for (const [itemId, score] of itemScores) {
    const meta = itemMap.get(itemId);
    if (!meta?.riskTag) continue;
    const existing = tagScores.get(meta.riskTag) ?? [];
    existing.push(score);
    tagScores.set(meta.riskTag, existing);
  }

  const flags: ContradictionFlag[] = [];
  for (const pair of CONTRADICTION_PAIRS) {
    const scores1 = tagScores.get(pair.tag1);
    const scores2 = tagScores.get(pair.tag2);
    if (!scores1 || !scores2) continue;

    const avg1 = scores1.reduce((a, b) => a + b, 0) / scores1.length;
    const avg2 = scores2.reduce((a, b) => a + b, 0) / scores2.length;

    // Contradiction = one high (>65), one low (<45)
    const isContradiction = (avg1 > 65 && avg2 < 45) || (avg2 > 65 && avg1 < 45);
    if (isContradiction) {
      const gapScore = Math.round(Math.abs(avg1 - avg2));
      flags.push({ qId1: pair.tag1, qId2: pair.tag2, label: pair.label, gapScore });
    }
  }

  return flags.sort((a, b) => b.gapScore - a.gapScore);
}

// ─── Main scoring function ────────────────────────────────────────────────────

export function computeAuditScores(
  items: ChecklistItemMeta[],
  responses: SurveyResponseRecord[],
): ScoringResult {
  if (responses.length === 0 || items.length === 0) {
    return {
      overallScore: 0, riskBand: "CRITICAL", responseCount: 0,
      questionCount: items.length, flaggedRiskTags: [], domainScores: [],
      patternFlags: [], contradictions: [], culturalTruthGap: 0, triggeredPathways: [],
    };
  }

  // Build item metadata map (merge WVW v2 fields with backward-compat guidance parsing)
  const itemMap = new Map<string, {
    meta: ChecklistItemMeta;
    questionType: QuestionType;
    reverseScored: boolean;
    riskTag: string | null;
    pathwayTriggers: string[];
    scenarioOptions: Array<{ letter: string; score: number }> | null;
  }>();

  for (const item of items) {
    const parsed = parseGuidance(item.guidance);
    const questionType = (item.questionType as QuestionType | null) ?? parsed.questionType;
    const reverseScored = item.reverseScored ?? parsed.reverseScored;
    const riskTag = item.riskTag ?? parsed.riskTag;
    const pathwayTriggers = item.pathwayTriggers ?? [];

    let scenarioOptions: Array<{ letter: string; score: number }> | null = null;
    if (item.scenarioOptions && typeof item.scenarioOptions === "object") {
      scenarioOptions = item.scenarioOptions as Array<{ letter: string; score: number }>;
    }

    itemMap.set(item.id, { meta: item, questionType, reverseScored, riskTag, pathwayTriggers, scenarioOptions });
  }

  // Aggregate scores per item across all responses
  const itemScores = new Map<string, { total: number; count: number }>();
  for (const resp of responses) {
    for (const [itemId, rawVal] of Object.entries(resp.responses)) {
      const entry = itemMap.get(itemId);
      if (!entry) continue;

      const scored = scoreResponse(rawVal, entry.questionType, entry.reverseScored, entry.scenarioOptions);
      if (scored === null) continue;

      const existing = itemScores.get(itemId) ?? { total: 0, count: 0 };
      itemScores.set(itemId, { total: existing.total + scored, count: existing.count + 1 });
    }
  }

  // Group by section
  const sectionMap = new Map<string, {
    title: string;
    items: Array<{ itemId: string; weight: number; riskTag: string | null; questionType: QuestionType; pathwayTriggers: string[] }>;
    confidenceItems: string[]; // itemIds for Confidence questions
  }>();

  for (const item of items) {
    const entry = itemMap.get(item.id)!;
    if (!sectionMap.has(item.sectionId)) {
      sectionMap.set(item.sectionId, { title: item.sectionTitle, items: [], confidenceItems: [] });
    }
    const sec = sectionMap.get(item.sectionId)!;
    sec.items.push({
      itemId: item.id,
      weight: item.riskWeight ?? 1,
      riskTag: entry.riskTag,
      questionType: entry.questionType,
      pathwayTriggers: entry.pathwayTriggers,
    });
    if (entry.questionType === "Confidence") {
      sec.confidenceItems.push(item.id);
    }
  }

  // Build per-item average score lookup (single average for contradiction detection)
  const itemAvgScores = new Map<string, number>();
  for (const [itemId, { total, count }] of itemScores) {
    itemAvgScores.set(itemId, total / count);
  }

  // Compute domain scores
  const domainScores: DomainScore[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const allFlaggedTags = new Set<string>();
  const riskTagAccum = new Map<string, { total: number; count: number }>();
  const domainScoreMap: Record<string, number> = {};

  for (const [sectionId, { title, items: sItems, confidenceItems }] of sectionMap) {
    let sectionWeightedScore = 0;
    let sectionTotalWeight = 0;
    let answeredCount = 0;
    const domainRiskTags = new Set<string>();

    for (const { itemId, weight, riskTag, questionType, pathwayTriggers } of sItems) {
      // Skip non-scoring types from numeric domain calculation
      if (questionType === "OpenEnded" || questionType === "Ranking") continue;

      const scores = itemScores.get(itemId);
      if (!scores) continue;

      const avgItemScore = scores.total / scores.count;
      answeredCount++;
      sectionWeightedScore += avgItemScore * weight;
      sectionTotalWeight += weight;

      if (riskTag) {
        const existing = riskTagAccum.get(riskTag) ?? { total: 0, count: 0 };
        riskTagAccum.set(riskTag, { total: existing.total + avgItemScore, count: existing.count + 1 });
        if (avgItemScore < 60) {
          domainRiskTags.add(riskTag);
          allFlaggedTags.add(riskTag);
        }
      }

      // Collect pathway triggers from question-level flags
      if (avgItemScore < 40) {
        pathwayTriggers.forEach((p) => allFlaggedTags.add(p));
      }
    }

    const sectionScore = sectionTotalWeight > 0
      ? sectionWeightedScore / sectionTotalWeight
      : 0;

    totalWeightedScore += sectionScore * sectionTotalWeight;
    totalWeight += sectionTotalWeight;

    // Domain confidence = average of confidence items in this domain
    let confidenceScore: number | undefined;
    const confScores = confidenceItems
      .map((id) => itemAvgScores.get(id))
      .filter((v): v is number => v !== undefined);
    if (confScores.length > 0) {
      confidenceScore = Math.round(confScores.reduce((a, b) => a + b, 0) / confScores.length);
    }

    const roundedScore = Math.round(sectionScore);
    domainScoreMap[title] = roundedScore;

    domainScores.push({
      sectionId,
      sectionTitle: title,
      score: roundedScore,
      riskBand: getRiskBand(roundedScore),
      questionCount: sItems.filter((i) => i.questionType !== "OpenEnded" && i.questionType !== "Ranking").length,
      answeredCount,
      flaggedRiskTags: [...domainRiskTags],
      confidenceScore,
    });
  }

  const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

  // Build pattern flags from accumulated risk tags
  const patternFlags: PatternFlagData[] = [];
  for (const [riskTag, { total, count }] of riskTagAccum) {
    const avg = total / count;
    if (avg < 60) {
      let severity: "critical" | "elevated" | "moderate";
      if (avg < 40)      severity = "critical";
      else if (avg < 50) severity = "elevated";
      else               severity = "moderate";
      patternFlags.push({ riskTag, severity, avgScore: Math.round(avg), questionCount: count });
    }
  }
  patternFlags.sort((a, b) => a.avgScore - b.avgScore);

  // Contradiction detection (Cultural Truth Gap™)
  const itemTypeMap = new Map<string, { riskTag: string | null; questionType: QuestionType; reverseScored: boolean }>();
  for (const [id, entry] of itemMap) {
    itemTypeMap.set(id, { riskTag: entry.riskTag, questionType: entry.questionType, reverseScored: entry.reverseScored });
  }
  const contradictions = detectContradictions(itemTypeMap, itemAvgScores);
  const culturalTruthGap = contradictions.length > 0
    ? Math.round(contradictions.reduce((a, c) => a + c.gapScore, 0) / contradictions.length)
    : 0;

  // Run pathway trigger rules
  const flaggedTagsArray = [...allFlaggedTags];
  const triggeredPathways = new Set<string>();
  for (const rule of PATHWAY_TRIGGER_RULES) {
    if (rule.check(domainScoreMap, flaggedTagsArray)) {
      rule.pathways.forEach((p) => triggeredPathways.add(p));
    }
  }

  return {
    overallScore,
    riskBand: getRiskBand(overallScore),
    responseCount: responses.length,
    questionCount: items.length,
    flaggedRiskTags: [...allFlaggedTags],
    domainScores,
    patternFlags,
    contradictions,
    culturalTruthGap,
    triggeredPathways: [...triggeredPathways],
  };
}

// ─── Pathway mapping ──────────────────────────────────────────────────────────

const RISK_TAG_TO_PATHWAY: Record<string, string[]> = {
  "retaliation":           ["retaliation-prevention", "psych-safety-infrastructure"],
  "retaliation-fear":      ["retaliation-prevention", "reporting-safety"],
  "psychological-safety":  ["psych-safety-infrastructure"],
  "voice-safety":          ["voice-inclusion", "psych-safety-infrastructure"],
  "burnout":               ["workload-sustainability", "burnout-recovery", "burnout-prevention"],
  "cynicism":              ["culture-trust-rebuild", "leadership-alignment"],
  "depersonalization":     ["burnout-recovery", "moral-injury-recovery"],
  "exhaustion":            ["burnout-recovery", "workload-sustainability"],
  "bias":                  ["dei-reality-intervention", "voice-inclusion"],
  "communication":         ["communication-clarity", "leadership-alignment"],
  "leadership":            ["leadership-alignment", "executive-alignment"],
  "trust":                 ["psych-safety-infrastructure", "leadership-alignment"],
  "inclusion":             ["dei-reality-intervention", "belonging-inclusion"],
  "equity":                ["equity-accountability", "dei-systems-build"],
  "belonging":             ["belonging-inclusion", "dei-reality-intervention"],
  "workload":              ["workload-sustainability"],
  "conflict":              ["conflict-resolution", "psych-safety-infrastructure"],
  "accountability":        ["performance-accountability", "leadership-alignment"],
  "recognition":           ["recognition-retention"],
  "retention":             ["recognition-retention", "workload-sustainability"],
  "compliance":            ["policy-compliance"],
  "policy":                ["policy-compliance"],
  "neuroinclusion":        ["neuroinclusion-package"],
  "neurodivergent-stigma": ["neuroinclusion-package", "belonging-inclusion"],
  "accommodation":         ["neuroinclusion-package", "equity-accountability"],
  "moral-injury":          ["moral-injury-recovery"],
  "moral-transgression":   ["moral-injury-recovery", "ethics-realignment"],
  "betrayal":              ["moral-injury-recovery", "leadership-integrity-program"],
  "guilt-shame":           ["moral-injury-recovery", "burnout-recovery"],
  "ethical-misalignment":  ["ethics-realignment", "leadership-integrity-program"],
  "values-conflict":       ["ethics-realignment", "moral-injury-recovery"],
  "favoritism":            ["equity-accountability", "leadership-integrity-program"],
  "power-dynamics":        ["equity-accountability", "leadership-integrity-program"],
  "reporting-fear":        ["reporting-safety", "retaliation-prevention"],
  "error-response":        ["psych-safety-infrastructure", "learning-culture"],
  "blame-culture":         ["psych-safety-infrastructure", "culture-trust-rebuild"],
  "performative-dei":      ["performative-dei-intervention", "equity-accountability"],
  "code-switching":        ["belonging-inclusion", "dei-reality-intervention"],
  "speaking-up":           ["voice-inclusion", "psych-safety-infrastructure"],
  "pipeline":              ["talent-pipeline"],
};

export function getRecommendedPathways(patternFlags: PatternFlagData[]): string[] {
  const slugSet = new Set<string>();
  for (const flag of patternFlags) {
    const slugs = RISK_TAG_TO_PATHWAY[flag.riskTag] ?? [];
    slugs.forEach((s) => slugSet.add(s));
  }
  return [...slugSet];
}
