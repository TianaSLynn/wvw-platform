import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AICommandClient from "./AICommandClient";

export const metadata: Metadata = { title: "AI Command Center" };

export default async function AICommandPage() {
  const user = await requireUser();

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  const [
    recentAudits,
    openFindings,
    clientCount,
    employees,
    ptoRequests,
    onboardingCount,
    courses,
    invoicesOverdue,
    upcomingMeetings,
    openJobs,
  ] = await Promise.all([
    db.audit.findMany({
      where: { orgId: user.orgId, status: { in: ["FIELDWORK","REVIEW","PLANNING"] } },
      select: { id: true, name: true, status: true, type: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.auditFinding.count({
      where: { audit: { orgId: user.orgId }, status: { in: ["OPEN","IN_PROGRESS"] } },
    }),
    db.client.count({ where: { orgId: user.orgId, isActive: true } }),
    db.employee.findMany({
      where: { orgId: user.orgId },
      select: { id: true, firstName: true, lastName: true, title: true, employmentStatus: true, department: true },
      orderBy: { lastName: "asc" },
      take: 20,
    }),
    db.ptoRequest.findMany({
      where: { orgId: user.orgId, status: "PENDING" },
      select: {
        id: true, startDate: true, endDate: true, days: true,
        user: { select: { firstName: true, lastName: true } },
        ptoType: { select: { name: true } },
      },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
    db.onboardingWorkflow.count({
      where: { orgId: user.orgId, status: { in: ["ACTIVE","NOT_STARTED"] } },
    }),
    db.course.findMany({
      where: { orgId: user.orgId, isActive: true },
      select: { id: true, title: true },
      take: 5,
    }),
    db.invoice.count({
      where: { orgId: user.orgId, status: { in: ["SENT","OVERDUE"] } },
    }),
    db.meeting.findMany({
      where: { orgId: user.orgId, scheduledAt: { gte: startOfDay, lte: endOfWeek } },
      select: { id: true, title: true, scheduledAt: true, type: true },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    db.jobPosting.count({ where: { orgId: user.orgId, status: "PUBLISHED" } }),
  ]);

  const todayContext = {
    date: today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    openFindings,
    activeAudits: recentAudits.length,
    clientCount,
    pendingPto: ptoRequests.length,
    activeOnboarding: onboardingCount,
    openJobs,
    invoicesOverdue,
    upcomingMeetings: upcomingMeetings.length,
    activeCourses: courses.length,
  };

  return (
    <AICommandClient
      userName={user.firstName}
      orgName={user.org?.name ?? "WVW"}
      userRole={user.role}
      recentAudits={recentAudits}
      openFindings={openFindings}
      clientCount={clientCount}
      employees={employees.map((e) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        title: e.title,
        status: e.employmentStatus,
        department: e.department,
      }))}
      ptoRequests={ptoRequests.map((r) => ({
        id: r.id,
        name: `${r.user.firstName} ${r.user.lastName}`,
        type: r.ptoType.name,
        start: r.startDate.toLocaleDateString(),
        end: r.endDate.toLocaleDateString(),
        days: r.days,
      }))}
      courses={courses}
      todayContext={todayContext}
    />
  );
}
