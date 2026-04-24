import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Target, Phone, FileText, DollarSign, Clock, CheckCircle, ChevronRight, Plus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Lead & Discovery" };

const PIPELINE_STAGES = [
  { key: "new",       label: "New Lead",       color: "bg-slate-400",  dot: "bg-slate-400" },
  { key: "qualified", label: "Qualified",       color: "bg-blue-500",   dot: "bg-blue-500" },
  { key: "discovery", label: "Discovery Call",  color: "bg-purple-500", dot: "bg-purple-500" },
  { key: "proposal",  label: "Proposal Sent",   color: "bg-amber-500",  dot: "bg-amber-500" },
  { key: "won",       label: "Won",             color: "bg-green-500",  dot: "bg-green-500" },
];

const SAMPLE_LEADS = [
  { name: "Cornerstone Capital",   stage: "proposal",  value: 45000, contact: "David R.",    lastActivity: "Apr 12", industry: "Finance" },
  { name: "BlueStar Logistics",    stage: "discovery", value: 28000, contact: "Maria T.",    lastActivity: "Apr 11", industry: "Logistics" },
  { name: "Vertex Healthcare",     stage: "qualified", value: 62000, contact: "James W.",    lastActivity: "Apr 10", industry: "Healthcare" },
  { name: "Orion Manufacturing",   stage: "new",       value: 18000, contact: "Lisa C.",     lastActivity: "Apr 9",  industry: "Manufacturing" },
  { name: "Pacific Realty Group",  stage: "proposal",  value: 34000, contact: "Tom H.",      lastActivity: "Apr 8",  industry: "Real Estate" },
  { name: "Summit Energy Partners",stage: "won",       value: 51000, contact: "Sarah K.",    lastActivity: "Apr 5",  industry: "Energy" },
];

export default async function LeadPipelinePage() {
  const user = await requireUser();

  const prospects = await db.client.count({ where: { orgId: user.orgId, isActive: false } });

  const totalValue = SAMPLE_LEADS.reduce((s, l) => s + l.value, 0);
  const wonValue   = SAMPLE_LEADS.filter((l) => l.stage === "won").reduce((s, l) => s + l.value, 0);

  const stageCounts = PIPELINE_STAGES.reduce<Record<string, typeof SAMPLE_LEADS>>((acc, s) => {
    acc[s.key] = SAMPLE_LEADS.filter((l) => l.stage === s.key);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Lead & Discovery"
        subtitle="Lead management, discovery calls, and proposal tracking"
        icon={Target}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
        actions={
          <Link href="/clients" className="btn-primary">
            <Plus size={14} /> Add Lead
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pipeline Value",  value: formatCurrency(totalValue), icon: DollarSign, color: "text-gold" },
          { label: "Total Leads",     value: SAMPLE_LEADS.length,        icon: Target,     color: "text-blue-500" },
          { label: "Won This Month",  value: formatCurrency(wonValue),   icon: CheckCircle,color: "text-green-500" },
          { label: "Avg Deal Size",   value: formatCurrency(totalValue / SAMPLE_LEADS.length), icon: FileText, color: "text-purple-500" },
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

      {/* Stage funnel */}
      <div className="section-card p-5">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Target size={14} className="text-gold" /> Pipeline Funnel
        </h2>
        <div className="flex items-end gap-3 h-20">
          {PIPELINE_STAGES.map((s) => {
            const count = stageCounts[s.key]?.length ?? 0;
            const max = Math.max(...PIPELINE_STAGES.map((st) => stageCounts[st.key]?.length ?? 0), 1);
            const h = Math.max((count / max) * 100, count > 0 ? 12 : 0);
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-foreground">{count}</span>
                <div className="w-full flex items-end justify-center">
                  <div className={cn("w-full rounded-t-lg transition-all", s.color)} style={{ height: `${h}%`, minHeight: count > 0 ? 6 : 0 }} />
                </div>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leads table */}
      <div className="section-card">
        <div className="section-card-header">
          <h2 className="font-semibold text-sm">Active Leads</h2>
        </div>
        <div className="divide-y divide-border">
          {SAMPLE_LEADS.map((lead) => {
            const stage = PIPELINE_STAGES.find((s) => s.key === lead.stage);
            return (
              <div key={lead.name} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group cursor-pointer">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", stage?.dot ?? "bg-muted")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.industry} · {lead.contact}</p>
                </div>
                <span className="text-xs font-medium text-foreground">{formatCurrency(lead.value)}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">{lead.lastActivity}</span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", stage?.key === "won" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground")}>
                  {stage?.label}
                </span>
                <ChevronRight size={13} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
