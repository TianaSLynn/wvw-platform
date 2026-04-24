"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LineItem { description: string; quantity: number; unitPrice: number; taxable: boolean }

interface Props {
  clients: Array<{ id: string; name: string; defaultRate: number | null; paymentTerms: number }>;
  projects: Array<{ id: string; name: string; clientId: string }>;
}

const today = new Date().toISOString().split("T")[0]!;
const in30  = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]!;

export default function NewInvoiceForm({ clients, projects }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId]   = useState("");
  const [projectId, setProjectId] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate]     = useState(in30);
  const [taxRate, setTaxRate]     = useState(0);
  const [discount, setDiscount]   = useState(0);
  const [notes, setNotes]         = useState("");
  const [terms, setTerms]         = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, taxable: true },
  ]);

  const clientProjects = projects.filter((p) => p.clientId === clientId);
  const selectedClient = clients.find((c) => c.id === clientId);

  const addLine = () => setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, taxable: true }]);
  const removeLine = (i: number) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof LineItem, value: string | number | boolean) =>
    setLineItems((prev) => prev.map((item, idx) => idx !== i ? item : { ...item, [field]: value }));

  const subtotal   = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmount  = lineItems.filter((i) => i.taxable).reduce((s, i) => s + i.quantity * i.unitPrice, 0) * (taxRate / 100);
  const total      = subtotal + taxAmount - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { setError("Please select a client"); return; }
    if (lineItems.some((i) => !i.description || i.quantity <= 0)) {
      setError("All line items need a description and valid quantity");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          projectId: projectId || undefined,
          issueDate,
          dueDate,
          taxRate: taxRate / 100,
          discountAmount: discount,
          notes: notes || undefined,
          terms: terms || undefined,
          lineItems,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create invoice");
      }
      const { data: inv } = await res.json();
      router.push(`/invoices/${inv.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20">{error}</div>
      )}

      {/* Client & project */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Billing Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Client *</label>
            <select value={clientId} onChange={(e) => { setClientId(e.target.value); setProjectId(""); }}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Project (optional)</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
              disabled={!clientId || clientProjects.length === 0}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
            >
              <option value="">None</option>
              {clientProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Issue Date *</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Due Date *</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Line Items</h2>
        <div className="space-y-2">
          {lineItems.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-6">
                <input
                  value={item.description}
                  onChange={(e) => updateLine(i, "description", e.target.value)}
                  placeholder="Description…"
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number" min="0.01" step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateLine(i, "quantity", parseFloat(e.target.value) || 0)}
                  className="w-full h-9 px-2 text-sm text-center bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div className="col-span-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateLine(i, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="w-full h-9 pl-6 pr-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
              </div>
              <div className="col-span-1 flex items-center justify-center h-9">
                <span className="text-xs text-right text-foreground font-medium">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-center h-9">
                {lineItems.length > 1 && (
                  <button type="button" onClick={() => removeLine(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLine}
          className="flex items-center gap-1.5 text-xs text-gold hover:underline"
        >
          <Plus size={12} /> Add line item
        </button>

        {/* Totals */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Tax</span>
              <input
                type="number" min="0" max="100" step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-16 h-7 px-2 text-xs text-center bg-background border border-border rounded focus:outline-none"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <span className="text-sm font-medium">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Discount</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number" min="0" step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 h-7 pl-5 pr-2 text-xs bg-background border border-border rounded focus:outline-none"
                />
              </div>
            </div>
            <span className="text-sm font-medium text-green-500">−{formatCurrency(discount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t border-border pt-2">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Notes to Client</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={3} placeholder="Thank you for your business…"
            className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Payment Terms</label>
          <textarea value={terms} onChange={(e) => setTerms(e.target.value)}
            rows={3} placeholder="Payment due within 30 days. Late fees apply…"
            className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-4 h-9 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 px-6 h-9 rounded-lg text-sm font-semibold bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : <Receipt size={14} />}
          Create Invoice
        </button>
      </div>
    </form>
  );
}
