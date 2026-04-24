import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { BarChart3, Plus, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "QBR Reports" };

const QBR_TEMPLATES = [
  { name: "Standard QBR", sections: ["Executive Summary", "Audit Activity", "Finding Status", "Upcoming Work", "Financials"], desc: "Comprehensive quarterly review for active clients" },
  { name: "Executive Summary QBR", sections: ["Key Metrics", "Risk Highlights", "Recommendations", "Next Quarter"], desc: "Concise C-suite focused review" },
  { name: "Compliance Focus QBR", sections: ["Compliance Status", "Open Findings", "Remediation Progress", "Regulatory Updates"], desc: "For compliance-intensive clients" },
];

export default async function QBRPage() {
  const user = await requireUser();

  const clients = await db.client.findMany({
    where: { orgId: user.orgId, isActive: true, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 20,
  });

  const recentReports = await db.document.findMany({
    where: { orgId: user.orgId, category: "qbr" },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="QBR Reports"
        subtitle="Quarterly Business Reviews — structured client reporting and relationship management"
        icon={BarChart3}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
        breadcrumbs={[{ label: "Quality", href: "/quality" }, { label: "QBR Reports" }]}
        actions={
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Create QBR
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create QBR form */}
        <div className="section-card lg:col-span-1">
          <div className="section-card-header flex items-center gap-2">
            <Plus size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">New QBR</h2>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Client</label>
              <select className="input-base w-full">
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Quarter</label>
              <select className="input-base w-full">
                <option>Q1 2026</option>
                <option>Q4 2025</option>
                <option>Q3 2025</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Template</label>
              <select className="input-base w-full">
                {QBR_TEMPLATES.map(t => <option key={t.name}>{t.name}</option>)}
              </select>
            </div>
            <button className="btn-primary w-full text-sm">Generate QBR</button>
          </div>
        </div>

        {/* Templates + Recent */}
        <div className="lg:col-span-2 space-y-4">
          <div className="section-card">
            <div className="section-card-header flex items-center gap-2">
              <FileText size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">QBR Templates</h2>
            </div>
            <div className="divide-y divide-border">
              {QBR_TEMPLATES.map((tpl) => (
                <div key={tpl.name} className="flex items-start gap-3 px-4 py-3">
                  <FileText size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">{tpl.desc}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sections: {tpl.sections.join(" · ")}</p>
                  </div>
                  <button className="btn-ghost text-xs flex items-center gap-1 flex-shrink-0">
                    Use <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-card-header flex items-center gap-2">
              <BarChart3 size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Recent QBRs</h2>
            </div>
            {recentReports.length === 0 ? (
              <div className="p-8 text-center">
                <BarChart3 size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No QBR reports yet</p>
                <p className="text-xs text-muted-foreground">Create your first QBR report to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentReports.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.client?.name ?? "—"} · {`${doc.createdBy.firstName} ${doc.createdBy.lastName}`} · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                    {doc.fileUrl && <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs">View</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
