import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, notFound } from "@/lib/api-response";

// GET /api/surveys/[id]/analytics — aggregated question-level analytics
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const survey = await db.survey.findFirst({
    where: { id, orgId: user.orgId },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });
  if (!survey) return notFound();

  const [totalSubmissions, completedSubmissions] = await Promise.all([
    db.surveySubmission.count({ where: { surveyId: id } }),
    db.surveySubmission.count({ where: { surveyId: id, completedAt: { not: null } } }),
  ]);

  const avgDuration = await db.surveySubmission.aggregate({
    where: { surveyId: id, completedAt: { not: null }, durationSec: { not: null } },
    _avg: { durationSec: true },
  });

  // Per-question breakdown
  const questionAnalytics = await Promise.all(
    survey.questions.map(async (q) => {
      const answers = await db.surveyAnswer.findMany({
        where: {
          questionId: q.id,
          submission: { completedAt: { not: null } },
        },
        select: { valueText: true, valueNumber: true, valueJson: true },
      });

      const responseCount = answers.length;

      if (["likert", "nps", "rating"].includes(q.type)) {
        const nums = answers.map((a) => a.valueNumber).filter((n): n is number => n !== null);
        const avg = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null;

        // Distribution: count per value
        const dist: Record<number, number> = {};
        for (const n of nums) dist[n] = (dist[n] ?? 0) + 1;

        return { questionId: q.id, type: q.type, responseCount, avg, distribution: dist };
      }

      if (["multiple_choice", "checkbox"].includes(q.type)) {
        const counts: Record<string, number> = {};
        for (const a of answers) {
          if (q.type === "checkbox" && a.valueJson) {
            const arr = a.valueJson as string[];
            if (Array.isArray(arr)) {
              for (const v of arr) counts[v] = (counts[v] ?? 0) + 1;
            }
          } else if (a.valueText) {
            counts[a.valueText] = (counts[a.valueText] ?? 0) + 1;
          }
        }
        return { questionId: q.id, type: q.type, responseCount, counts };
      }

      if (["short_text", "long_text"].includes(q.type)) {
        const texts = answers
          .map((a) => a.valueText)
          .filter((t): t is string => t !== null && t.trim() !== "")
          .slice(0, 50);
        return { questionId: q.id, type: q.type, responseCount, texts };
      }

      return { questionId: q.id, type: q.type, responseCount };
    })
  );

  return ok({
    surveyId: id,
    title: survey.title,
    totalSubmissions,
    completedSubmissions,
    completionRate: totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0,
    avgDurationSec: avgDuration._avg.durationSec ?? null,
    questions: questionAnalytics,
  });
}
