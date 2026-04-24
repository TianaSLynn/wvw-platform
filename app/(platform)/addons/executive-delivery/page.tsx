import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Presentation, FileText, CheckCircle, Clock, ChevronRight, Download, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Executive Delivery" };

const DELIVERABLE_TYPES = [
  {
    type: "Executive Summary",
    description: "High-level findings and recommendations for C-suite review",
    icon: Presentation,
    color: "text-gold",
    bg: "bg-gold/10 border-gold/20",
    template: true,
  },
  {
    type: "Board Presentation",
    description: "Governance-ready slide deck with risk dashboard and remediation roadmap",
    icon: Presentation,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    template: true,
  },
  {
    type: "Management Letter",
    description: "Formal letter to management with material weaknesses and controls deficiencies",
    icon: FileText,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    template: true,
  },
  {
    type: "Remediation Roadmap",
    description: "Prioritized action plan with owners, timelines, and success criteria",
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/20",
    template: true,
  },
];

export default async function ExecutiveDeliveryPage() {
  const user = await requireUser();

  const recentAudits = await db.audit.findMany({
    where: { orgId: user.orgId, status: { in: ["REPORTING", "COMPLETED"] } },
    select: {
      id: true, name: true, code: true, status: true, updatedAt: true,
      client: { select: { name: true } },
      findings: { select: { severity: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Executive Delivery"
        subtitle="Executive-level deliverable templates and delivery workflows"
        icon={Presentation}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Deliverable Types",  value: DELIVERABLE_TYPES.length, sub: "available templates" },
          { label: "Ready to Generate",  value: recentAudits.filter((a) => a.status === "REPORTING").length, sub: "audits in reporting" },
          { label: "Delivered",          value: recentAudits.filter((a) => a.status === "COMPLETED").length, sub: "completed audits" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="stat-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Deliverable templates */}
      <div className="section-card">
        <div className="section-card-header">
          <h2 className="font-semibold text-sm">Deliverable Templates</h2>
        </div>
        <div className="divide-y divide-border">
          {DELIVERABLE_TYPES.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.type} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group cursor-pointer">
                <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0", d.bg)}>
                  <Icon size={16} className={d.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{d.type}</p>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                </div>
                <Download size={13} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent eligible audits */}
      <div className="section-card">
        <div className="section-card-header flex items-center justify-between">
          <h2 className="font-semibold text-sm">Eligible Audits for Delivery</h2>
          <Link href="/reports" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View All Reports →</Link>
        </div>
        {recentAudits.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No audits in Reporting or Completed status.</p>
            <Link href="/audits" className="btn-primary text-xs mt-4 inline-flex">Go to Audits</Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentAudits.map((audit) => {
              const criticals = audit.findings.filter((f) => f.severity === "CRITICAL").length;
              return (
                <Link key={audit.id} href={`/audits/${audit.id}/report`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">{audit.name}</p>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", audit.status === "COMPLETED" ? "bg-green-500/10 text-green-500" : "bg-purple-500/10 text-purple-500")}>
                        {audit.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{audit.client.name} · {audit.code} · {audit.findings.length} findings{criticals > 0 ? ` · ${criticals} critical` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {audit.status === "REPORTING" && (
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <Clock size={11} /> Pending
                      </span>
                    )}
                    <ChevronRight size={13} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
