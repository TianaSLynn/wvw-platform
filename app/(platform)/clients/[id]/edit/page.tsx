import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import EditClientForm from "./EditClientForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const client = await db.client.findUnique({ where: { id }, select: { name: true } });
  return { title: client ? `Edit ${client.name}` : "Edit Client" };
}

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const client = await db.client.findFirst({
    where: { id, orgId: user.orgId, deletedAt: null },
    select: {
      id: true, name: true, legalName: true, industry: true, size: true,
      website: true, description: true, billingEmail: true, taxId: true,
      paymentTerms: true, defaultRate: true, isActive: true,
      contacts: {
        where: { isPrimary: true, deletedAt: null },
        take: 1,
        select: { firstName: true, lastName: true, email: true, phone: true, title: true, department: true },
      },
    },
  });

  if (!client) notFound();

  return <EditClientForm client={{ ...client, primaryContact: client.contacts[0] ?? null }} />;
}
