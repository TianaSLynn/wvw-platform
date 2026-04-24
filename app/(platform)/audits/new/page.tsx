import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
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
