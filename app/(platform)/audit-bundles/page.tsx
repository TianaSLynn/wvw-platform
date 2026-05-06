import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Layers } from "lucide-react";
import AuditBundlesClient from "./AuditBundlesClient";

export const metadata: Metadata = { title: "Audit Bundles" };

export default async function AuditBundlesPage() {
  const user = await requireUser();

  const [bundles, templates] = await Promise.all([
    db.auditBundle.findMany({
      where: { orgId: user.orgId },
      include: {
        items: {
          include: { template: { select: { id: true, name: true, type: true, isActive: true } } },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { audits: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.auditTemplate.findMany({
      where: {
        OR: [
          { orgId: user.orgId },
          { isGlobal: true, isPublished: true },
        ],
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true, isGlobal: true },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Audit Bundles"
        subtitle="Group multiple audit templates into a named bundle to launch comprehensive assessments in one step"
        icon={Layers}
        iconBg="bg-sage/10 border-sage/20"
        iconColor="text-sage"
      />
      <AuditBundlesClient
        initialBundles={bundles}
        templates={templates}
        userRole={user.role}
      />
    </div>
  );
}
