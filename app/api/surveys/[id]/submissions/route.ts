import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, notFound } from "@/lib/api-response";

// GET /api/surveys/[id]/submissions — paginated list
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const survey = await db.survey.findFirst({ where: { id, orgId: user.orgId } });
  if (!survey) return notFound();

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "25"));

  const [submissions, total] = await Promise.all([
    db.surveySubmission.findMany({
      where: { surveyId: id, completedAt: { not: null } },
      include: {
        answers: {
          include: { question: { select: { title: true, type: true } } },
        },
      },
      orderBy: { completedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.surveySubmission.count({ where: { surveyId: id, completedAt: { not: null } } }),
  ]);

  return ok({ submissions, total, page, limit, pages: Math.ceil(total / limit) });
}
