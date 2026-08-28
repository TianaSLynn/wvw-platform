/**
 * GET  /api/survey/[token]  — fetch survey questions for the respondent
 * POST /api/survey/[token]  — submit survey responses
 */
import { db } from "@/lib/db";
import { ok, notFound, serverError, badRequest } from "@/lib/api-response";
import { verifySurveyToken } from "@/lib/survey-token";
import { z } from "zod";
import { isAnonymousAudit } from "@/lib/audit-privacy";

const submitSchema = z.object({
  respondentName:  z.string().min(1).optional(),
  respondentEmail: z.string().email().optional(),
  respondentRole:  z.string().optional(),
  respondentDept:  z.string().optional(),
  responses: z.record(z.string(), z.enum(["1","2","3","4","5"])),
  notes: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const auditId = verifySurveyToken(token);
    if (!auditId) return notFound("Survey");

    const audit = await db.audit.findFirst({
      where: { id: auditId, isPublicTokenActive: true, isLocked: false },
      select: {
        id: true, name: true, type: true,
        client: { select: { name: true } },
        org: { select: { name: true } },
        sections: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true, title: true, sortOrder: true,
            checklistItems: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true, question: true, guidance: true,
                riskWeight: true, isRequired: true,
              },
            },
          },
        },
      },
    });
    if (!audit) return notFound("Survey");

    // Filter to sections that have Likert items
    const sections = audit.sections.filter((s) => s.checklistItems.length > 0);
    const totalQuestions = sections.reduce((s, sec) => s + sec.checklistItems.length, 0);

    return ok({ audit: { id: audit.id, name: audit.name, org: audit.org.name, client: audit.client?.name }, sections, totalQuestions });
  } catch (e) { return serverError(e); }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const auditId = verifySurveyToken(token);
    if (!auditId) return notFound("Survey");

    const audit = await db.audit.findFirst({
      where: { id: auditId, isPublicTokenActive: true, isLocked: false },
      select: { id: true, customFields: true },
    });
    if (!audit) return notFound("Survey");

    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    // A survey URL is an audit invitation, not a one-person response record.
    // Every submission must create its own anonymous response; otherwise a
    // shared employee link overwrites the previous participant's answers.
    const customFields = audit.customFields && typeof audit.customFields === "object"
      ? audit.customFields as Record<string, unknown>
      : null;
    const anonymous = isAnonymousAudit(customFields);

    await db.surveyResponse.create({
      data: {
        auditId,
        token: null,
        respondentName:  anonymous ? null : parsed.data.respondentName,
        respondentEmail: anonymous ? null : parsed.data.respondentEmail,
        respondentRole:  parsed.data.respondentRole,
        respondentDept:  parsed.data.respondentDept,
        responses:       parsed.data.responses,
        notes:           parsed.data.notes,
      },
    });

    return ok({ success: true, message: "Thank you — your responses have been recorded." });
  } catch (e) { return serverError(e); }
}
