import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  DollarSign, ClipboardList, Users, AlertTriangle,
  Zap, Clock, CheckCircle2, TrendingUp, ArrowRight, Shield,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { DashboardCharts } from "./DashboardCharts";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

// ─── Data fetchers ─────────────────────────────────────────────────────────────

async function getWvwDashboardData(orgId: string) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalClients, activeProjects, activeAudits, openFindings,
    thisMonthRevenue, lastMonthRevenue, overdueInvoices,
    recentAudits, recentActivity, upcomingMilestones,
  ] = await Promise.all([
    db.client.count({ where: { orgId, isActive: true, deletedAt: null } }),
    db.project.count({ where: { orgId, status: "ACTIVE", deletedAt: null } }),
    db.audit.count({ where: { orgId, status: { in: ["FIELDWORK", "REVIEW", "PLANNING"] } } }),
    db.auditFinding.count({
      where: { audit: { orgId }, status: { in: ["OPEN", "IN_PROGRESS"] }, severity: { in: ["CRITICAL", "HIGH"] } },
    }),
    db.invoice.aggregate({
      where: { orgId, status: { in: ["PAID", "PARTIAL"] }, issueDate: { gte: firstOfMonth } },
      _sum: { total: true },
    }),
    db.invoice.aggregate({
      where: { orgId, status: { in: ["PAID", "PARTIAL"] }, issueDate: { gte: firstOfLastMonth, lte: endOfLastMonth } },
      _sum: { total: true },
    }),
    db.invoice.count({ where: { orgId, status: "OVERDUE" } }),
    db.audit.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { client: { select: { name: true } }, _count: { select: { findings: true } } },
    }),
    db.activityLog.findMany({
      where: { orgId }, orderBy: { timestamp: "desc" }, take: 8,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    db.milestone.findMany({
      where: { project: { orgId }, isCompleted: false, dueDate: { gte: now, lte: new Date(now.getFullYear(), now.getMonth() + 1, 0) } },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: "asc" }, take: 5,
    }),
  ]);

  const thisRevenue = thisMonthRevenue._sum.total ?? 0;
  const lastRevenue = lastMonthRevenue._sum.total ?? 0;
  const revenueTrend = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0;

  return { totalClients, activeProjects, activeAudits, openFindings, thisRevenue, revenueTrend, overdueInvoices, recentAudits, recentActivity, upcomingMilestones };
}

async function getConsultantDashboardData(orgId: string, userId: string) {
  const now = new Date();
  const [
    assignedAudits, myFindings, recentActivity, upcomingMilestones,
  ] = await Promise.all([
    db.audit.findMany({
      where: { orgId, members: { some: { userId } }, status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { client: { select: { name: true } }, _count: { select: { findings: true } } },
    }),
    db.auditFinding.count({
      where: { audit: { orgId, members: { some: { userId } } }, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    db.activityLog.findMany({
      where: { orgId, userId }, orderBy: { timestamp: "desc" }, take: 8,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    db.milestone.findMany({
      where: { project: { orgId }, isCompleted: false, dueDate: { gte: now, lte: new Date(now.getFullYear(), now.getMonth() + 1, 0) } },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: "asc" }, take: 5,
    }),
  ]);

  return { assignedAudits, myFindings, recentActivity, upcomingMilestones };
}

async function getClientDashboardData(orgId: string) {
  const [audits, recommendations] = await Promise.all([
    db.audit.findMany({
      where: { org: { clients: { some: { org: { id: orgId } } } }, status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" }, take: 5,
      include: {
        client: { select: { name: true } },
        auditResult: { select: { overallScore: true, riskBand: true, responseCount: true } },
        _count: { select: { surveyResponses: true } },
      },
    }),
    db.generatedRecommendation.findMany({
      where: { audit: { orgId }, dismissedAt: null },
      orderBy: { priority: "asc" }, take: 5,
      include: { pathway: { select: { name: true, pathwayNumber: true } } },
    }),
  ]);

  return { audits, recommendations };
}

// ─── Shared helpers ─────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT:     { bg: "bg-slate-500/10",  text: "text-slate-400",  dot: "bg-slate-400"  },
  PLANNING:  { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  FIELDWORK: { bg: "bg-blue-500/10",   text: "text-blue-400",   dot: "bg-blue-400"   },
  REVIEW:    { bg: "bg-amber-500/10",  text: "text-amber-400",  dot: "bg-amber-400"  },
  REPORTING: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  COMPLETED: { bg: "bg-green-500/10",  text: "text-green-400",  dot: "bg-green-400"  },
  ARCHIVED:  { bg: "bg-slate-500/10",  text: "text-slate-400",  dot: "bg-slate-400"  },
};
const STATUS_LABELS: Record<string, string> = {
  FIELDWORK: "Fieldwork", PLANNING: "Planning", REVIEW: "Review",
  REPORTING: "Reporting", COMPLETED: "Completed", ARCHIVED: "Archived", DRAFT: "Draft",
};
const BAND_COLORS: Record<string, string> = {
  CRITICAL:            "text-red-600",
  AT_RISK:             "text-orange-600",
  NEEDS_STRENGTHENING: "text-amber-600",
  STRONG:              "text-green-600",
};
const BAND_LABELS: Record<string, string> = {
  CRITICAL: "Critical", AT_RISK: "At Risk", NEEDS_STRENGTHENING: "Needs Strengthening", STRONG: "Strong",
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES["DRAFT"]!;
  return (
    <span className={cn("status-pill border-transparent", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", s.dot)} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ActivityFeed({ items }: { items: Array<{ id: string; user: { firstName: string; lastName: string } | null; action: string; entityLabel: string | null; timestamp: Date }> }) {
  return (
    <ul className="space-y-3 p-4">
      {items.length === 0 ? (
        <li className="text-xs text-muted-foreground text-center py-6">No recent activity</li>
      ) : items.map((log, i) => (
        <li key={log.id} className="flex items-start gap-2.5 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-navy-700 to-navy-900 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[9px] font-bold text-gold/80">
              {log.user?.firstName?.[0]}{log.user?.lastName?.[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-foreground leading-snug">
              <span className="font-medium">{log.user?.firstName} {log.user?.lastName}</span>{" "}
              <span className="text-muted-foreground">{log.action.replace(/\./g, " ")}</span>{" "}
              {log.entityLabel && <span className="font-medium">{log.entityLabel}</span>}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(log.timestamp, "MMM d, h:mm a")}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Role-specific dashboard views ────────────────────────────────────────────

type WvwData = Awaited<ReturnType<typeof getWvwDashboardData>>;
type ConsultantData = Awaited<ReturnType<typeof getConsultantDashboardData>>;
type ClientData = Awaited<ReturnType<typeof getClientDashboardData>>;

function WvwLeadershipDashboard({ data, orgId }: { data: WvwData; orgId: string }) {
  return (
    <>
      <section aria-label="Key metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Monthly Revenue" value={formatCurrency(data.thisRevenue, "USD", true)} trend={data.revenueTrend} trendLabel="vs last month" icon={DollarSign} iconColor="text-gold" iconBg="bg-gold/10 border-gold/20" />
        <StatCard label="Active Audits" value={data.activeAudits} subvalue={`${data.openFindings} critical findings`} icon={ClipboardList} iconColor="text-blue-500" iconBg="bg-blue-500/10 border-blue-500/20" />
        <StatCard label="Active Clients" value={data.totalClients} subvalue={`${data.activeProjects} projects`} icon={Users} iconColor="text-green-500" iconBg="bg-green-500/10 border-green-500/20" />
        <StatCard label="Overdue Invoices" value={data.overdueInvoices} subvalue={data.overdueInvoices > 0 ? "Needs attention" : "All clear"} icon={AlertTriangle} iconColor={data.overdueInvoices > 0 ? "text-red-500" : "text-green-500"} iconBg={data.overdueInvoices > 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          <DashboardCharts orgId={orgId} />
        </div>
        <div className="space-y-5">
          <div className="section-card">
            <div className="section-card-header">
              <div className="flex items-center gap-2"><Zap size={14} className="text-gold" /><h2 className="font-semibold text-sm">Upcoming Milestones</h2></div>
              <span className="text-xs text-muted-foreground">This month</span>
            </div>
            <div className="p-4">
              {data.upcomingMilestones.length === 0 ? (
                <div className="empty-state py-8"><CheckCircle2 size={20} className="text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">No milestones this month</p></div>
              ) : (
                <ul className="space-y-3">
                  {data.upcomingMilestones.map((m, i) => (
                    <li key={m.id} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.project.name}</p>
                        {m.dueDate && <p className="text-[11px] text-amber-500 font-medium mt-0.5">Due {formatDate(m.dueDate)}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="section-card">
            <div className="section-card-header">
              <div className="flex items-center gap-2"><Clock size={14} className="text-muted-foreground" /><h2 className="font-semibold text-sm">Recent Activity</h2></div>
              <Link href="/notifications" className="text-xs text-gold animated-underline">View all</Link>
            </div>
            <ActivityFeed items={data.recentActivity} />
          </div>
        </div>
      </div>

      <RecentAuditsTable audits={data.recentAudits} />
    </>
  );
}

function ConsultantDashboard({ data }: { data: ConsultantData }) {
  return (
    <>
      <section aria-label="Key metrics" className="grid grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        <StatCard label="My Active Audits" value={data.assignedAudits.length} icon={ClipboardList} iconColor="text-blue-500" iconBg="bg-blue-500/10 border-blue-500/20" />
        <StatCard label="Open Findings" value={data.myFindings} subvalue={data.myFindings > 0 ? "Needs attention" : "All clear"} icon={AlertTriangle} iconColor={data.myFindings > 0 ? "text-red-500" : "text-green-500"} iconBg={data.myFindings > 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"} />
        <StatCard label="Milestones Due" value={data.upcomingMilestones.length} subvalue="This month" icon={Zap} iconColor="text-gold" iconBg="bg-gold/10 border-gold/20" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="section-card animate-fade-in">
            <div className="section-card-header">
              <div className="flex items-center gap-2"><ClipboardList size={14} className="text-muted-foreground" /><h2 className="font-semibold text-sm">My Assigned Audits</h2></div>
              <Link href="/audits" className="flex items-center gap-1 text-xs text-gold animated-underline">View all <ArrowRight size={11} /></Link>
            </div>
            {data.assignedAudits.length === 0 ? (
              <div className="empty-state py-10"><ClipboardList size={22} className="text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">No audits assigned to you yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Audit</th><th>Client</th><th>Status</th><th>Findings</th></tr></thead>
                  <tbody>
                    {data.assignedAudits.map((a) => (
                      <tr key={a.id}>
                        <td><Link href={`/audits/${a.id}`} className="font-medium text-foreground hover:text-gold transition-colors animated-underline">{a.name}</Link></td>
                        <td className="text-muted-foreground">{a.client.name}</td>
                        <td><StatusPill status={a.status} /></td>
                        <td><span className={cn("font-semibold text-sm", a._count.findings > 0 ? "text-amber-500" : "text-muted-foreground")}>{a._count.findings}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-5">
          <div className="section-card">
            <div className="section-card-header"><div className="flex items-center gap-2"><Clock size={14} className="text-muted-foreground" /><h2 className="font-semibold text-sm">My Activity</h2></div></div>
            <ActivityFeed items={data.recentActivity} />
          </div>
        </div>
      </div>
    </>
  );
}

function ClientDashboard({ data }: { data: ClientData }) {
  return (
    <>
      <section aria-label="Key metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        <StatCard label="Active Audits" value={data.audits.filter((a) => a.status !== "COMPLETED").length} icon={ClipboardList} iconColor="text-blue-500" iconBg="bg-blue-500/10 border-blue-500/20" />
        <StatCard label="Survey Responses" value={data.audits.reduce((s, a) => s + a._count.surveyResponses, 0)} icon={Users} iconColor="text-green-500" iconBg="bg-green-500/10 border-green-500/20" />
        <StatCard label="Recommendations" value={data.recommendations.length} icon={TrendingUp} iconColor="text-gold" iconBg="bg-gold/10 border-gold/20" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          {/* Audits with scores */}
          <div className="section-card animate-fade-in">
            <div className="section-card-header">
              <div className="flex items-center gap-2"><Shield size={14} className="text-muted-foreground" /><h2 className="font-semibold text-sm">Your Audits</h2></div>
            </div>
            {data.audits.length === 0 ? (
              <div className="empty-state py-10"><ClipboardList size={22} className="text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">No audits yet</p></div>
            ) : (
              <div className="divide-y divide-border">
                {data.audits.map((a) => (
                  <div key={a.id} className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.client.name} · {a._count.surveyResponses} responses</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {a.auditResult ? (
                        <div className="text-right">
                          <p className="text-lg font-bold">{a.auditResult.overallScore}<span className="text-xs font-normal text-muted-foreground">/100</span></p>
                          <p className={cn("text-[11px] font-semibold", BAND_COLORS[a.auditResult.riskBand] ?? "text-muted-foreground")}>
                            {BAND_LABELS[a.auditResult.riskBand] ?? a.auditResult.riskBand}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No results yet</span>
                      )}
                      <StatusPill status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="section-card">
          <div className="section-card-header">
            <div className="flex items-center gap-2"><TrendingUp size={14} className="text-gold" /><h2 className="font-semibold text-sm">Recommendations</h2></div>
          </div>
          {data.recommendations.length === 0 ? (
            <div className="p-6 text-center"><p className="text-xs text-muted-foreground">No recommendations generated yet. Results are produced after survey scoring.</p></div>
          ) : (
            <div className="divide-y divide-border">
              {data.recommendations.map((rec) => (
                <div key={rec.id} className="p-4">
                  <p className="text-xs font-semibold text-foreground mb-1">{rec.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.body}</p>
                  {rec.pathway && (
                    <p className="text-[11px] text-blue-600 font-medium mt-1.5">P{rec.pathway.pathwayNumber}: {rec.pathway.name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function RecentAuditsTable({ audits }: { audits: Array<{ id: string; name: string; code: string | null; status: string; client: { name: string }; updatedAt: Date; _count: { findings: number } }> }) {
  return (
    <div className="section-card animate-fade-in">
      <div className="section-card-header">
        <div className="flex items-center gap-2"><ClipboardList size={14} className="text-muted-foreground" /><h2 className="font-semibold text-sm">Recent Audits</h2></div>
        <Link href="/audits" className="flex items-center gap-1 text-xs text-gold animated-underline">View all <ArrowRight size={11} /></Link>
      </div>
      {audits.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><ClipboardList size={22} className="text-muted-foreground" /></div><p className="font-semibold text-sm">No audits yet</p><p className="text-xs text-muted-foreground mt-1 mb-4">Start your first audit to see it here</p><Link href="/audits/new" className="btn-gold text-xs px-3 py-1.5">Create Audit</Link></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Audit</th><th className="hidden sm:table-cell">Client</th><th>Status</th><th className="hidden md:table-cell">Findings</th><th className="hidden lg:table-cell">Updated</th></tr></thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id}>
                  <td>
                    <Link href={`/audits/${audit.id}`} className="font-medium text-foreground hover:text-gold transition-colors animated-underline">{audit.name}</Link>
                    {audit.code && <span className="ml-2 text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{audit.code}</span>}
                  </td>
                  <td className="text-muted-foreground hidden sm:table-cell">{audit.client.name}</td>
                  <td><StatusPill status={audit.status} /></td>
                  <td className="text-muted-foreground hidden md:table-cell"><span className={cn("font-semibold", audit._count.findings > 0 ? "text-amber-500" : "text-muted-foreground")}>{audit._count.findings}</span></td>
                  <td className="text-muted-foreground text-xs hidden lg:table-cell">{formatDate(audit.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await requireUser();
  const role = user.role as string;

  const isWvwLeadership = ["SUPER_ADMIN", "ADMIN", "PARTNER", "MANAGER"].includes(role);
  const isConsultant    = ["CONSULTANT", "AUDITOR"].includes(role);
  const isClient        = ["CLIENT_ADMIN", "CLIENT_USER"].includes(role);

  const [wvwData, consultantData, clientData] = await Promise.all([
    isWvwLeadership ? getWvwDashboardData(user.orgId) : Promise.resolve(null),
    isConsultant    ? getConsultantDashboardData(user.orgId, user.id) : Promise.resolve(null),
    isClient        ? getClientDashboardData(user.orgId) : Promise.resolve(null),
  ]);

  const roleLabel = isWvwLeadership ? "Leadership View" : isConsultant ? "Consultant View" : "Client View";

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting()}, <span className="gradient-text-gold">{user.firstName}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {formatDate(new Date(), "EEEE, MMMM d, yyyy")} &middot; {user.org.name}
            <span className="ml-2 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{roleLabel}</span>
          </p>
        </div>
        {isWvwLeadership && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/audits/new" className="btn-primary hidden sm:inline-flex">
              <ClipboardList size={14} />
              New Audit
            </Link>
          </div>
        )}
      </div>

      {/* Role-specific content */}
      {isWvwLeadership && wvwData && <WvwLeadershipDashboard data={wvwData} orgId={user.orgId} />}
      {isConsultant    && consultantData && <ConsultantDashboard data={consultantData} />}
      {isClient        && clientData && <ClientDashboard data={clientData} />}
    </div>
  );
}
