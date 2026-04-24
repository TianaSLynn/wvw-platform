import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import EditEmployeeForm from "./EditEmployeeForm";

export const metadata: Metadata = { title: "Edit Employee" };

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireUser();
  const { id } = await params;

  const isSelf = currentUser.id === id;
  const canEdit = isSelf || currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN";
  if (!canEdit) redirect("/people/staff");

  const member = await db.user.findFirst({
    where: { id, orgId: currentUser.orgId, deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      title: true, role: true, department: true, bio: true, avatarUrl: true,
      billableRate: true, targetUtilization: true, status: true,
    },
  });

  if (!member) notFound();

  const isAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN";

  return (
    <div className="max-w-2xl mx-auto">
      <EditEmployeeForm member={member} isAdmin={isAdmin} isSelf={isSelf} />
    </div>
  );
}
