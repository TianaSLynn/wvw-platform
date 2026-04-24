import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AICommandClient from "./AICommandClient";

export const metadata: Metadata = { title: "AI Command Center" };

export default async function AICommandPage() {
  const user = await requireUser();

  const [recentAudits, openFindings, clients] = await Promise.all([
    db.audit.findMany({
      where: { orgId: user.orgId, status: { in: ["FIELDWORK","REVIEW","PLANNING"] } },
      select: { id: true, name: true, status: true, type: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.auditFinding.count({
      where: { audit: { orgId: user.orgId }, status: { in: ["OPEN","IN_PROGRESS"] } },
    }),
    db.client.count({ where: { orgId: user.orgId, isActive: true } }),
  ]);

  return (
    <AICommandClient
      userName={user.firstName}
      orgName={user.org?.name ?? "WVW"}
      recentAudits={recentAudits}
      openFindings={openFindings}
      clientCount={clients}
    />
  );
}
