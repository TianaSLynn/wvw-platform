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

    const [meetings, applications, employees, audits, milestones, tasks, invoices] =
      await Promise.all([
        // Scheduled meetings
        db.meeting.findMany({
          where: {
            orgId: user.orgId,
            scheduledAt: { gte: from, lte: to },
          },
          include: { client: { select: { name: true } } },
          orderBy: { scheduledAt: "asc" },
        }),

        // Job applications with scheduled interviews
        db.jobApplication.findMany({
          where: {
            orgId: user.orgId,
            interviewAt: { gte: from, lte: to },
          },
          include: { posting: { select: { title: true } } },
          orderBy: { interviewAt: "asc" },
        }),

        // Employee onboarding start dates
        db.employee.findMany({
          where: {
            orgId: user.orgId,
            startDate: { gte: from, lte: to },
          },
          orderBy: { startDate: "asc" },
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
    ];

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    return ok({ events, count: events.length });
  } catch (e) {
    return serverError(e);
  }
}
