import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Heart, Star, MessageSquare, TrendingUp, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Client Experience" };

const NPS_SEGMENTS = [
  { label: "Promoters", range: "9–10", color: "bg-green-500", pct: 62 },
  { label: "Passives",  range: "7–8",  color: "bg-amber-400", pct: 24 },
  { label: "Detractors",range: "0–6",  color: "bg-red-500",   pct: 14 },
];

const JOURNEY_STAGES = [
  { stage: "Onboarding",       status: "strong",  icon: CheckCircle, color: "text-green-500",  note: "Avg 4.8/5 satisfaction" },
  { stage: "Discovery & Scoping", status: "strong", icon: CheckCircle, color: "text-green-500", note: "Avg 4.6/5 satisfaction" },
  { stage: "Fieldwork",        status: "caution", icon: AlertTriangle, color: "text-amber-500", note: "Avg 4.1/5 — schedule delays flagged" },
  { stage: "Reporting",        status: "strong",  icon: CheckCircle, color: "text-green-500",  note: "Avg 4.7/5 satisfaction" },
  { stage: "Close & Follow-up", status: "strong", icon: CheckCircle, color: "text-green-500",  note: "Avg 4.5/5 satisfaction" },
];

const FEEDBACK_ITEMS = [
  { client: "Meridian Financial", date: "Apr 10", score: 9, comment: "The team was incredibly thorough and professional throughout the entire engagement." },
  { client: "Apex Healthcare",    date: "Apr 8",  score: 8, comment: "Strong deliverables, minor delay in mid-fieldwork phase but well communicated." },
  { client: "Summit Logistics",   date: "Apr 5",  score: 10, comment: "Best audit experience we've had. The digital evidence vault was a game-changer." },
  { client: "Nova Tech Partners", date: "Apr 2",  score: 6, comment: "Timeline slipped without proactive notice. Report quality was high once delivered." },
];

export default async function ClientExperiencePage() {
  const user = await requireUser();

  const clientCount = await db.client.count({ where: { orgId: user.orgId, isActive: true } });

  const npsScore = 48; // Net: 62 - 14

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Client Experience"
        subtitle="Client journey mapping, feedback loops, and experience analytics"
        icon={Heart}
        iconBg="bg-red-500/10 border-red-500/20"
        iconColor="text-red-500"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "NPS Score",       value: npsScore,      suffix: "",   color: "text-green-500" },
          { label: "Active Clients",  value: clientCount,   suffix: "",   color: "text-foreground" },
          { label: "Avg Satisfaction",value: "4.5",         suffix: "/5", color: "text-foreground" },
          { label: "Response Rate",   value: "78",          suffix: "%",  color: "text-foreground" },
        ].map(({ label, value, suffix, color }) => (
          <div key={label} className="stat-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}{suffix}</p>
          </div>
        ))}
      </div>

      {/* NPS breakdown */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <Star size={14} className="text-gold" />
          <h2 className="font-semibold text-sm">Net Promoter Score Breakdown</h2>
          <span className="ml-auto text-xs text-muted-foreground">Last 90 days · {48} responses</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
            {NPS_SEGMENTS.map((s) => (
              <div key={s.label} className={cn("h-full transition-all", s.color)} style={{ width: `${s.pct}%` }} />
            ))}
          </div>
          <div className="flex items-center gap-6">
            {NPS_SEGMENTS.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-full", s.color)} />
                <span className="text-xs text-muted-foreground">{s.label} <span className="text-foreground font-medium">{s.pct}%</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Journey stages */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <TrendingUp size={14} className="text-gold" />
          <h2 className="font-semibold text-sm">Journey Stage Health</h2>
        </div>
        <div className="divide-y divide-border">
          {JOURNEY_STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.stage} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <Icon size={14} className={cn("flex-shrink-0", s.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.stage}</p>
                  <p className="text-xs text-muted-foreground">{s.note}</p>
                </div>
                <ChevronRight size={13} className="text-muted-foreground" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent feedback */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <MessageSquare size={14} className="text-gold" />
          <h2 className="font-semibold text-sm">Recent Client Feedback</h2>
        </div>
        <div className="divide-y divide-border">
          {FEEDBACK_ITEMS.map((f) => (
            <div key={f.client} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{f.client}</span>
                  <span className="text-xs text-muted-foreground">{f.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={cn("w-1.5 h-3 rounded-sm", i < f.score ? (f.score >= 9 ? "bg-green-500" : f.score >= 7 ? "bg-amber-400" : "bg-red-500") : "bg-muted")} />
                  ))}
                  <span className={cn("ml-1 text-xs font-bold", f.score >= 9 ? "text-green-500" : f.score >= 7 ? "text-amber-500" : "text-red-500")}>{f.score}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">&ldquo;{f.comment}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link href="/clients" className="btn-ghost text-xs">View All Clients →</Link>
      </div>
    </div>
  );
}
