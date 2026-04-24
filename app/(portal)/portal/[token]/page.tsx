import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPortalToken } from "@/lib/portal-token";
import { cn, formatCurrency } from "@/lib/utils";
import { Shield, FileSearch, FileText, CheckCircle, AlertTriangle, Clock, Building2 } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-600 bg-red-50 border-red-200",
  HIGH:     "text-orange-600 bg-orange-50 border-orange-200",
  MEDIUM:   "text-amber-600 bg-amber-50 border-amber-200",
  LOW:      "text-blue-600 bg-blue-50 border-blue-200",
  INFORMATIONAL: "text-gray-500 bg-gray-50 border-gray-200",
};

const AUDIT_STATUS_LABEL: Record<string, string> = {
  FIELDWORK: "In Fieldwork",
  REVIEW: "Under Review",
  REPORTING: "Reporting",
  COMPLETED: "Completed",
};

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  SENT:    { label: "Awaiting Payment", color: "text-blue-600 bg-blue-50 border-blue-200" },
  OVERDUE: { label: "Overdue",          color: "text-red-600 bg-red-50 border-red-200" },
  PAID:    { label: "Paid",             color: "text-green-600 bg-green-50 border-green-200" },
};

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const clientId = verifyPortalToken(token);
  if (!clientId) notFound();

  const client = await db.client.findFirst({
    where: { id: clientId!, isActive: true, deletedAt: null },
    select: {
      id: true, name: true, logoUrl: true, industry: true,
      org: { select: { name: true, logoUrl: true } },
      audits: {
        where: { status: { in: ["FIELDWORK", "REVIEW", "REPORTING", "COMPLETED"] } },
        select: {
          id: true, name: true, code: true, type: true, status: true,
          overallRiskScore: true, fieldworkStartDate: true, fieldworkEndDate: true,
          _count: { select: { findings: true, evidence: true } },
          findings: {
            where: { status: { notIn: ["CLOSED"] } },
            select: { severity: true, status: true, title: true, findingNumber: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
      invoices: {
        where: { status: { in: ["SENT", "OVERDUE", "PAID"] } },
        select: {
          id: true, invoiceNumber: true, status: true, total: true,
          dueDate: true, paidDate: true, issueDate: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!client) notFound();

  const openInvoices  = client.invoices.filter((i) => i.status !== "PAID");
  const overdueCount  = client.invoices.filter((i) => i.status === "OVERDUE").length;
  const totalOwed     = openInvoices.reduce((s, i) => s + Number(i.total), 0);
  const openFindings  = client.audits.flatMap((a) => a.findings).filter((f) => ["OPEN", "IN_PROGRESS"].includes(f.status));
  const criticalCount = openFindings.filter((f) => f.severity === "CRITICAL").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center">
            <Building2 size={22} className="text-gold" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{client.org.name} · Client Portal</p>
            <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs font-medium text-green-700">
          <Shield size={12} /> Secure Portal
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Audits", value: client.audits.length, color: "text-blue-600", icon: FileSearch },
          { label: "Open Findings", value: openFindings.length, color: openFindings.length > 0 ? "text-amber-600" : "text-green-600", icon: AlertTriangle },
          { label: "Critical Issues", value: criticalCount, color: criticalCount > 0 ? "text-red-600" : "text-green-600", icon: Shield },
          { label: "Balance Due", value: formatCurrency(totalOwed), color: totalOwed > 0 ? (overdueCount > 0 ? "text-red-600" : "text-amber-600") : "text-green-600", icon: FileText },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
            <Icon size={18} className={cn("mx-auto mb-2", color)} />
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Audits */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileSearch size={16} className="text-navy-700" /> Your Audits
        </h2>
        {client.audits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No active audits at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {client.audits.map((audit) => {
              const open      = audit.findings.filter((f) => f.status === "OPEN").length;
              const remediated = audit.findings.filter((f) => f.status === "REMEDIATED").length;
              const critical  = audit.findings.filter((f) => f.severity === "CRITICAL" && f.status !== "REMEDIATED").length;
              return (
                <div key={audit.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {AUDIT_STATUS_LABEL[audit.status] ?? audit.status}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{audit.code}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{audit.name}</h3>
                      <p className="text-xs text-gray-500">{audit.type}</p>
                    </div>
                    {audit.overallRiskScore !== null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Risk Score</p>
                        <p className={cn("text-lg font-bold", audit.overallRiskScore >= 70 ? "text-red-600" : audit.overallRiskScore >= 40 ? "text-amber-600" : "text-green-600")}>
                          {audit.overallRiskScore}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Finding summary */}
                  {audit.findings.length > 0 && (
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Findings Summary</p>
                      <div className="flex flex-wrap gap-2">
                        {open > 0 && (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                            <AlertTriangle size={11} /> {open} open
                          </span>
                        )}
                        {critical > 0 && (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700">
                            {critical} critical
                          </span>
                        )}
                        {remediated > 0 && (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 border border-green-200 text-green-700">
                            <CheckCircle size={11} /> {remediated} remediated
                          </span>
                        )}
                      </div>

                      {/* Show critical findings titles */}
                      {audit.findings.filter((f) => f.severity === "CRITICAL" && f.status !== "REMEDIATED").map((f) => (
                        <div key={f.findingNumber} className={cn("mt-2 px-3 py-2 rounded-lg border text-xs", SEVERITY_COLORS.CRITICAL)}>
                          <span className="font-mono mr-1.5">F-{String(f.findingNumber).padStart(3, "0")}</span>
                          {f.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dates */}
                  {(audit.fieldworkStartDate || audit.fieldworkEndDate) && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <Clock size={12} />
                      {audit.fieldworkStartDate && <span>Started {new Date(audit.fieldworkStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                      {audit.fieldworkEndDate && <span>· Ends {new Date(audit.fieldworkEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoices */}
      {client.invoices.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-navy-700" /> Invoices
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Invoice", "Amount", "Status", "Due Date"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {client.invoices.map((inv) => {
                  const statusInfo = INVOICE_STATUS[inv.status] ?? { label: inv.status, color: "text-gray-500 bg-gray-50 border-gray-200" };
                  return (
                    <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{formatCurrency(Number(inv.total))}</td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {inv.paidDate
                          ? `Paid ${new Date(inv.paidDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : inv.dueDate
                          ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        This portal is private and secure. Shared by {client.org.name} via WVW Intelligence.
        <br />
        Questions? Contact your account manager directly.
      </div>
    </div>
  );
}
