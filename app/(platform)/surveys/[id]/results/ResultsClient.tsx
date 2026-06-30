"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type QuestionStat = {
  questionId: string;
  type: string;
  title: string;
  responseCount: number;
  avg?: number | null;
  distribution?: Record<number, number>;
  counts?: Record<string, number>;
  texts?: string[];
};

interface AnalyticsData {
  surveyId: string;
  title: string;
  status: string;
  slug: string;
  totalSubmissions: number;
  completionRate: number;
  avgDurationSec: number | null;
  questions: QuestionStat[];
}

const GOLD    = "#C9A84C";
const NAVY    = "#0F1C3F";
const SAGE    = "#6B8F71";
const COLORS  = [GOLD, NAVY, SAGE, "#8B5E3C", "#6366f1", "#ec4899", "#14b8a6"];

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function NPSLabel({ score }: { score: number }) {
  if (score >= 50) return <span className="text-xs text-green-600 font-medium">Excellent</span>;
  if (score >= 0)  return <span className="text-xs text-amber-600 font-medium">Good</span>;
  return <span className="text-xs text-red-600 font-medium">Needs Work</span>;
}

function QuestionCard({ qs }: { qs: QuestionStat }) {
  if (["likert", "nps", "rating"].includes(qs.type) && qs.distribution !== undefined) {
    const dist = qs.distribution;
    const data = Object.entries(dist)
      .map(([k, v]) => ({ label: k, count: v }))
      .sort((a, b) => Number(a.label) - Number(b.label));
    const avg = qs.avg ?? 0;

    return (
      <div className="section-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm">{qs.title}</p>
          <span className="text-xs text-muted-foreground flex-shrink-0">{qs.responseCount} responses</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold gradient-text-gold">{avg}</span>
          <span className="text-sm text-muted-foreground">avg</span>
          {qs.type === "nps" && <NPSLabel score={Math.round((Object.entries(dist).filter(([k]) => Number(k) >= 9).reduce((s, [, v]) => s + v, 0) - Object.entries(dist).filter(([k]) => Number(k) <= 6).reduce((s, [, v]) => s + v, 0)) / qs.responseCount * 100)} />}
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [v, "Responses"]} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (["multiple_choice", "checkbox"].includes(qs.type) && qs.counts) {
    const data = Object.entries(qs.counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    const max = Math.max(...data.map((d) => d.count), 1);

    return (
      <div className="section-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm">{qs.title}</p>
          <span className="text-xs text-muted-foreground flex-shrink-0">{qs.responseCount} responses</span>
        </div>
        <div className="space-y-2">
          {data.map((d, i) => (
            <div key={d.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate">{d.label}</span>
                <span className="text-muted-foreground ml-2 flex-shrink-0">
                  {d.count} ({Math.round((d.count / max) * 100)}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(d.count / max) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (["short_text", "long_text"].includes(qs.type)) {
    return (
      <div className="section-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm">{qs.title}</p>
          <span className="text-xs text-muted-foreground flex-shrink-0">{qs.responseCount} responses</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {(qs.texts ?? []).map((t, i) => (
            <p key={i} className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              {t}
            </p>
          ))}
          {(qs.texts?.length ?? 0) === 0 && (
            <p className="text-xs text-muted-foreground">No text responses yet</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="section-card p-5">
      <p className="font-semibold text-sm">{qs.title}</p>
      <p className="text-xs text-muted-foreground mt-1">{qs.responseCount} responses</p>
    </div>
  );
}

export function ResultsClient({ data: initial }: { data: AnalyticsData }) {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const res = await fetch(`/api/surveys/${id}/analytics`);
    if (res.ok) {
      const d = await res.json();
      if (d?.data) setData(d.data);
    }
    setRefreshing(false);
  }, [id]);

  // Auto-refresh every 30s when survey is active
  useEffect(() => {
    if (data.status !== "ACTIVE") return;
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [data.status, refresh]);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="stagger-children grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Responses</p>
          <p className="text-3xl font-bold gradient-text-gold mt-1">{data.totalSubmissions}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Completion Rate</p>
          <p className="text-3xl font-bold mt-1">{data.completionRate}%</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Duration</p>
          <p className="text-3xl font-bold mt-1">
            {data.avgDurationSec ? fmtDuration(data.avgDurationSec) : "—"}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Questions</p>
          <p className="text-3xl font-bold mt-1">{data.questions.length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Question Breakdown</h2>
        <div className="flex items-center gap-2">
          <Link href={`/surveys/${id}/responses`} className="btn-ghost text-xs">
            View All Responses →
          </Link>
          <button onClick={refresh} disabled={refreshing}
            className={cn("btn-ghost text-xs flex items-center gap-1", refreshing && "opacity-50")}>
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {data.totalSubmissions === 0 ? (
        <div className="section-card p-12 text-center">
          <p className="font-semibold">No responses yet</p>
          {data.status === "ACTIVE" ? (
            <p className="text-sm text-muted-foreground mt-1">
              Share your survey link to start collecting responses.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">Publish the survey to start collecting responses.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.questions.map((qs) => (
            <QuestionCard key={qs.questionId} qs={qs} />
          ))}
        </div>
      )}
    </div>
  );
}
