import { ok, unauthorized, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAuditScores, getRecommendedPathways } from "@/lib/scoring";
import type { ChecklistItemMeta } from "@/lib/scoring";
import { getAnonymityThreshold } from "@/lib/audit-privacy";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id: auditId } = await params;

  // Fetch the audit + all checklist items (no guidance filter — score everything)
  const audit = await db.audit.findFirst({
    where: { id: auditId, orgId: user.orgId },
    select: {
      id: true,
      customFields: true,
      sections: {
        select: {
          id: true,
          title: true,
          checklistItems: {
            select: {
              id: true,
              guidance: true,
              riskWeight: true,
              qId: true,
              questionType: true,
              reverseScored: true,
              riskTag: true,
              pathwayTriggers: true,
              scenarioOptions: true,
            },
          },
        },
      },
    },
  });

  if (!audit) return badRequest("Audit not found");

  // Flatten ALL items with full WVW metadata for v2 scoring
  const items: ChecklistItemMeta[] = [];
  for (const section of audit.sections) {
    for (const item of section.checklistItems) {
      items.push({
        id: item.id,
        guidance: item.guidance,
        riskWeight: item.riskWeight ?? 1,
        sectionId: section.id,
        sectionTitle: section.title,
        qId: item.qId ?? undefined,
        questionType: (item.questionType as ChecklistItemMeta["questionType"]) ?? "Likert",
        reverseScored: item.reverseScored ?? false,
        riskTag: item.riskTag ?? undefined,
        pathwayTriggers: item.pathwayTriggers ?? [],
        scenarioOptions: item.scenarioOptions
          ? (item.scenarioOptions as ChecklistItemMeta["scenarioOptions"])
          : undefined,
      });
    }
  }

  if (items.length === 0) {
    return badRequest("This audit has no checklist items. Add sections and questions first.");
  }

  // Fetch all survey responses
  const rawResponses = await db.surveyResponse.findMany({
    where: { auditId },
    select: { responses: true },
  });

  const responses = rawResponses.map((r) => ({
    responses: r.responses as Record<string, string>,
  }));

  const threshold = getAnonymityThreshold(
    audit.customFields && typeof audit.customFields === "object"
      ? audit.customFields as Record<string, unknown>
      : null
  );
  if (responses.length < threshold) {
    return badRequest(
      `Insufficient anonymous data: ${responses.length} of ${threshold} required responses have been submitted.`
    );
  }

  // Compute scores
  const result = computeAuditScores(items, responses);

  // Get recommended pathways
  const recommendedSlugs = getRecommendedPathways(result.patternFlags);
  const pathways = await db.pathway.findMany({
    where: { slug: { in: recommendedSlugs }, isActive: true },
    select: { id: true, slug: true, name: true, pathwayNumber: true, priorityLevel: true },
  });

  const pathwayMap = new Map(pathways.map((p) => [p.slug, p]));

  // Persist in a transaction
  const auditResult = await db.$transaction(async (tx) => {
    // Upsert AuditResult
    const ar = await tx.auditResult.upsert({
      where: { auditId },
      create: {
        auditId,
        overallScore: result.overallScore,
        riskBand: result.riskBand,
        responseCount: result.responseCount,
        questionCount: result.questionCount,
        flaggedRiskTags: result.flaggedRiskTags,
        updatedAt: new Date(),
      },
      update: {
        overallScore: result.overallScore,
        riskBand: result.riskBand,
        responseCount: result.responseCount,
        questionCount: result.questionCount,
        flaggedRiskTags: result.flaggedRiskTags,
        computedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Replace domain results
    await tx.domainResult.deleteMany({ where: { auditResultId: ar.id } });
    if (result.domainScores.length > 0) {
      await tx.domainResult.createMany({
        data: result.domainScores.map((d) => ({
          auditResultId: ar.id,
          sectionId: d.sectionId,
          sectionTitle: d.sectionTitle,
          score: d.score,
          riskBand: d.riskBand,
          questionCount: d.questionCount,
          answeredCount: d.answeredCount,
          flaggedRiskTags: d.flaggedRiskTags,
        })),
      });
    }

    // Replace pattern flags
    await tx.patternFlag.deleteMany({ where: { auditResultId: ar.id } });
    if (result.patternFlags.length > 0) {
      await tx.patternFlag.createMany({
        data: result.patternFlags.map((f) => ({
          auditResultId: ar.id,
          riskTag: f.riskTag,
          severity: f.severity,
          avgScore: f.avgScore,
          questionCount: f.questionCount,
        })),
      });
    }

    // Replace generated recommendations
    await tx.generatedRecommendation.deleteMany({ where: { auditId } });
    const recData: Array<{
      auditId: string;
      pathwayId?: string;
      triggerType: string;
      triggerValue: string;
      title: string;
      body: string;
      priority: number;
    }> = [];

    // Rec from overall risk band
    if (result.riskBand === "CRITICAL" || result.riskBand === "AT_RISK") {
      recData.push({
        auditId,
        triggerType: "risk-band",
        triggerValue: `riskBand:${result.riskBand}`,
        title: result.riskBand === "CRITICAL"
          ? "Immediate Intervention Required"
          : "Targeted Stabilization Needed",
        body: result.riskBand === "CRITICAL"
          ? `This audit's overall score of ${result.overallScore}/100 signals critical organizational health risk. Immediate leadership engagement and structured intervention are recommended.`
          : `This audit's overall score of ${result.overallScore}/100 indicates elevated risk in several areas. A stabilization pathway should be activated within 30 days.`,
        priority: 0,
      });
    }

    // Recs from pattern flags
    for (let i = 0; i < result.patternFlags.length; i++) {
      const flag = result.patternFlags[i]!;
      const riskTagPrefix = flag.riskTag.split("-")[0] ?? flag.riskTag;
      const pathwaySlugs = recommendedSlugs.filter((s) =>
        (pathwayMap.get(s)?.slug ?? "").includes(riskTagPrefix)
      );
      const matchedSlug = pathwaySlugs[0];
      const pathway = matchedSlug ? pathwayMap.get(matchedSlug) : undefined;

      recData.push({
        auditId,
        pathwayId: pathway?.id,
        triggerType: "pattern-flag",
        triggerValue: `riskTag:${flag.riskTag}`,
        title: `Pattern Detected: ${flag.riskTag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
        body: `${flag.questionCount} question${flag.questionCount > 1 ? "s" : ""} flagged this risk area with an average score of ${flag.avgScore}/100 (${flag.severity} concern). ${pathway ? `Recommended pathway: ${pathway.name}.` : "Review this area with your WVW consultant."}`,
        priority: i + 1,
      });
    }

    if (recData.length > 0) {
      await tx.generatedRecommendation.createMany({ data: recData });
    }

    // Update audit overallRiskScore
    await tx.audit.update({
      where: { id: auditId },
      data: { overallRiskScore: result.overallScore },
    });

    return ar;
  });

  return ok({
    auditResultId: auditResult.id,
    overallScore: result.overallScore,
    riskBand: result.riskBand,
    responseCount: result.responseCount,
    anonymityThreshold: threshold,
    domainCount: result.domainScores.length,
    patternFlagCount: result.patternFlags.length,
  });
}

/** GET: Return the stored AuditResult for display */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id: auditId } = await params;

  try {
    const audit = await db.audit.findFirst({
      where: { id: auditId, orgId: user.orgId },
      select: { id: true },
    });
    if (!audit) return badRequest("Audit not found");

    const auditResult = await db.auditResult.findUnique({
      where: { auditId: audit.id },
      include: {
        domainResults: { orderBy: { score: "asc" } },
        patternFlags: { orderBy: { avgScore: "asc" } },
      },
    });

    if (!auditResult) return ok(null);

    const recommendations = await db.generatedRecommendation.findMany({
      where: { auditId: audit.id },
      include: { pathway: { select: { id: true, slug: true, name: true, pathwayNumber: true } } },
      orderBy: { priority: "asc" },
    });

    return ok({ ...auditResult, recommendations });
  } catch (err) {
    return serverError(err);
  }
}
