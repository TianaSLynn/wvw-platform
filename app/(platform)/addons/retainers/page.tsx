import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshCw, TrendingUp, DollarSign, Building2, ChevronRight, Zap } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Retainer & Expansion" };

const EXPANSION_SIGNALS = [
  { signal: "Multiple audit cycles completed", weight: "High" },
  { signal: "All findings remediated on time",  weight: "High" },
  { signal: "Executive relationship established",weight: "High" },
  { signal: "New regulation affecting client",   weight: "Medium" },
  { signal: "Business expansion (new entity)",   weight: "Medium" },
  { signal: "NPS score > 8",                     weight: "Medium" },
];

export default async function RetainersPage() {
  const user = await requireUser();

  const activeClients = await db.client.findMany({
    where: { orgId: user.orgId, isActive: true, deletedAt: null },
    select: {
      id: true, name: true, industry: true, healthScore: true,
      invoices: { select: { total: true, status: true } },
      audits:   { select: { status: true } },
    },
    orderBy: { healthScore: "desc" },
    take: 8,
  });

  const retainerClients = activeClients.map((c) => ({
    ...c,
    totalRevenue: c.invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.total), 0),
    auditCount:   c.audits.length,
    expansionScore: Math.min(100, (c.healthScore ?? 60) + c.audits.length * 5),
    retainerValue: Math.floor((c.healthScore ?? 60) * 500 + 10000),
  }));

  const totalRetainerValue = retainerClients.reduce((s, c) => s + c.retainerValue, 0);
  const highExpansion = retainerClients.filter((c) => c.expansionScore >= 80).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Retainer & Expansion"
        subtitle="Manage retainer contracts and identify expansion opportunities"
        icon={RefreshCw}
        iconBg="bg-green-500/10 border-green-500/20"
        iconColor="text-green-500"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Retainer Pipeline",  value: formatCurrency(totalRetainerValue), icon: DollarSign,  color: "text-gold" },
          { label: "Active Clients",     value: activeClients.length,               icon: Building2,   color: "text-blue-500" },
          { label: "Expansion Ready",    value: highExpansion,                      icon: TrendingUp,  color: "text-green-500" },
          { label: "Avg Expansion Score",value: retainerClients.length > 0 ? `${Math.round(retainerClients.reduce((s, c) => s + c.expansionScore, 0) / retainerClients.length)}%` : "—", icon: Zap, color: "text-purple-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
              <Icon size={16} className={cn("flex-shrink-0", color)} />
            </div>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Expansion signals */}
      <div className="section-card">
        <div className="section-card-header">
          <h2 className="font-semibold text-sm">Expansion Signals</h2>
          <span className="ml-auto text-xs text-muted-foreground">Factors driving retainer potential</span>
        </div>
        <div className="divide-y divide-border">
          {EXPANSION_SIGNALS.map((s) => (
            <div key={s.signal} className="flex items-center gap-3 px-4 py-2.5">
              <Zap size={12} className="text-gold flex-shrink-0" />
              <p className="text-sm flex-1">{s.signal}</p>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", s.weight === "High" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500")}>
                {s.weight}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Client expansion opportunities */}
      {retainerClients.length > 0 && (
        <div className="section-card">
          <div className="section-card-header flex items-center justify-between">
            <h2 className="font-semibold text-sm">Client Expansion Opportunities</h2>
          </div>
          <div className="divide-y divide-border">
            {retainerClients.sort((a, b) => b.expansionScore - a.expansionScore).map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-navy-900 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <Building2 size={12} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.auditCount} audits · {formatCurrency(c.totalRevenue)} revenue</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div>
                    <div className="text-right text-xs font-bold text-foreground mb-1">{c.expansionScore}%</div>
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", c.expansionScore >= 80 ? "bg-green-500" : c.expansionScore >= 60 ? "bg-amber-500" : "bg-muted-foreground")} style={{ width: `${c.expansionScore}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={13} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
