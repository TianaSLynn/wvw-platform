import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Star, CheckCircle2, BarChart3, Users, ClipboardList, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Satisfaction Surveys" };

export default async function SurveysPage() {
  const user = await requireUser();

  // Real data: audit-linked survey responses
  const [recentResponses, auditsWithSurveys, totalResponses] = await Promise.all([
    // Recent survey responses (newest 10)
    db.surveyResponse.findMany({
      where: { audit: { orgId: user.orgId } },
      include: {
        audit: {
          select: { id: true, name: true, client: { select: { name: true } } },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    }),

    // Audits that have survey responses
    db.audit.findMany({
      where: {
        orgId: user.orgId,
        surveyResponses: { some: {} },
      },
      include: {
        client: { select: { name: true } },
        _count: { select: { surveyResponses: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),

    // Total response count
    db.surveyResponse.count({
      where: { audit: { orgId: user.orgId } },
    }),
  ]);

  // Compute average score from responses (responses is a JSON map of itemId -> likert "1"–"5")
  function avgScore(responses: Record<string, string>): number | null {
    const vals = Object.values(responses).map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 5);
    if (!vals.length) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  const responsesWithScores = recentResponses.map((r) => ({
    ...r,
    avgScore: avgScore(r.responses as Record<string, string>),
  }));

  const overallAvg = responsesWithScores.length
    ? responsesWithScores.reduce((s, r) => s + (r.avgScore ?? 0), 0) / responsesWithScores.filter((r) => r.avgScore !== null).length
    : null;

  // NPS: treat scores 5 = promoter, 3-4 = passive, 1-2 = detractor
  const promoters = responsesWithScores.filter((r) => (r.avgScore ?? 0) >= 4.5).length;
  const detractors = responsesWithScores.filter((r) => (r.avgScore ?? 0) < 3).length;
  const totalNps = responsesWithScores.filter((r) => r.avgScore !== null).length;
  const nps = totalNps > 0 ? Math.round(((promoters - detractors) / totalNps) * 100) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Satisfaction Surveys"
        subtitle="Client feedback collected through audit surveys"
        icon={Star}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
        breadcrumbs={[{ label: "Quality", href: "/quality" }, { label: "Surveys" }]}
        actions={
          <Link href="/audits" className="btn-primary flex items-center gap-2 text-sm">
            <ClipboardList size={15} />
            View Audits
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="section-card p-5 text-center">
          {overallAvg !== null ? (
            <p className="text-4xl font-bold gradient-text-gold">{overallAvg.toFixed(1)}</p>
          ) : (
            <p className="text-4xl font-bold text-muted-foreground/40">—</p>
          )}
          <p className="text-sm font-medium text-foreground mt-1">Avg Satisfaction</p>
          <p className="text-xs text-muted-foreground">out of 5.0</p>
        </div>
        <div className="section-card p-5 text-center">
          {nps !== null ? (
            <p className={cn("text-4xl font-bold", nps >= 50 ? "text-green-500" : nps >= 0 ? "text-gold" : "text-red-500")}>
              {nps > 0 ? "+" : ""}{nps}
            </p>
          ) : (
            <p className="text-4xl font-bold text-muted-foreground/40">—</p>
          )}
          <p className="text-sm font-medium text-foreground mt-1">Net Promoter Score</p>
          <p className="text-xs text-muted-foreground">Estimated from survey data</p>
        </div>
        <div className="section-card p-5 text-center">
          <p className="text-4xl font-bold text-foreground">{totalResponses}</p>
          <p className="text-sm font-medium text-foreground mt-1">Total Responses</p>
          <p className="text-xs text-muted-foreground">Across {auditsWithSurveys.length} audits</p>
        </div>
      </div>

      {totalResponses === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Star size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground">No survey responses yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
            Survey responses are collected when clients submit feedback through the public audit survey link.
            Activate the survey link on any audit to start collecting responses.
          </p>
          <Link href="/audits" className="btn-primary mt-4 text-xs flex items-center gap-1.5 mx-auto">
            <ClipboardList size={13} />
            Go to Audits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Audits with surveys */}
          <div className="section-card">
            <div className="section-card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={15} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold">Audits with Feedback</h2>
              </div>
              <span className="text-xs text-muted-foreground">{auditsWithSurveys.length}</span>
            </div>
            <div className="divide-y divide-border">
              {auditsWithSurveys.map((audit) => (
                <div key={audit.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{audit.name}</p>
                    <p className="text-xs text-muted-foreground">{audit.client.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users size={11} />
                      {audit._count.surveyResponses}
                    </div>
                    <Link href={`/audits/${audit.id}`} className="p-1 text-muted-foreground hover:text-gold transition-colors">
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent responses */}
          <div className="section-card">
            <div className="section-card-header flex items-center gap-2">
              <CheckCircle2 size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Recent Responses</h2>
            </div>
            <div className="divide-y divide-border">
              {responsesWithScores.map((r) => (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">
                      {r.respondentName ?? r.audit.client?.name ?? "Anonymous"}
                    </p>
                    {r.avgScore !== null && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={11}
                            className={i < Math.round(r.avgScore!) ? "text-gold fill-gold" : "text-muted-foreground/30"}
                          />
                        ))}
                        <span className="text-xs font-bold text-foreground ml-1">{r.avgScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.audit.name}
                    {r.respondentRole ? ` · ${r.respondentRole}` : ""}
                    {r.respondentDept ? ` · ${r.respondentDept}` : ""}
                  </p>
                  {r.notes && (
                    <p className="text-xs text-foreground/70 mt-1 italic">&ldquo;{r.notes}&rdquo;</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {new Date(r.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info: how surveys work */}
      <div className="section-card p-4 bg-blue-500/5 border-blue-500/20">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">How it works:</span> Open any audit → Settings tab → enable the public survey link.
          Share the link with your client&apos;s employees to collect anonymous Likert-scale feedback.
          Results appear here automatically.
        </p>
      </div>
    </div>
  );
}
