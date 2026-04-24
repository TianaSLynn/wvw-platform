import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import TeamManagement from "./TeamManagement";

export const metadata: Metadata = { title: "Team Members" };

export default async function TeamPage() {
  const user = await requireUser();

  const members = await db.user.findMany({
    where: { orgId: user.orgId, deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true, email: true,
      role: true, title: true, avatarUrl: true, createdAt: true,
      _count: { select: { timeEntries: true, auditAssignments: true } },
    },
    orderBy: [{ role: "asc" }, { firstName: "asc" }],
  });

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

  return (
    <div className="max-w-4xl mx-auto">
      <TeamManagement members={members} currentUserId={user.id} isAdmin={isAdmin} />
    </div>
  );
}
