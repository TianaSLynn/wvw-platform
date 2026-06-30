import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, serverError, notFound } from "@/lib/api-response";

async function getSurvey(id: string, orgId: string) {
  return db.survey.findFirst({ where: { id, orgId } });
}

// GET /api/surveys/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const survey = await db.survey.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      questions: { orderBy: { sortOrder: "asc" } },
      _count: { select: { submissions: true } },
      audit: { select: { id: true, name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
  if (!survey) return notFound();
  return ok(survey);
}

// PUT /api/surveys/[id] — update metadata + questions bulk save
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const survey = await getSurvey(id, user.orgId);
  if (!survey) return notFound();

  try {
    const body = await req.json() as {
      title?: string;
      description?: string;
      isAnonymous?: boolean;
      showProgress?: boolean;
      allowMultiple?: boolean;
      confirmMessage?: string;
      closeAt?: string | null;
      questions?: Array<{
        id?: string;
        type: string;
        title: string;
        description?: string;
        required?: boolean;
        sortOrder: number;
        options?: unknown;
        rows?: unknown;
        columns?: unknown;
        minValue?: number;
        maxValue?: number;
        minLabel?: string;
        maxLabel?: string;
        logic?: unknown;
        weight?: number;
      }>;
    };

    const updated = await db.$transaction(async (tx) => {
      const s = await tx.survey.update({
        where: { id },
        data: {
          title:         body.title?.trim() ?? survey.title,
          description:   body.description?.trim() ?? null,
          isAnonymous:   body.isAnonymous ?? survey.isAnonymous,
          showProgress:  body.showProgress ?? survey.showProgress,
          allowMultiple: body.allowMultiple ?? survey.allowMultiple,
          confirmMessage:body.confirmMessage ?? survey.confirmMessage,
          closeAt:       body.closeAt ? new Date(body.closeAt) : null,
        },
      });

      if (body.questions) {
        // Delete existing questions and recreate (simple bulk replace)
        await tx.surveyQuestion.deleteMany({ where: { surveyId: id } });
        if (body.questions.length > 0) {
          await tx.surveyQuestion.createMany({
            data: body.questions.map((q, i) => ({
              surveyId:    id,
              type:        q.type,
              title:       q.title,
              description: q.description ?? null,
              required:    q.required ?? true,
              sortOrder:   q.sortOrder ?? i,
              options:     q.options ?? undefined,
              rows:        q.rows ?? undefined,
              columns:     q.columns ?? undefined,
              minValue:    q.minValue ?? null,
              maxValue:    q.maxValue ?? null,
              minLabel:    q.minLabel ?? null,
              maxLabel:    q.maxLabel ?? null,
              logic:       q.logic ?? undefined,
              weight:      q.weight ?? 1.0,
            })),
          });
        }
      }

      return s;
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

// DELETE /api/surveys/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  if (!["ADMIN","SUPER_ADMIN","PARTNER"].includes(user.role)) return unauthorized();

  const survey = await getSurvey(id, user.orgId);
  if (!survey) return notFound();

  await db.survey.delete({ where: { id } });
  return ok({ deleted: true });
}
