import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";
import InvoiceActions from "./InvoiceActions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const inv = await db.invoice.findUnique({ where: { id }, select: { invoiceNumber: true } });
  return { title: inv?.invoiceNumber ?? "Invoice" };
}

const STATUS_VARIANT: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  DRAFT: "secondary", SENT: "default", VIEWED: "default",
  PARTIAL: "warning", PAID: "success", OVERDUE: "destructive",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const invoice = await db.invoice.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      client:    { select: { id: true, name: true, billingAddress: true, billingEmail: true, taxId: true } },
      project:   { select: { id: true, name: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
      payments:  { orderBy: { date: "asc" } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });

  if (!invoice) notFound();

  const amountPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance    = invoice.total - amountPaid;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`${invoice.client.name}${invoice.project ? ` · ${invoice.project.name}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[invoice.status] ?? "secondary"}>{invoice.status}</Badge>
            <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
          </div>
        }
      />

      {/* Invoice document */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {/* Invoice header */}
        <div className="bg-navy-900 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">INVOICE</h2>
              <p className="text-white/50 text-sm font-mono mt-1">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-xs uppercase tracking-wide">Total Due</p>
              <p className="text-3xl font-bold text-gold">{formatCurrency(invoice.total, invoice.currency)}</p>
              {balance !== invoice.total && (
                <p className="text-white/60 text-sm mt-1">Balance: {formatCurrency(balance, invoice.currency)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Billing info */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Bill To</p>
              <p className="font-semibold">{invoice.client.name}</p>
              {invoice.client.billingEmail && (
                <p className="text-sm text-muted-foreground">{invoice.client.billingEmail}</p>
              )}
              {invoice.client.taxId && (
                <p className="text-sm text-muted-foreground">Tax ID: {invoice.client.taxId}</p>
              )}
            </div>
            <div className="text-right">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">Issue Date</span>
                  <span className="font-medium">{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className={invoice.status === "OVERDUE" ? "font-semibold text-red-500" : "font-medium"}>
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
                {invoice.paidDate && (
                  <div className="flex justify-end gap-8">
                    <span className="text-muted-foreground">Paid Date</span>
                    <span className="font-medium text-green-500">{formatDate(invoice.paidDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Unit Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-border bg-muted/20 px-4 py-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({(invoice.taxRate * 100).toFixed(1)}%)</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-500">−{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              {amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Paid</span>
                    <span>−{formatCurrency(amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-amber-500">
                    <span>Balance Due</span>
                    <span>{formatCurrency(balance)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment history */}
          {invoice.payments.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Payment History</p>
              <div className="space-y-2">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm bg-green-500/5 border border-green-500/20 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-green-500 font-semibold">{formatCurrency(p.amount)}</span>
                      <span className="text-muted-foreground">{p.method.replace("_", " ")}</span>
                      {p.reference && <span className="font-mono text-xs text-muted-foreground">{p.reference}</span>}
                    </div>
                    <span className="text-muted-foreground">{formatDate(p.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Terms</p>
              <p className="text-xs text-muted-foreground">{invoice.terms}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
