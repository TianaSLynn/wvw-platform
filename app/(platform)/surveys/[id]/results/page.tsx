import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { ResultsClient } from "./ResultsClient";

export const metadata: Metadata = { title: "Survey Results" };

export default async function SurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const survey = await db.survey.findFirst({
    where: { id, orgId: user.orgId },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });

  if (!survey) return notFound();

  // Load all completed submissions + answers
  const submissions = await db.surveySubmission.findMany({
    where: { surveyId: id, completedAt: { not: null } },
    include: { answers: true },
    orderBy: { completedAt: "desc" },
  });

  // Pre-compute analytics server-side
  const avgDuration = submissions.length
    ? Math.round(
        submissions.filter((s) => s.durationSec).reduce((a, s) => a + (s.durationSec ?? 0), 0) /
        submissions.filter((s) => s.durationSec).length
      )
    : null;

  const questionStats = survey.questions.map((q) => {
    const answers = submissions.flatMap((s) => s.answers.filter((a) => a.questionId === q.id));

    if (["likert", "nps", "rating"].includes(q.type)) {
      const nums = answers.map((a) => a.valueNumber).filter((n): n is number => n !== null);
      const avg = nums.length ? +(nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2) : null;
      const dist: Record<number, number> = {};
      for (const n of nums) dist[n] = (dist[n] ?? 0) + 1;
      return { questionId: q.id, type: q.type, title: q.title, responseCount: nums.length, avg, distribution: dist };
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
      return { questionId: q.id, type: q.type, title: q.title, responseCount: answers.length, counts };
    }

    if (["short_text", "long_text"].includes(q.type)) {
      const texts = answers.map((a) => a.valueText).filter((t): t is string => !!t?.trim()).slice(0, 30);
      return { questionId: q.id, type: q.type, title: q.title, responseCount: answers.length, texts };
    }

    return { questionId: q.id, type: q.type, title: q.title, responseCount: answers.length };
  });

  const data = {
    surveyId: id,
    title: survey.title,
    status: survey.status,
    slug: survey.slug,
    totalSubmissions: submissions.length,
    completionRate: 100, // all fetched are completed
    avgDurationSec: avgDuration,
    questions: questionStats,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/surveys/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-gold" />
          <h1 className="text-xl font-bold">Results — {survey.title}</h1>
        </div>
      </div>

      <ResultsClient data={JSON.parse(JSON.stringify(data))} />
    </div>
  );
}
