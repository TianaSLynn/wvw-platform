import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, Receipt, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

export const metadata: Metadata = { title: "Invoices & Payments" };

const STATUS_VARIANT: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  DRAFT: "secondary", SENT: "default", VIEWED: "default",
  PARTIAL: "warning", PAID: "success", OVERDUE: "destructive",
  VOID: "secondary", CANCELLED: "secondary",
};

export default async function InvoicesPage() {
  const user = await requireUser();

  const invoices = await db.invoice.findMany({
    where: { orgId: user.orgId },
    include: {
      client:  { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  const totalPaid     = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoices.filter((i) => ["SENT","PARTIAL","OVERDUE"].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const overdueCount  = invoices.filter((i) => i.status === "OVERDUE").length;
  const draftCount    = invoices.filter((i) => i.status === "DRAFT").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Invoices & Payments"
        subtitle={`${invoices.length} total invoices`}
        actions={
          <Link href="/invoices/new" className="btn-primary">
            <Plus size={14} /> New Invoice
          </Link>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Total Collected" value={formatCurrency(totalPaid, "USD", true)} icon={DollarSign} iconColor="text-green-500" iconBg="bg-green-500/10 border-green-500/20" />
        <StatCard label="Outstanding"     value={formatCurrency(totalOutstanding, "USD", true)} icon={Clock} iconColor="text-amber-500" iconBg="bg-amber-500/10 border-amber-500/20" />
        <StatCard label="Overdue"         value={overdueCount} icon={AlertTriangle} iconColor={overdueCount > 0 ? "text-red-500" : "text-green-500"} iconBg={overdueCount > 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"} />
        <StatCard label="Drafts"          value={draftCount} icon={Receipt} iconColor="text-muted-foreground" iconBg="bg-muted border-border" />
      </div>

      {/* Invoice table */}
      <div className="section-card">
        {invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Receipt size={24} className="text-muted-foreground" />
            </div>
            <p className="font-semibold">No invoices yet</p>
            <Link href="/invoices/new" className="text-sm text-gold hover:underline mt-1 block">Create your first invoice</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {["Invoice #", "Client", "Project", "Issued", "Due", "Amount", "Status", ""].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-semibold text-foreground hover:text-gold">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{inv.client.name}</td>
                    <td className="text-muted-foreground text-xs">{inv.project?.name ?? "—"}</td>
                    <td className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(inv.issueDate)}</td>
                    <td className="text-xs whitespace-nowrap">
                      <span className={inv.status === "OVERDUE" ? "text-red-500 font-semibold" : "text-muted-foreground"}>
                        {formatDate(inv.dueDate)}
                      </span>
                    </td>
                    <td className="font-semibold tabular-lining">{formatCurrency(inv.total)}</td>
                    <td>
                      <Badge variant={STATUS_VARIANT[inv.status] ?? "secondary"} size="sm">
                        {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td>
                      <Link href={`/invoices/${inv.id}`} className="btn-ghost py-1 px-2 text-xs text-gold">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
