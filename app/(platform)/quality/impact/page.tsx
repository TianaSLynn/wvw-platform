import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { TrendingUp, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Impact & ROI" };

export default async function ImpactPage() {
  const user = await requireUser();

  const [completedAudits, allFindings, closedFindings, invoiceTotal] = await Promise.all([
    db.audit.count({ where: { orgId: user.orgId, status: "COMPLETED" } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId } } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: "CLOSED" } }),
    db.invoice.aggregate({
      where: { orgId: user.orgId, status: { in: ["PAID", "PARTIAL"] } },
      _sum: { total: true },
    }),
  ]);

  const totalRevenue = invoiceTotal._sum.total ?? 0;
  // Estimated ROI: each finding prevented represents ~$15K in risk mitigation
  const estimatedRiskMitigated = closedFindings * 15000;
  const roiMultiple = totalRevenue > 0 ? (estimatedRiskMitigated / totalRevenue).toFixed(1) : "—";

  const IMPACT_METRICS = [
    { label: "Audits Completed", value: completedAudits, desc: "Engagements delivered", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Findings Identified", value: allFindings, desc: "Total risks surfaced", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Findings Remediated", value: closedFindings, desc: "Risks eliminated", icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Est. Risk Mitigated", value: formatCurrency(estimatedRiskMitigated), desc: "At $15K per finding", icon: DollarSign, color: "text-gold", bg: "bg-gold/10" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Impact & ROI"
        subtitle="Measure the business impact and return on investment of WVW engagements"
        icon={TrendingUp}
        iconBg="bg-green-500/10 border-green-500/20"
        iconColor="text-green-500"
        breadcrumbs={[{ label: "Quality", href: "/quality" }, { label: "Impact & ROI" }]}
      />

      {/* ROI Banner */}
      <div className="section-card p-6 bg-gradient-to-r from-navy-900/5 to-gold/5 border-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Estimated ROI Multiple</p>
            <p className="text-5xl font-bold gradient-text-gold">{roiMultiple}×</p>
            <p className="text-sm text-muted-foreground mt-2">Return on WVW investment (estimated)</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Investment</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-2">Est. Risk Mitigated</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(estimatedRiskMitigated)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {IMPACT_METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="section-card p-4">
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={m.color} />
              </div>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ROI Calculator */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <DollarSign size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">ROI Calculator</h2>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted-foreground mb-4">Adjust assumptions to model the estimated value of audit engagements</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Avg Cost per Finding ($)</label>
              <input className="input-base w-full" defaultValue="15000" type="number" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">% Findings Prevented</label>
              <input className="input-base w-full" defaultValue="80" type="number" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Regulatory Penalty Avoided ($)</label>
              <input className="input-base w-full" defaultValue="50000" type="number" />
            </div>
          </div>
          <button className="btn-gold mt-4">Recalculate ROI</button>
        </div>
      </div>
    </div>
  );
}
