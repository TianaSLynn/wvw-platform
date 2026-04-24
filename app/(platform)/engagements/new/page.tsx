import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import NewEngagementForm from "./NewEngagementForm";

export const metadata: Metadata = { title: "New Engagement" };

export default async function NewEngagementPage() {
  const user = await requireUser();

  const clients = await db.client.findMany({
    where: { orgId: user.orgId, isActive: true, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">New Engagement</h1>
        <p className="page-subtitle mt-0.5">Create a new project or engagement for a client</p>
      </div>
      <NewEngagementForm clients={clients} />
    </div>
  );
}
