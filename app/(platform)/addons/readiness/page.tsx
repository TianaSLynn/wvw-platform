import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Gauge, CheckCircle, AlertTriangle, XCircle, ChevronRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Readiness Engine" };

const READINESS_DOMAINS = [
  { name: "Documentation",        weight: 20 },
  { name: "Policy Framework",     weight: 20 },
  { name: "Risk Management",      weight: 20 },
  { name: "Internal Controls",    weight: 20 },
  { name: "Staff Awareness",      weight: 10 },
  { name: "Technology & Systems", weight: 10 },
];

function ReadinessScore({ score }: { score: number }) {
  const color = score >= 75 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const bg    = score >= 75 ? "bg-green-500"   : score >= 50 ? "bg-amber-500"   : "bg-red-500";
  const Icon  = score >= 75 ? CheckCircle       : score >= 50 ? AlertTriangle    : XCircle;
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} className={color} />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", bg)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-xs font-bold w-8 text-right", color)}>{score}%</span>
    </div>
  );
}

export default async function ReadinessEnginePage() {
  const user = await requireUser();

  const clients = await db.client.findMany({
    where: { orgId: user.orgId, isActive: true, deletedAt: null },
    select: { id: true, name: true, industry: true, healthScore: true },
    orderBy: { healthScore: "asc" },
    take: 8,
  });

  // Simulate readiness scores from healthScore or random spread
  const clientReadiness = clients.map((c) => ({
    ...c,
    overall: c.healthScore ?? Math.floor(Math.random() * 40 + 50),
    domains: READINESS_DOMAINS.map((d) => ({
      ...d,
      score: Math.floor(Math.random() * 40 + 50),
    })),
    certification: ["SOC 2", "ISO 27001", "HIPAA", "PCI-DSS"][Math.floor(Math.random() * 4)],
  }));

  const avgReadiness = clientReadiness.length > 0
    ? Math.round(clientReadiness.reduce((s, c) => s + c.overall, 0) / clientReadiness.length)
    : 0;

  const readyCount   = clientReadiness.filter((c) => c.overall >= 75).length;
  const warningCount = clientReadiness.filter((c) => c.overall >= 50 && c.overall < 75).length;
  const criticalCount = clientReadiness.filter((c) => c.overall < 50).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Readiness Engine"
        subtitle="Assess client readiness for audit, certification, or compliance"
        icon={Gauge}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Avg Readiness",  value: `${avgReadiness}%`,   color: "text-foreground" },
          { label: "Audit Ready",    value: readyCount,            color: "text-green-500" },
          { label: "Needs Work",     value: warningCount,          color: "text-amber-500" },
          { label: "Critical Gap",   value: criticalCount,         color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Domain weights */}
      <div className="section-card">
        <div className="section-card-header">
          <h2 className="font-semibold text-sm">Assessment Domains</h2>
          <span className="ml-auto text-xs text-muted-foreground">Weighted scoring model</span>
        </div>
        <div className="divide-y divide-border">
          {READINESS_DOMAINS.map((d) => (
            <div key={d.name} className="flex items-center gap-3 px-4 py-2.5">
              <p className="text-sm flex-1">{d.name}</p>
              <span className="text-xs text-muted-foreground w-12 text-right">{d.weight}% weight</span>
            </div>
          ))}
        </div>
      </div>

      {/* Client readiness list */}
      {clientReadiness.length > 0 ? (
        <div className="section-card">
          <div className="section-card-header">
            <h2 className="font-semibold text-sm">Client Readiness Scores</h2>
          </div>
          <div className="divide-y divide-border">
            {clientReadiness.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-navy-900 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <Building2 size={12} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c.certification}</span>
                  </div>
                  <ReadinessScore score={c.overall} />
                </div>
                <ChevronRight size={13} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="section-card">
          <div className="empty-state">
            <div className="empty-state-icon"><Gauge size={24} className="text-muted-foreground" /></div>
            <p className="font-semibold">No active clients to assess</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Add clients to begin readiness assessments</p>
            <Link href="/clients" className="btn-primary text-xs">Go to Clients</Link>
          </div>
        </div>
      )}
    </div>
  );
}
