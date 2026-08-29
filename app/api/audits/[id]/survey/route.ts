/**
 * POST /api/audits/[id]/survey
 * Generates a shareable survey invite link for the audit.
 * Auditors can share this link with client employees to collect Likert responses.
 */
import { db } from "@/lib/db";
import { ok, unauthorized, notFound, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { generateSurveyToken } from "@/lib/survey-token";
import { getAnonymityThreshold, getReleaseStatus } from "@/lib/audit-privacy";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId } = await params;

    const audit = await db.audit.findFirst({
      where: { id: auditId, orgId: user.orgId },
      select: {
        id: true,
        name: true,
        isLocked: true,
        customFields: true,
        client: { select: { name: true } },
      },
    });
    if (!audit) return notFound("Audit");
    if (audit.isLocked) return badRequest("This audit is locked and cannot collect responses.");

    await db.audit.update({
      where: { id: audit.id },
      data: {
        isPublicTokenActive: true,
        customFields: {
          ...(audit.customFields && typeof audit.customFields === "object"
            ? audit.customFields
            : {}),
          collectionStatus: "OPEN",
          collectionOpenedAt: new Date().toISOString(),
        },
      },
    });

    const token = generateSurveyToken(auditId);
    const origin = process.env.NEXT_PUBLIC_APP_URL
      ?? `${new URL(req.url).protocol}//${new URL(req.url).host}`;
    const surveyUrl = `${origin}/survey/${token}`;

    return ok({ token, surveyUrl, auditName: audit.name, clientName: audit.client?.name });
  } catch (e) { return serverError(e); }
}

/**
 * GET /api/audits/[id]/survey
 * Returns aggregated survey results for the audit.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId } = await params;

    const audit = await db.audit.findFirst({
      where: { id: auditId, orgId: user.orgId },
      select: { id: true, customFields: true },
    });
    if (!audit) return notFound("Audit");

    const responses = await db.surveyResponse.findMany({
      where: { auditId },
      orderBy: { submittedAt: "desc" },
    });

    const customFields = audit.customFields && typeof audit.customFields === "object"
      ? audit.customFields as Record<string, unknown>
      : null;
    const threshold = getAnonymityThreshold(customFields);
    const release = getReleaseStatus(responses.length, threshold);

    if (!release.released) {
      return ok({
        totalResponses: responses.length,
        anonymity: release,
        responses: [],
        averages: {},
      });
    }

    // Aggregate: per item, compute average score and count
    const aggregated: Record<string, { total: number; count: number; scores: number[] }> = {};
    for (const resp of responses) {
      const r = resp.responses as Record<string, string>;
      for (const [itemId, score] of Object.entries(r)) {
        const num = parseInt(score);
        if (isNaN(num)) continue;
        if (!aggregated[itemId]) aggregated[itemId] = { total: 0, count: 0, scores: [] };
        aggregated[itemId]!.total += num;
        aggregated[itemId]!.count += 1;
        aggregated[itemId]!.scores.push(num);
      }
    }

    const averages = Object.fromEntries(
      Object.entries(aggregated).map(([id, { total, count, scores }]) => [
        id,
        { avg: total / count, count, scores },
      ])
    );

    return ok({
      totalResponses: responses.length,
      anonymity: release,
      // Response identities are intentionally not returned with audit results.
      // Participant support belongs in the invitation registry, not response data.
      responses: [],
      averages,
    });
  } catch (e) { return serverError(e); }
}
