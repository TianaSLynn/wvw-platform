import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import NewFindingForm from "./NewFindingForm";

export const metadata: Metadata = { title: "New Finding" };

export default async function NewFindingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id: auditId } = await params;

  const audit = await db.audit.findFirst({
    where: { id: auditId, orgId: user.orgId },
    select: {
      id: true, name: true, code: true, type: true,
      client: { select: { name: true } },
      members: { select: { userId: true } },
    },
  });

  if (!audit) notFound();

  const orgUsers = await db.user.findMany({
    where: { orgId: user.orgId, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, title: true },
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <NewFindingForm audit={audit} orgUsers={orgUsers} />
    </div>
  );
}
