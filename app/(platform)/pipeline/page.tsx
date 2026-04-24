import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import PipelineClient from "./PipelineClient";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Sales Pipeline" };

export default async function PipelinePage() {
  const user = await requireUser();

  const [clients, invoices, audits] = await Promise.all([
    db.client.findMany({
      where: { orgId: user.orgId, deletedAt: null },
      select: {
        id: true, name: true, industry: true, isActive: true,
        createdAt: true, onboardedAt: true, healthScore: true,
        contacts: { where: { isPrimary: true }, select: { firstName: true, lastName: true, email: true }, take: 1 },
        invoices: { select: { total: true, status: true } },
        audits:   { select: { id: true, status: true } },
        projects: { select: { id: true, status: true, budget: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.aggregate({
      where: { orgId: user.orgId, status: "PAID" },
      _sum: { total: true },
    }),
    db.audit.groupBy({
      by: ["status"],
      where: { orgId: user.orgId },
      _count: { id: true },
    }),
  ]);

  // Compute pipeline stages
  const prospects    = clients.filter((c) => !c.isActive && !c.onboardedAt);
  const active       = clients.filter((c) => c.isActive);
  const churned      = clients.filter((c) => !c.isActive && c.onboardedAt);

  const pipelineValue = active.reduce((sum, c) => {
    const openProjects = c.projects.filter((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED");
    return sum + openProjects.reduce((s, p) => s + (Number(p.budget ?? 0)), 0);
  }, 0);

  const totalRevenue = Number(invoices._sum.total ?? 0);

  const auditStatusMap = Object.fromEntries(audits.map((a) => [a.status, a._count?.id ?? 0]));

  return (
    <PipelineClient
      prospects={prospects}
      active={active}
      churned={churned}
      pipelineValue={pipelineValue}
      totalRevenue={totalRevenue}
      auditStatusMap={auditStatusMap}
    />
  );
}
