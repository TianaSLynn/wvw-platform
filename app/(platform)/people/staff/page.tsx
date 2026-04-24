import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import StaffDirectory from "./StaffDirectory";

export const metadata: Metadata = { title: "Staff Directory" };

export default async function StaffPage() {
  const user = await requireUser();

  const members = await db.user.findMany({
    where: { orgId: user.orgId, deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      title: true, role: true, department: true, bio: true, avatarUrl: true,
      billableRate: true, targetUtilization: true, status: true, createdAt: true,
      skills: { select: { skill: true, proficiency: true, category: true, isVerified: true } },
      _count: { select: { auditAssignments: true, timeEntries: true } },
    },
    orderBy: [{ department: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="max-w-5xl mx-auto">
      <StaffDirectory members={members} currentUserId={user.id} currentUserRole={user.role} />
    </div>
  );
}
