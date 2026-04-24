"use client";

import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, DollarSign, FileSearch, Building2, ChevronRight, Activity } from "lucide-react";

interface Client {
  id: string; name: string; industry: string | null; isActive: boolean;
  createdAt: Date; onboardedAt: Date | null; healthScore: number | null;
  contacts: Array<{ firstName: string; lastName: string; email: string | null }>;
  invoices: Array<{ total: number; status: string }>;
  audits:   Array<{ id: string; status: string }>;
  projects: Array<{ id: string; status: string; budget: number | null }>;
}

interface Props {
  prospects: Client[];
  active: Client[];
  churned: Client[];
  pipelineValue: number;
  totalRevenue: number;
  auditStatusMap: Record<string, number>;
}

const STAGE_CONFIG = [
  { key: "prospects", label: "Prospects",      color: "bg-blue-500",   light: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  { key: "active",    label: "Active Clients", color: "bg-green-500",  light: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
  { key: "churned",   label: "Churned",        color: "bg-gray-400",   light: "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700" },
];

function ClientCard({ client }: { client: Client }) {
  const totalBilled = client.invoices.reduce((s, i) => s + Number(i.total), 0);
  const activeAudits = client.audits.filter((a) => ["FIELDWORK","REVIEW","PLANNING"].includes(a.status)).length;
  const primaryContact = client.contacts[0];

  return (
    <Link
      href={`/clients/${client.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-gold/20 hover:bg-muted/20 transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-navy-900 border border-gold/20 flex items-center justify-center flex-shrink-0">
            <Building2 size={12} className="text-gold" />
          </div>
          <p className="font-medium text-sm truncate">{client.name}</p>
        </div>
        <ChevronRight size={13} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
      </div>

      {client.industry && <p className="text-xs text-muted-foreground mb-2">{client.industry}</p>}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {totalBilled > 0 && <span className="text-foreground font-medium">{formatCurrency(totalBilled)}</span>}
        {activeAudits > 0 && <span>{activeAudits} audit{activeAudits > 1 ? "s" : ""}</span>}
        {primaryContact && <span className="truncate">{primaryContact.firstName} {primaryContact.lastName}</span>}
      </div>

      {client.healthScore !== null && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", client.healthScore >= 70 ? "bg-green-500" : client.healthScore >= 40 ? "bg-amber-500" : "bg-red-500")}
              style={{ width: `${client.healthScore}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{client.healthScore}</span>
        </div>
      )}
    </Link>
  );
}

export default function PipelineClient({ prospects, active, churned, pipelineValue, totalRevenue, auditStatusMap }: Props) {
  const stages = { prospects, active, churned };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
          <TrendingUp size={18} className="text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground text-sm">Client lifecycle and revenue visibility</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Pipeline Value",  value: formatCurrency(pipelineValue),  icon: DollarSign,  iconColor: "text-gold",        iconBg: "bg-gold/10 border-gold/20" },
          { label: "Total Revenue",   value: formatCurrency(totalRevenue),   icon: TrendingUp,  iconColor: "text-green-500",   iconBg: "bg-green-500/10 border-green-500/20" },
          { label: "Active Clients",  value: active.length,                  icon: Users,       iconColor: "text-blue-500",    iconBg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Active Audits",   value: (auditStatusMap["FIELDWORK"] ?? 0) + (auditStatusMap["REVIEW"] ?? 0), icon: FileSearch, iconColor: "text-purple-500", iconBg: "bg-purple-500/10 border-purple-500/20" },
        ].map(({ label, value, icon: Icon, iconColor, iconBg }) => (
          <div key={label} className="stat-card group">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">{label}</p>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 transition-all group-hover:scale-105", iconBg)}>
                <Icon size={18} className={iconColor} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* Audit funnel */}
      <div className="section-card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
          <Activity size={14} className="text-gold" /> Audit Funnel
        </h2>
        <div className="flex items-end gap-3 h-24">
          {[
            { label: "Planning",   count: auditStatusMap["PLANNING"] ?? 0,   color: "bg-blue-400" },
            { label: "Fieldwork",  count: auditStatusMap["FIELDWORK"] ?? 0,  color: "bg-amber-400" },
            { label: "Review",     count: auditStatusMap["REVIEW"] ?? 0,     color: "bg-orange-400" },
            { label: "Reporting",  count: auditStatusMap["REPORTING"] ?? 0,  color: "bg-purple-400" },
            { label: "Completed",  count: auditStatusMap["COMPLETED"] ?? 0,  color: "bg-green-500" },
          ].map(({ label, count, color }) => {
            const max = Math.max(...[auditStatusMap["PLANNING"] ?? 0, auditStatusMap["FIELDWORK"] ?? 0, auditStatusMap["REVIEW"] ?? 0, auditStatusMap["REPORTING"] ?? 0, auditStatusMap["COMPLETED"] ?? 0], 1);
            const h = Math.max((count / max) * 100, count > 0 ? 10 : 0);
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-foreground">{count}</span>
                <div className="w-full flex items-end justify-center">
                  <div className={cn("w-full rounded-t-lg transition-all", color)} style={{ height: `${h}%`, minHeight: count > 0 ? 6 : 0 }} />
                </div>
                <span className="text-xs text-muted-foreground text-center">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban-style pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {STAGE_CONFIG.map(({ key, label, color, light }) => {
          const items = stages[key as keyof typeof stages];
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
                <h3 className="font-semibold text-sm">{label}</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className={cn("rounded-xl border px-4 py-6 text-center text-xs text-muted-foreground", light)}>
                    No {label.toLowerCase()}
                  </div>
                ) : (
                  items.map((c) => <ClientCard key={c.id} client={c} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
