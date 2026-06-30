import { db } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/api-response";
import { nanoid } from "nanoid";

// GET /api/s/[slug] — fetch active survey for respondent
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const survey = await db.survey.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      isAnonymous: true,
      showProgress: true,
      allowMultiple: true,
      confirmMessage: true,
      closeAt: true,
      status: true,
      questions: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          required: true,
          sortOrder: true,
          options: true,
          rows: true,
          columns: true,
          minValue: true,
          maxValue: true,
          minLabel: true,
          maxLabel: true,
          logic: true,
        },
      },
    },
  });

  if (!survey) return notFound();
  if (survey.status !== "ACTIVE") return notFound();
  if (survey.closeAt && new Date(survey.closeAt) < new Date()) return notFound();

  return ok(survey);
}

// POST /api/s/[slug] — submit response
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const survey = await db.survey.findUnique({
    where: { slug },
    select: { id: true, status: true, allowMultiple: true, closeAt: true },
  });

  if (!survey || survey.status !== "ACTIVE") return notFound();
  if (survey.closeAt && new Date(survey.closeAt) < new Date()) {
    return badRequest("This survey is closed.");
  }

  try {
    const body = await req.json() as {
      respondentName?: string;
      respondentEmail?: string;
      respondentRole?: string;
      respondentDept?: string;
      fingerprint?: string;
      startedAt?: string;
      answers: Array<{
        questionId: string;
        valueText?: string;
        valueNumber?: number;
        valueJson?: unknown;
      }>;
    };

    if (!Array.isArray(body.answers)) return badRequest("answers required");

    // Duplicate submission guard
    if (!survey.allowMultiple && body.fingerprint) {
      const existing = await db.surveySubmission.findFirst({
        where: { surveyId: survey.id, fingerprint: body.fingerprint },
      });
      if (existing) return badRequest("You have already completed this survey.");
    }

    const submission = await db.$transaction(async (tx) => {
      const sub = await tx.surveySubmission.create({
        data: {
          surveyId:        survey.id,
          respondentName:  body.respondentName  ?? null,
          respondentEmail: body.respondentEmail ?? null,
          respondentRole:  body.respondentRole  ?? null,
          respondentDept:  body.respondentDept  ?? null,
          fingerprint:     body.fingerprint     ?? nanoid(16),
          startedAt:       body.startedAt ? new Date(body.startedAt) : new Date(),
          completedAt:     new Date(),
          durationSec:     body.startedAt
            ? Math.round((Date.now() - new Date(body.startedAt).getTime()) / 1000)
            : null,
        },
      });

      if (body.answers.length > 0) {
        await tx.surveyAnswer.createMany({
          data: body.answers.map((a) => ({
            submissionId: sub.id,
            questionId:   a.questionId,
            valueText:    a.valueText    ?? null,
            valueNumber:  a.valueNumber  ?? null,
            valueJson:    a.valueJson    !== undefined ? JSON.parse(JSON.stringify(a.valueJson)) : undefined,
          })),
        });
      }

      return sub;
    });

    return ok({ submissionId: submission.id });
  } catch (e) {
    return serverError(e);
  }
}
