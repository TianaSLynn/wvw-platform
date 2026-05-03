import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import NewAuditForm from "./NewAuditForm";

export const metadata: Metadata = { title: "New Audit" };

export default async function NewAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template: preselectedTemplateId } = await searchParams;
  const user = await requireUser();

  const [clients, templates] = await Promise.all([
    db.client.findMany({
      where: { orgId: user.orgId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.auditTemplate.findMany({
      where: {
        OR: [
          { orgId: user.orgId, isPublished: true },
          { isGlobal: true, isPublished: true },
        ],
      },
      select: { id: true, name: true, type: true, description: true, isGlobal: true },
      orderBy: [{ isGlobal: "asc" }, { name: "asc" }],
    }),
  ]);

  if (clients.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="page-title">New Audit</h1>
          <p className="page-subtitle mt-0.5">Create from a template or build a custom audit from scratch</p>
        </div>
        <div className="section-card">
          <div className="empty-state py-16">
            <div className="empty-state-icon">
              <Users size={24} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Add a client first</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm text-center">
              Every audit must be linked to a client. Add your first client before creating an audit.
            </p>
            <Link href="/clients/new" className="btn-primary">
              <Plus size={14} /> Add Your First Client
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">New Audit</h1>
        <p className="page-subtitle mt-0.5">Create from a template or build a custom audit from scratch</p>
      </div>
      <NewAuditForm clients={clients} templates={templates} initialTemplateId={preselectedTemplateId} />
    </div>
  );
}
