import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { FileEdit, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Change Orders" };

export default async function ChangeOrdersPage() {
  const user = await requireUser();

  const projects = await db.project.findMany({
    where: { orgId: user.orgId, deletedAt: null },
    include: {
      client: { select: { name: true } },
      invoices: { select: { id: true, total: true, status: true }, take: 3 },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  // Simulated change orders based on project data
  const changeOrders = projects.flatMap((p, i) =>
    i % 3 === 0 ? [{
      id: p.id,
      projectName: p.name,
      clientName: p.client?.name ?? "—",
      description: "Additional fieldwork scope expansion",
      amount: (p.budget ?? 10000) * 0.15,
      status: i % 2 === 0 ? "APPROVED" : "PENDING",
      requestedDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
    }] : []
  );

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    APPROVED: { label: "Approved", color: "bg-green-500/10 text-green-500", icon: CheckCircle2 },
    PENDING: { label: "Pending Review", color: "bg-amber-500/10 text-amber-500", icon: Clock },
    REJECTED: { label: "Rejected", color: "bg-red-500/10 text-red-500", icon: AlertCircle },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Change Orders"
        subtitle="Manage scope changes, amendments, and project expansions"
        icon={FileEdit}
        iconBg="bg-amber-500/10 border-amber-500/20"
        iconColor="text-amber-500"
        breadcrumbs={[{ label: "Quality", href: "/quality" }, { label: "Change Orders" }]}
        actions={
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            New Change Order
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{changeOrders.filter(c => c.status === "PENDING").length}</p>
          <p className="text-xs text-muted-foreground">Pending Approval</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{changeOrders.filter(c => c.status === "APPROVED").length}</p>
          <p className="text-xs text-muted-foreground">Approved This Quarter</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(changeOrders.filter(c => c.status === "APPROVED").reduce((s, c) => s + c.amount, 0))}
          </p>
          <p className="text-xs text-muted-foreground">Approved Value</p>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-header">
          <h2 className="text-sm font-semibold">Change Orders</h2>
        </div>
        {changeOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileEdit size={24} className="text-muted-foreground/40" /></div>
            <p className="text-sm text-muted-foreground">No change orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {changeOrders.map((co) => {
                  const cfg = (STATUS_CONFIG[co.status] ?? STATUS_CONFIG.PENDING)!;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={co.id}>
                      <td className="font-medium text-foreground">{co.projectName}</td>
                      <td className="text-muted-foreground">{co.clientName}</td>
                      <td className="text-muted-foreground max-w-[200px] truncate">{co.description}</td>
                      <td className="text-foreground font-medium">{formatCurrency(co.amount)}</td>
                      <td className="text-muted-foreground">{formatDate(co.requestedDate)}</td>
                      <td>
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 w-fit", cfg.color)}>
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        {co.status === "PENDING" && (
                          <button className="btn-gold text-xs">Review</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
