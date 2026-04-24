import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshCw, CheckCircle2, AlertCircle, Clock, Plus, Zap } from "lucide-react";
import Link from "next/link";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sync Status" };

const AVAILABLE_INTEGRATIONS = [
  { name: "QuickBooks", description: "Sync invoices, expenses, and financial data", icon: "💼", category: "Finance" },
  { name: "Salesforce", description: "Sync client and contact information", icon: "☁️", category: "CRM" },
  { name: "Slack", description: "Notifications, alerts, and team updates", icon: "💬", category: "Communication" },
  { name: "HubSpot", description: "CRM sync and pipeline management", icon: "🔶", category: "CRM" },
  { name: "Jira", description: "Task and issue tracking sync", icon: "🔵", category: "Project" },
  { name: "SharePoint", description: "Document management and file storage", icon: "📁", category: "Documents" },
];

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  ACTIVE: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", label: "Active" },
  INACTIVE: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: "Inactive" },
  ERROR: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Error" },
  PENDING: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Pending" },
};

export default async function SyncPage() {
  const user = await requireUser();

  const integrations = await db.integration.findMany({
    where: { orgId: user.orgId },
    orderBy: { updatedAt: "desc" },
  });

  const activeCount = integrations.filter(i => i.status === "ACTIVE").length;
  const errorCount = integrations.filter(i => i.status === "ERROR").length;
  const pendingCount = integrations.filter(i => i.status === "PENDING_AUTH").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sync Status"
        subtitle="Monitor and manage data synchronization across all connected integrations"
        icon={RefreshCw}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
        actions={
          <Link href="/settings/integrations" className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add Integration
          </Link>
        }
      />

      {integrations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="section-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active Syncs</p>
            </div>
          </div>
          <div className="section-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{errorCount}</p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </div>
          <div className="section-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      )}

      {integrations.length === 0 ? (
        <>
          <div className="section-card p-6 text-center">
            <RefreshCw size={28} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No integrations connected</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Connect your tools to sync data automatically</p>
            <Link href="/settings/integrations" className="btn-primary text-sm">Set Up Integrations</Link>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Available Integrations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {AVAILABLE_INTEGRATIONS.map((intg) => (
                <div key={intg.name} className="section-card p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{intg.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{intg.name}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{intg.category}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{intg.description}</p>
                  <Link href="/settings/integrations" className="btn-ghost w-full text-xs flex items-center justify-center gap-1">
                    <Zap size={12} />
                    Connect
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <RefreshCw size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Connected Integrations</h2>
          </div>
          <div className="divide-y divide-border">
            {integrations.map((intg) => {
              const cfg = (STATUS_CONFIG[intg.status] ?? STATUS_CONFIG.INACTIVE)!;
              const StatusIcon = cfg.icon;
              return (
                <div key={intg.id} className="flex items-center gap-4 px-4 py-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
                    <StatusIcon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{intg.name}</p>
                    <p className="text-xs text-muted-foreground">{intg.slug} · Last synced {formatDate(intg.updatedAt)}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", cfg.bg, cfg.color)}>
                    {cfg.label}
                  </span>
                  <Link href="/settings/integrations" className="btn-ghost text-xs">Configure</Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
