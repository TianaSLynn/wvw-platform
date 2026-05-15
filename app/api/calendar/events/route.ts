/**
 * Unified calendar events feed
 * Aggregates: meetings, interviews (job applications), employee onboarding start dates,
 * audit fieldwork dates, milestones, tasks with due dates, and invoices with due dates.
 */
import { db } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(new Date().setDate(new Date().getDate() - 7)); // 7 days back
    const to = searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : new Date(new Date().setDate(new Date().getDate() + 90)); // 90 days ahead

    const [meetings, applications, employees, audits, milestones, tasks, invoices, allEmployeesWithAnniversary, newClients, onboardingSteps] =
      await Promise.all([
        // Scheduled meetings
        db.meeting.findMany({
          where: {
            orgId: user.orgId,
            scheduledAt: { gte: from, lte: to },
          },
          include: { client: { select: { name: true } } },
          orderBy: { scheduledAt: "asc" },
          take: 200,
        }),

        // Job applications with scheduled interviews
        db.jobApplication.findMany({
          where: {
            orgId: user.orgId,
            interviewAt: { gte: from, lte: to },
          },
          include: { posting: { select: { title: true } } },
          orderBy: { interviewAt: "asc" },
          take: 100,
        }),

        // Employee onboarding start dates
        db.employee.findMany({
          where: {
            orgId: user.orgId,
            startDate: { gte: from, lte: to },
          },
          orderBy: { startDate: "asc" },
          take: 100,
        }),

        // Audit fieldwork dates
        db.audit.findMany({
          where: {
            orgId: user.orgId,
            OR: [
              { fieldworkStartDate: { gte: from, lte: to } },
              { fieldworkEndDate: { gte: from, lte: to } },
            ],
          },
          include: { client: { select: { name: true } } },
          orderBy: { fieldworkStartDate: "asc" },
          take: 100,
        }),

        // Project milestones
        db.milestone.findMany({
          where: {
            project: { orgId: user.orgId },
            isCompleted: false,
            dueDate: { gte: from, lte: to },
          },
          include: { project: { select: { name: true, client: { select: { name: true } } } } },
          orderBy: { dueDate: "asc" },
          take: 200,
        }),

        // Tasks with due dates (assigned to anyone in the org)
        db.task.findMany({
          where: {
            project: { orgId: user.orgId },
            status: { not: "DONE" },
            dueDate: { gte: from, lte: to },
          },
          include: { project: { select: { name: true } } },
          orderBy: { dueDate: "asc" },
          take: 50,
        }),

        // Invoices with due dates
        db.invoice.findMany({
          where: {
            orgId: user.orgId,
            status: { in: ["SENT", "OVERDUE"] },
            dueDate: { gte: from, lte: to },
          },
          include: { client: { select: { name: true } } },
          orderBy: { dueDate: "asc" },
          take: 30,
        }),

        // All employees with a startDate (for anniversary computation)
        db.employee.findMany({
          where: { orgId: user.orgId, startDate: { not: null }, employmentStatus: { not: "TERMINATED" } },
          select: { id: true, firstName: true, lastName: true, title: true, startDate: true },
          take: 500,
        }),

        // New clients onboarded in the window
        db.client.findMany({
          where: { orgId: user.orgId, onboardedAt: { gte: from, lte: to }, deletedAt: null },
          orderBy: { onboardedAt: "asc" },
          take: 100,
        }),

        // Onboarding step due dates (pending steps)
        db.onboardingStep.findMany({
          where: {
            workflow: { orgId: user.orgId, status: "ACTIVE" },
            status: "PENDING",
            dueDate: { gte: from, lte: to },
          },
          include: {
            workflow: {
              include: { employee: { select: { firstName: true, lastName: true } } },
            },
          },
          orderBy: { dueDate: "asc" },
          take: 50,
        }),
      ]);

    type EventPayload = {
      id: string;
      title: string;
      subtitle: string;
      date: Date;
      type: string;
      meta?: string;
      link?: string;
    };

    const events: EventPayload[] = [
      ...meetings.map((m) => ({
        id: m.id,
        title: m.title,
        subtitle: m.client?.name ?? m.type,
        date: m.scheduledAt,
        type: "meeting",
        meta: `${m.duration} min`,
        link: `/meetings`,
      })),

      ...applications
        .filter((a) => a.interviewAt != null)
        .map((a) => ({
          id: a.id,
          title: `Interview: ${a.firstName} ${a.lastName}`,
          subtitle: a.posting.title,
          date: a.interviewAt as Date,
          type: "interview",
          link: `/jobs/${a.postingId}`,
        })),

      ...employees
        .filter((e) => e.startDate != null)
        .map((e) => ({
          id: e.id,
          title: `${e.firstName} ${e.lastName} starts`,
          subtitle: e.title ?? e.department ?? "New hire",
          date: e.startDate as Date,
          type: "onboarding",
          meta: e.employmentType,
          link: `/workforce`,
        })),

      ...audits.flatMap((a) => {
        const evts: EventPayload[] = [];
        if (a.fieldworkStartDate) {
          evts.push({
            id: `${a.id}-start`,
            title: `${a.name} — Fieldwork Starts`,
            subtitle: a.client?.name ?? "—",
            date: a.fieldworkStartDate,
            type: "audit_start",
            link: `/audits/${a.id}`,
          });
        }
        if (a.fieldworkEndDate) {
          evts.push({
            id: `${a.id}-end`,
            title: `${a.name} — Fieldwork Ends`,
            subtitle: a.client?.name ?? "—",
            date: a.fieldworkEndDate,
            type: "audit_end",
            link: `/audits/${a.id}`,
          });
        }
        return evts;
      }),

      ...milestones
        .filter((m) => m.dueDate != null)
        .map((m) => ({
          id: m.id,
          title: m.name,
          subtitle: m.project.client?.name
            ? `${m.project.name} · ${m.project.client.name}`
            : m.project.name,
          date: m.dueDate as Date,
          type: "milestone",
          link: `/engagements`,
        })),

      ...tasks
        .filter((t) => t.dueDate != null)
        .map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.project?.name ?? "Task",
          date: t.dueDate as Date,
          type: "task",
          meta: t.priority ?? undefined,
          link: `/engagements`,
        })),

      ...invoices.map((inv) => ({
        id: inv.id,
        title: `Invoice #${inv.invoiceNumber} Due`,
        subtitle: inv.client?.name ?? "—",
        date: new Date(inv.dueDate),
        type: "invoice_due",
        meta: `$${inv.total.toLocaleString()}`,
        link: `/invoices/${inv.id}`,
      })),

      // Work anniversaries — employees whose startDate month/day falls within the window
      ...(() => {
        const out: EventPayload[] = [];
        const windowYear = from.getFullYear();
        for (const emp of allEmployeesWithAnniversary) {
          if (!emp.startDate) continue;
          const sd = new Date(emp.startDate);
          for (const yr of [windowYear, windowYear + 1]) {
            const anniversary = new Date(yr, sd.getMonth(), sd.getDate());
            if (anniversary >= from && anniversary <= to) {
              const years = yr - sd.getFullYear();
              if (years > 0) {
                out.push({
                  id: `anniversary-${emp.id}-${yr}`,
                  title: `${emp.firstName} ${emp.lastName} — ${years}-year Anniversary`,
                  subtitle: emp.title ?? "Team member",
                  date: anniversary,
                  type: "onboarding",
                  meta: `${years} yr${years !== 1 ? "s" : ""}`,
                  link: `/workforce`,
                });
              }
            }
          }
        }
        return out;
      })(),

      ...newClients.map((c) => ({
        id: `client-start-${c.id}`,
        title: `${c.name} — Client Onboards`,
        subtitle: c.industry ?? "New client",
        date: c.onboardedAt as Date,
        type: "onboarding" as const,
        link: `/clients/${c.id}`,
      })),

      ...onboardingSteps
        .filter((s) => s.dueDate != null)
        .map((s) => ({
          id: `step-${s.id}`,
          title: s.title,
          subtitle: `Onboarding: ${s.workflow.employee?.firstName ?? ""} ${s.workflow.employee?.lastName ?? ""}`.trim(),
          date: s.dueDate as Date,
          type: "task" as const,
          meta: s.category,
          link: `/workforce/onboarding`,
        })),
    ];

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    return ok({ events, count: events.length });
  } catch (e) {
    return serverError(e);
  }
}
