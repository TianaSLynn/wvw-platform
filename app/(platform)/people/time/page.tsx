import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import TimeTrackingClient from "./TimeTrackingClient";

export const metadata: Metadata = { title: "Time Tracking" };

export default async function TimeTrackingPage() {
  const user = await requireUser();
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PARTNER", "MANAGER"].includes(user.role);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [entries, projects, members] = await Promise.all([
    db.timeEntry.findMany({
      where: {
        orgId: user.orgId,
        createdAt: { gte: startOfMonth },
        ...(isAdmin ? {} : { userId: user.id }),
      },
      include: {
        user:    { select: { firstName: true, lastName: true } },
        project: { select: { id: true, name: true, client: { select: { name: true } } } },
        task:    { select: { title: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    db.project.findMany({
      where: { orgId: user.orgId, deletedAt: null },
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    isAdmin ? db.user.findMany({
      where: { orgId: user.orgId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }) : Promise.resolve([]),
  ]);

  const totalHours    = entries.reduce((s, e) => s + e.hours, 0);
  const billableHours = entries.filter((e) => e.isBillable).reduce((s, e) => s + e.hours, 0);
  const billableValue = entries.filter((e) => e.isBillable).reduce((s, e) => s + e.hours * (e.billableRate ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
      <TimeTrackingClient
        entries={entries}
        projects={projects}
        members={members}
        isAdmin={isAdmin}
        currentUserId={user.id}
        stats={{ totalHours, billableHours, billableValue }}
      />
    </div>
  );
}
