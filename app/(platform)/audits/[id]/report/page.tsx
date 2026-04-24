import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import AuditReportClient from "./AuditReportClient";

export const metadata: Metadata = { title: "Audit Report" };

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id: auditId } = await params;

  const audit = await db.audit.findFirst({
    where: { id: auditId, orgId: user.orgId },
    select: {
      id: true, name: true, code: true, type: true, status: true,
      scope: true, overallRiskScore: true,
      client: { select: { name: true, industry: true } },
      members: {
        include: { user: { select: { firstName: true, lastName: true, title: true } } },
      },
      frameworks: { include: { framework: { select: { name: true } } } },
      findings: {
        select: { id: true, findingNumber: true, title: true, severity: true, status: true, riskScore: true },
        orderBy: [{ severity: "asc" }, { findingNumber: "asc" }],
      },
    },
  });

  if (!audit) notFound();

  return <AuditReportClient audit={audit} />;
}
