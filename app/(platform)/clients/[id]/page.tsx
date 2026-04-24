import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, statusColor } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import ClientDetail from "./ClientDetail";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const client = await db.client.findUnique({ where: { id }, select: { name: true } });
  return { title: client?.name ?? "Client" };
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const client = await db.client.findFirst({
    where: { id, orgId: user.orgId, deletedAt: null },
    include: {
      contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { firstName: "asc" }] },
      projects: {
        where: { deletedAt: null },
        include: {
          members: { take: 3, include: { user: { select: { firstName: true, lastName: true } } } },
          _count: { select: { tasks: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      audits: {
        include: { _count: { select: { findings: true } } },
        orderBy: { updatedAt: "desc" },
      },
      invoices: {
        orderBy: { issueDate: "desc" },
        take: 20,
      },
      _count: { select: { projects: true, audits: true, contacts: true, invoices: true } },
    },
  });

  if (!client) notFound();

  const totalBilled = client.invoices
    .filter((i) => ["PAID","PARTIAL","SENT"].includes(i.status))
    .reduce((s, i) => s + i.total, 0);

  const openBalance = client.invoices
    .filter((i) => ["SENT","PARTIAL","OVERDUE"].includes(i.status))
    .reduce((s, i) => s + i.total, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ClientDetail
        client={client}
        totalBilled={totalBilled}
        openBalance={openBalance}
        currentUserId={user.id}
      />
    </div>
  );
}
