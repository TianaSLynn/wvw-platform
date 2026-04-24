/**
 * POST /api/audits/[id]/survey
 * Generates a shareable survey invite link for the audit.
 * Auditors can share this link with client employees to collect Likert responses.
 */
import { db } from "@/lib/db";
import { ok, unauthorized, notFound, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { generateSurveyToken } from "@/lib/survey-token";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId } = await params;

    const audit = await db.audit.findFirst({
      where: { id: auditId, orgId: user.orgId },
      select: { id: true, name: true, client: { select: { name: true } } },
    });
    if (!audit) return notFound("Audit");

    const token = generateSurveyToken(auditId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const surveyUrl = `${baseUrl}/survey/${token}`;

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
      select: { id: true },
    });
    if (!audit) return notFound("Audit");

    const responses = await db.surveyResponse.findMany({
      where: { auditId },
      orderBy: { submittedAt: "desc" },
    });

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
      responses: responses.map((r) => ({
        id: r.id,
        respondentName: r.respondentName,
        respondentRole: r.respondentRole,
        respondentDept: r.respondentDept,
        submittedAt: r.submittedAt,
      })),
      averages,
    });
  } catch (e) { return serverError(e); }
}
