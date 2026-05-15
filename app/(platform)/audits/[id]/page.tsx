import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AuditDetailClient from "./AuditDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const audit = await db.audit.findUnique({ where: { id }, select: { name: true } });
  return { title: audit?.name ?? "Audit" };
}

export default async function AuditDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: initialTab } = await searchParams;
  const user = await requireUser();

  const audit = await db.audit.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      client:  { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, title: true } } },
      },
      sections: {
        include: {
          checklistItems: {
            orderBy: { sortOrder: "asc" },
            include: { evidence: { select: { id: true, title: true, type: true } } },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      findings: {
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          remediationActions: true,
          _count: { select: { evidence: true } },
        },
        orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      },
      evidence: {
        include: { uploadedBy: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
      frameworks: { include: { framework: { select: { name: true, type: true } } } },
      _count: { select: { findings: true, evidence: true } },
    },
  });

  if (!audit) notFound();

  // Compute overall completion
  const allItems = audit.sections.flatMap((s) => s.checklistItems);
  const completedItems = allItems.filter((i) => i.isCompleted).length;
  const overallPct = allItems.length > 0 ? Math.round((completedItems / allItems.length) * 100) : 0;

  // Count by severity
  const findingsBySeverity = {
    CRITICAL:      audit.findings.filter((f) => f.severity === "CRITICAL").length,
    HIGH:          audit.findings.filter((f) => f.severity === "HIGH").length,
    MEDIUM:        audit.findings.filter((f) => f.severity === "MEDIUM").length,
    LOW:           audit.findings.filter((f) => f.severity === "LOW").length,
    INFORMATIONAL: audit.findings.filter((f) => f.severity === "INFORMATIONAL").length,
  };

  const validTabs = ["checklist", "findings", "evidence", "tracker", "team", "overview", "survey", "results"] as const;
  type Tab = typeof validTabs[number];
  const tab = validTabs.includes(initialTab as Tab) ? (initialTab as Tab) : undefined;

  return (
    <AuditDetailClient
      audit={audit as never}
      overallPct={overallPct}
      totalItems={allItems.length}
      completedItems={completedItems}
      findingsBySeverity={findingsBySeverity}
      currentUserId={user.id}
      initialTab={tab}
    />
  );
}
