import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SecurityClient from "./SecurityClient";

export const metadata: Metadata = { title: "Security & Compliance" };

export default async function SecurityPage() {
  const user = await requireUser();
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/settings");

  const recentActivity = await db.activityLog.findMany({
    where: { orgId: user.orgId },
    select: {
      id: true, action: true, entityLabel: true, timestamp: true,
      user: { select: { firstName: true, lastName: true } },
      entityType: true,
    },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-3xl mx-auto">
      <SecurityClient recentActivity={recentActivity} orgId={user.orgId} />
    </div>
  );
}
