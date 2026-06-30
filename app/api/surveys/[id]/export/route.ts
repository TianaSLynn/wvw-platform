import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, unauthorized } from "@/lib/api-response";

function csvEscape(val: string): string {
  if (/[",\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

// GET /api/surveys/[id]/export — CSV of all completed submissions
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const survey = await db.survey.findFirst({
    where: { id, orgId: user.orgId },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });
  if (!survey) return notFound();

  const submissions = await db.surveySubmission.findMany({
    where: { surveyId: id, completedAt: { not: null } },
    include: { answers: true },
    orderBy: { completedAt: "asc" },
  });

  const headers = ["Name", "Email", "Role", "Department", "Submitted At", ...survey.questions.map((q) => q.title)];
  const rows = submissions.map((sub) => {
    const base = [
      sub.respondentName ?? "",
      sub.respondentEmail ?? "",
      sub.respondentRole ?? "",
      sub.respondentDept ?? "",
      sub.completedAt ? sub.completedAt.toISOString() : "",
    ];
    const answerCells = survey.questions.map((q) => {
      const a = sub.answers.find((ans) => ans.questionId === q.id);
      if (!a) return "";
      if (a.valueText) return a.valueText;
      if (a.valueNumber !== null && a.valueNumber !== undefined) return String(a.valueNumber);
      if (a.valueJson) {
        const v = a.valueJson as unknown;
        return Array.isArray(v) ? v.join("; ") : JSON.stringify(v);
      }
      return "";
    });
    return [...base, ...answerCells];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
    .join("\n");

  const filename = `${survey.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-responses.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
