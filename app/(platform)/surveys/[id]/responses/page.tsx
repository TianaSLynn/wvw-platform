import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, List, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Survey Responses" };

export default async function SurveyResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { page: pageStr } = await searchParams;

  const survey = await db.survey.findFirst({
    where: { id, orgId: user.orgId },
    include: { questions: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, type: true } } },
  });

  if (!survey) return notFound();

  const page  = Math.max(1, parseInt(pageStr ?? "1"));
  const limit = 20;

  const [submissions, total] = await Promise.all([
    db.surveySubmission.findMany({
      where: { surveyId: id, completedAt: { not: null } },
      include: {
        answers: {
          select: { questionId: true, valueText: true, valueNumber: true, valueJson: true },
        },
      },
      orderBy: { completedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.surveySubmission.count({ where: { surveyId: id, completedAt: { not: null } } }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/surveys/${id}/results`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <List size={18} className="text-gold" />
            <h1 className="text-xl font-bold">Responses — {survey.title}</h1>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      {submissions.length === 0 ? (
        <div className="section-card p-12 text-center">
          <p className="font-semibold">No responses yet</p>
          <p className="text-sm text-muted-foreground mt-1">Responses will appear here once people complete the survey.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub, si) => {
            const num = total - (page - 1) * limit - si;
            return (
              <div key={sub.id} className="section-card">
                <div className="section-card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">#{num}</span>
                    {!survey.isAnonymous && sub.respondentName && (
                      <span className="text-sm font-semibold">{sub.respondentName}</span>
                    )}
                    {survey.isAnonymous && (
                      <span className="text-sm text-muted-foreground">Anonymous</span>
                    )}
                    {sub.respondentRole && (
                      <span className="text-xs text-muted-foreground">· {sub.respondentRole}</span>
                    )}
                    {sub.respondentDept && (
                      <span className="text-xs text-muted-foreground">· {sub.respondentDept}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {sub.durationSec && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {Math.floor(sub.durationSec / 60)}m {sub.durationSec % 60}s
                      </span>
                    )}
                    <span>{sub.completedAt ? new Date(sub.completedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {survey.questions.map((q) => {
                    const answer = sub.answers.find((a) => a.questionId === q.id);
                    let display = "—";
                    if (answer) {
                      if (answer.valueNumber !== null) display = String(answer.valueNumber);
                      else if (answer.valueText)        display = answer.valueText;
                      else if (answer.valueJson) {
                        const arr = answer.valueJson as string[];
                        display = Array.isArray(arr) ? arr.join(", ") : JSON.stringify(answer.valueJson);
                      }
                    }
                    return (
                      <div key={q.id} className="grid grid-cols-5 gap-2 text-sm">
                        <p className="col-span-2 text-muted-foreground text-xs truncate">{q.title}</p>
                        <p className={cn("col-span-3 text-xs", display === "—" ? "text-muted-foreground" : "")}>
                          {display}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={`?page=${page - 1}`} className="btn-ghost text-xs px-3">← Prev</Link>
              )}
              <span className="text-xs text-muted-foreground">{page} / {pages}</span>
              {page < pages && (
                <Link href={`?page=${page + 1}`} className="btn-ghost text-xs px-3">Next →</Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
