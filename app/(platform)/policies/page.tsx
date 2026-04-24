import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Shield, Plus, ChevronRight, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Policies" };

const STARTER_CATEGORIES = [
  { name: "Data Privacy Policy", icon: "🔒", description: "GDPR, CCPA, and data handling procedures", controls: 24, status: "Draft" },
  { name: "Information Security Policy", icon: "🛡️", description: "Asset classification, access control, and incident response", controls: 42, status: "Draft" },
  { name: "HR & Employment Policy", icon: "👥", description: "Hiring, onboarding, performance, and termination procedures", controls: 18, status: "Draft" },
  { name: "Financial Controls Policy", icon: "💰", description: "Expense approval, procurement, and financial reporting", controls: 31, status: "Draft" },
  { name: "Operational Risk Policy", icon: "⚡", description: "Business continuity, disaster recovery, and operational procedures", controls: 27, status: "Draft" },
];

export default async function PoliciesPage() {
  const user = await requireUser();

  const [frameworks, controls] = await Promise.all([
    db.complianceFramework.findMany({
      where: { orgId: user.orgId },
      include: { _count: { select: { controls: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.complianceControl.findMany({
      where: { framework: { orgId: user.orgId } },
      select: { frameworkId: true },
    }),
  ]);

  // Group controls by framework
  const controlsByFramework: Record<string, { total: number; compliant: number; nonCompliant: number; notApplicable: number }> = {};
  for (const ctrl of controls) {
    if (!controlsByFramework[ctrl.frameworkId]) {
      controlsByFramework[ctrl.frameworkId] = { total: 0, compliant: 0, nonCompliant: 0, notApplicable: 0 };
    }
    controlsByFramework[ctrl.frameworkId]!.total++;
  }

  const hasFrameworks = frameworks.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Policies & Compliance"
        subtitle="Manage compliance frameworks, policies, and control libraries"
        icon={Shield}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
        actions={
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Create Policy
          </button>
        }
      />

      {hasFrameworks ? (
        <div className="space-y-4">
          {frameworks.map((fw) => {
            const stats = controlsByFramework[fw.id] ?? { total: 0, compliant: 0, nonCompliant: 0, notApplicable: 0 };
            const pct = stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0;
            return (
              <div key={fw.id} className="section-card">
                <div className="section-card-header flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield size={15} className="text-purple-500" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{fw.name}</h3>
                      {fw.description && <p className="text-xs text-muted-foreground">{fw.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{pct}% Compliant</span>
                    <button className="btn-ghost text-xs flex items-center gap-1">
                      View <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <span className="text-green-500 font-medium">{stats.compliant} Compliant</span>
                    <span className="text-red-500 font-medium">{stats.nonCompliant} Non-compliant</span>
                    <span className="text-muted-foreground">{stats.notApplicable} N/A</span>
                    <span className="text-muted-foreground">{stats.total} Total Controls</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="section-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={15} className="text-amber-500" />
              <p className="text-sm font-medium text-foreground">No compliance frameworks configured yet</p>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Get started by creating your first compliance framework or choose from the common policy categories below.</p>
            <button className="btn-gold text-sm flex items-center gap-2">
              <Plus size={15} />
              Create First Framework
            </button>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Common Policy Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {STARTER_CATEGORIES.map((cat) => (
                <div key={cat.name} className="section-card p-5 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText size={12} />
                      {cat.controls} controls
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">Draft</span>
                  </div>
                  <button className="btn-ghost w-full mt-3 text-xs flex items-center justify-center gap-1">
                    <Plus size={13} />
                    Create Policy
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Document Management */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <FileText size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Policy Documents</h2>
        </div>
        <div className="p-8 text-center">
          <CheckCircle2 size={28} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Upload policy documents here</p>
          <p className="text-xs text-muted-foreground mt-1">PDFs, Word docs, and other policy files will be version-controlled and linked to frameworks</p>
          <Link href="/assets" className="btn-ghost text-xs mt-4 inline-flex items-center gap-1">View Document Library →</Link>
        </div>
      </div>
    </div>
  );
}
