import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import NewContactForm from "./NewContactForm";

export default async function NewClientContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const client = await db.client.findFirst({
    where: { id, orgId: user.orgId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!client) notFound();
  return <NewContactForm client={client} />;
}
