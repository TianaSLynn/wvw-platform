import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getAnonymityThreshold } from "@/lib/audit-privacy";
import { getRiskBand, scoreResponse, type QuestionType } from "@/lib/scoring";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

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
      select: {
        id: true,
        name: true,
        code: true,
        customFields: true,
        client: { select: { name: true } },
        sections: {
          orderBy: { sortOrder: "asc" },
          select: {
            title: true,
            checklistItems: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                qId: true,
                question: true,
                questionType: true,
                reverseScored: true,
                riskTag: true,
                riskWeight: true,
                scenarioOptions: true,
              },
            },
          },
        },
      },
    });
    if (!audit) return notFound("Audit");

    const responses = await db.surveyResponse.findMany({
      where: { auditId: audit.id },
      select: { responses: true },
    });
    const customFields = audit.customFields && typeof audit.customFields === "object"
      ? audit.customFields as Record<string, unknown>
      : null;
    const threshold = getAnonymityThreshold(customFields);
    if (responses.length < threshold) {
      return badRequest(
        `Anonymous research export is suppressed until ${threshold} responses are received. Current count: ${responses.length}.`
      );
    }

    const responseMaps = responses.map((r) => r.responses as Record<string, string>);
    const rows: string[][] = [[
      "client",
      "audit_code",
      "audit_name",
      "domain",
      "question_code",
      "question",
      "question_type",
      "risk_tag",
      "risk_weight",
      "anonymous_response_count",
      "average_score_0_100",
      "risk_band",
    ]];

    for (const section of audit.sections) {
      for (const item of section.checklistItems) {
        const scores = responseMaps
          .map((response) => response[item.id])
          .filter((value): value is string => value !== undefined)
          .map((value) => scoreResponse(
            value,
            item.questionType as QuestionType,
            item.reverseScored,
            item.scenarioOptions as Array<{ letter: string; score: number }> | null,
          ))
          .filter((value): value is number => value !== null);
        const average = scores.length
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : null;

        rows.push([
          audit.client.name,
          audit.code ?? audit.id,
          audit.name,
          section.title,
          item.qId ?? item.id,
          item.question,
          item.questionType,
          item.riskTag ?? "",
          String(item.riskWeight),
          String(scores.length),
          average == null ? "" : String(average),
          average == null ? "NOT_SCORED" : getRiskBand(average),
        ]);
      }
    }

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const filename = `${audit.client.name}-${audit.code ?? "audit"}-anonymous-research.csv`
      .replace(/[^a-z0-9_.-]+/gi, "-")
      .toLowerCase();

    return new Response(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
