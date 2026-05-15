/**
 * Unified calendar events feed
 * Aggregates: meetings, interviews, employee start/birthday/promotion,
 * audit fieldwork, milestones, tasks, invoices, work anniversaries,
 * new clients, onboarding steps, US federal holidays, WVW cultural holidays, PTO
 */
import { db } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

// ─── US Federal Holiday computation ───────────────────────────────────────────

function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const d = new Date(year, month, 1);
  const first = d.getDay();
  const offset = (weekday - first + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month + 1, 0);
  const diff = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - diff);
}

function getFederalHolidays(year: number) {
  return [
    { name: "New Year's Day",       date: new Date(year, 0, 1),  description: "US federal holiday" },
    { name: "Martin Luther King Jr. Day", date: nthWeekday(year, 0, 1, 3), description: "3rd Monday of January — US federal holiday" },
    { name: "Presidents' Day",      date: nthWeekday(year, 1, 1, 3), description: "3rd Monday of February — US federal holiday" },
    { name: "Memorial Day",         date: lastWeekday(year, 4, 1),   description: "Last Monday of May — US federal holiday" },
    { name: "Juneteenth",           date: new Date(year, 5, 19), description: "Federal recognition of Emancipation — also a WVW signature day" },
    { name: "Independence Day",     date: new Date(year, 6, 4),  description: "US federal holiday" },
    { name: "Labor Day",            date: nthWeekday(year, 8, 1, 1), description: "1st Monday of September — US federal holiday" },
    { name: "Columbus Day",         date: nthWeekday(year, 9, 1, 2), description: "2nd Monday of October — US federal holiday" },
    { name: "Veterans Day",         date: new Date(year, 10, 11), description: "US federal holiday" },
    { name: "Thanksgiving",         date: nthWeekday(year, 10, 4, 4), description: "4th Thursday of November — US federal holiday" },
    { name: "Christmas Day",        date: new Date(year, 11, 25), description: "US federal holiday" },
  ];
}

// ─── WVW Cultural holiday fixed dates (from the client-side CULTURAL_EVENTS) ──

type CulturalFixed = { name: string; month: number; day: number; category: string; offType?: string; notes?: string };

const WVW_FIXED_DAYS: CulturalFixed[] = [
  { name: "New Year Reset Day",        month: 1,  day: 1,  category: "Wellness",      offType: "Full Company" },
  { name: "Rosa Parks Day",            month: 2,  day: 4,  category: "Culture" },
  { name: "Black Love Day",            month: 2,  day: 13, category: "Wellness",      offType: "Soft Day (No Meetings)" },
  { name: "International Women's Day", month: 3,  day: 8,  category: "Gender Equity" },
  { name: "Day of Rest for Black Women", month: 3, day: 10, category: "Wellness",     offType: "Full Company", notes: "NON-NEGOTIABLE REST DAY" },
  { name: "Juneteenth (WVW Observance)", month: 6, day: 19, category: "Culture",      offType: "Full Company" },
  { name: "Black Girl Day Off",        month: 10, day: 11, category: "Wellness",      offType: "Full Company", notes: "SIGNATURE WVW OFF DAY" },
  { name: "Black Entrepreneur Day",    month: 10, day: 14, category: "Business" },
  { name: "Black Poetry Day",          month: 10, day: 17, category: "Culture",       offType: "Soft Day (Creative)" },
  { name: "Kwanzaa",                   month: 12, day: 26, category: "Culture",       offType: "Optional Flexible Off" },
  { name: "End of Year Reset Week",    month: 12, day: 26, category: "Wellness",      offType: "Company Slow/Closed" },
];

function getWvwCulturalHolidays(year: number) {
  return WVW_FIXED_DAYS.map((e) => ({
    name: e.name,
    date: new Date(year, e.month - 1, e.day),
    category: e.category,
    offType: e.offType,
    notes: e.notes,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(new Date().setDate(new Date().getDate() - 7));
    const to = searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : new Date(new Date().setDate(new Date().getDate() + 90));

    const [
      meetings, applications, employees, audits, milestones, tasks, invoices,
      allEmployeesWithAnniversary, newClients, onboardingSteps,
      allEmployeesForBirthdays, promotedEmployees, ptoRecords,
    ] = await Promise.all([
      db.meeting.findMany({
        where: { orgId: user.orgId, scheduledAt: { gte: from, lte: to } },
        include: { client: { select: { name: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 200,
      }),
      db.jobApplication.findMany({
        where: { orgId: user.orgId, interviewAt: { gte: from, lte: to } },
        include: { posting: { select: { title: true } } },
        orderBy: { interviewAt: "asc" },
        take: 100,
      }),
      db.employee.findMany({
        where: { orgId: user.orgId, startDate: { gte: from, lte: to } },
        orderBy: { startDate: "asc" },
        take: 100,
      }),
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
      db.milestone.findMany({
        where: { project: { orgId: user.orgId }, isCompleted: false, dueDate: { gte: from, lte: to } },
        include: { project: { select: { name: true, client: { select: { name: true } } } } },
        orderBy: { dueDate: "asc" },
        take: 200,
      }),
      db.task.findMany({
        where: { project: { orgId: user.orgId }, status: { not: "DONE" }, dueDate: { gte: from, lte: to } },
        include: { project: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
        take: 50,
      }),
      db.invoice.findMany({
        where: { orgId: user.orgId, status: { in: ["SENT", "OVERDUE"] }, dueDate: { gte: from, lte: to } },
        include: { client: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
        take: 30,
      }),
      // All active employees with a startDate for anniversary computation
      db.employee.findMany({
        where: { orgId: user.orgId, startDate: { not: null }, employmentStatus: { not: "TERMINATED" } },
        select: { id: true, firstName: true, lastName: true, title: true, startDate: true },
        take: 500,
      }),
      db.client.findMany({
        where: { orgId: user.orgId, onboardedAt: { gte: from, lte: to }, deletedAt: null },
        orderBy: { onboardedAt: "asc" },
        take: 100,
      }),
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
      // Employees with a birthday in the window (any year)
      db.employee.findMany({
        where: { orgId: user.orgId, dateOfBirth: { not: null }, employmentStatus: { not: "TERMINATED" } },
        select: { id: true, firstName: true, lastName: true, title: true, department: true, dateOfBirth: true },
        take: 500,
      }),
      // Employees with a promotion date in the window
      db.employee.findMany({
        where: { orgId: user.orgId, promotionDate: { gte: from, lte: to } },
        select: { id: true, firstName: true, lastName: true, title: true, previousTitle: true, promotionDate: true, department: true },
        take: 100,
      }),
      // PTO records from Availability model
      db.availability.findMany({
        where: {
          type: { in: ["pto", "holiday"] },
          startDate: { lte: to },
          endDate: { gte: from },
          user: { orgId: user.orgId },
        },
        include: { user: { select: { firstName: true, lastName: true } } },
        take: 200,
      }),
    ]);

    type DetailItem = { label: string; value: string };
    type EventPayload = {
      id: string;
      title: string;
      subtitle: string;
      date: Date;
      type: string;
      meta?: string;
      link?: string;
      description?: string;
      details?: DetailItem[];
      isOffDay?: boolean;
      offType?: string;
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
        details: [
          { label: "Type", value: m.type },
          { label: "Duration", value: `${m.duration} minutes` },
          ...(m.client?.name ? [{ label: "Client", value: m.client.name }] : []),
          { label: "Time", value: m.scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) },
        ],
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
          details: [
            { label: "Candidate", value: `${a.firstName} ${a.lastName}` },
            { label: "Position", value: a.posting.title },
            { label: "Status", value: a.status },
          ],
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
          details: [
            { label: "Name", value: `${e.firstName} ${e.lastName}` },
            ...(e.title ? [{ label: "Title", value: e.title }] : []),
            ...(e.department ? [{ label: "Department", value: e.department }] : []),
            { label: "Type", value: e.employmentType },
          ],
        })),

      ...audits.flatMap((a) => {
        const evts: EventPayload[] = [];
        const sharedDetails = [
          { label: "Audit", value: a.name },
          ...(a.client?.name ? [{ label: "Client", value: a.client.name }] : []),
          { label: "Status", value: a.status },
        ];
        if (a.fieldworkStartDate) {
          evts.push({
            id: `${a.id}-start`,
            title: `${a.name} — Fieldwork Starts`,
            subtitle: a.client?.name ?? "—",
            date: a.fieldworkStartDate,
            type: "audit_start",
            link: `/audits/${a.id}`,
            details: [...sharedDetails, ...(a.fieldworkEndDate ? [{ label: "Ends", value: a.fieldworkEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }] : [])],
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
            details: [...sharedDetails, ...(a.fieldworkStartDate ? [{ label: "Started", value: a.fieldworkStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }] : [])],
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
          details: [
            { label: "Project", value: m.project.name },
            ...(m.project.client?.name ? [{ label: "Client", value: m.project.client.name }] : []),
            ...(m.description ? [{ label: "Description", value: m.description }] : []),
          ],
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
          details: [
            ...(t.project?.name ? [{ label: "Project", value: t.project.name }] : []),
            ...(t.priority ? [{ label: "Priority", value: t.priority }] : []),
            ...(t.description ? [{ label: "Description", value: t.description }] : []),
          ],
        })),

      ...invoices.map((inv) => ({
        id: inv.id,
        title: `Invoice #${inv.invoiceNumber} Due`,
        subtitle: inv.client?.name ?? "—",
        date: new Date(inv.dueDate),
        type: "invoice_due",
        meta: `$${inv.total.toLocaleString()}`,
        link: `/invoices/${inv.id}`,
        details: [
          { label: "Invoice #", value: inv.invoiceNumber },
          ...(inv.client?.name ? [{ label: "Client", value: inv.client.name }] : []),
          { label: "Amount", value: `$${inv.total.toLocaleString()}` },
          { label: "Status", value: inv.status },
        ],
      })),

      // Work anniversaries
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
                  details: [
                    { label: "Employee", value: `${emp.firstName} ${emp.lastName}` },
                    ...(emp.title ? [{ label: "Title", value: emp.title }] : []),
                    { label: "Years of Service", value: `${years} year${years !== 1 ? "s" : ""}` },
                    { label: "Hire Date", value: sd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                  ],
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
        details: [
          { label: "Client", value: c.name },
          ...(c.industry ? [{ label: "Industry", value: c.industry }] : []),
        ],
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
          details: [
            { label: "Step", value: s.title },
            ...(s.workflow.employee ? [{ label: "Employee", value: `${s.workflow.employee.firstName} ${s.workflow.employee.lastName}` }] : []),
            ...(s.category ? [{ label: "Category", value: s.category }] : []),
            { label: "Status", value: s.status },
          ],
        })),

      // Employee birthdays (projected to current year window)
      ...(() => {
        const out: EventPayload[] = [];
        const windowYear = from.getFullYear();
        for (const emp of allEmployeesForBirthdays) {
          if (!emp.dateOfBirth) continue;
          const dob = new Date(emp.dateOfBirth);
          for (const yr of [windowYear, windowYear + 1]) {
            const bday = new Date(yr, dob.getMonth(), dob.getDate());
            if (bday >= from && bday <= to) {
              out.push({
                id: `birthday-${emp.id}-${yr}`,
                title: `🎂 ${emp.firstName} ${emp.lastName}'s Birthday`,
                subtitle: emp.department ?? emp.title ?? "Team member",
                date: bday,
                type: "birthday",
                link: `/workforce`,
                details: [
                  { label: "Name", value: `${emp.firstName} ${emp.lastName}` },
                  ...(emp.title ? [{ label: "Title", value: emp.title }] : []),
                  ...(emp.department ? [{ label: "Department", value: emp.department }] : []),
                ],
              });
            }
          }
        }
        return out;
      })(),

      // Promotions / role changes
      ...promotedEmployees
        .filter((e) => e.promotionDate != null)
        .map((e) => ({
          id: `promotion-${e.id}`,
          title: `${e.firstName} ${e.lastName} — Promoted`,
          subtitle: e.title ?? "Role change",
          date: e.promotionDate as Date,
          type: "promotion",
          link: `/workforce`,
          details: [
            { label: "Employee", value: `${e.firstName} ${e.lastName}` },
            ...(e.previousTitle ? [{ label: "Previous Title", value: e.previousTitle }] : []),
            ...(e.title ? [{ label: "New Title", value: e.title }] : []),
            ...(e.department ? [{ label: "Department", value: e.department }] : []),
            { label: "Effective Date", value: (e.promotionDate as Date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
          ],
        })),

      // PTO / days off from Availability
      ...ptoRecords.map((p) => ({
        id: `pto-${p.id}`,
        title: `${p.user.firstName} ${p.user.lastName} — ${p.type === "pto" ? "PTO" : "Day Off"}`,
        subtitle: p.note ?? (p.type === "pto" ? "Paid time off" : "Holiday / off day"),
        date: p.startDate,
        type: "pto",
        isOffDay: true,
        offType: p.type === "pto" ? "PTO" : "Holiday",
        link: `/workforce`,
        details: [
          { label: "Person", value: `${p.user.firstName} ${p.user.lastName}` },
          { label: "Type", value: p.type === "pto" ? "Paid Time Off" : "Holiday" },
          { label: "Start", value: p.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
          { label: "End", value: p.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
          ...(p.note ? [{ label: "Note", value: p.note }] : []),
        ],
      })),

      // US Federal Holidays
      ...(() => {
        const out: EventPayload[] = [];
        const years = new Set([from.getFullYear(), to.getFullYear()]);
        for (const yr of years) {
          for (const h of getFederalHolidays(yr)) {
            if (h.date >= from && h.date <= to) {
              out.push({
                id: `federal-${yr}-${h.name.replace(/\s+/g, "-")}`,
                title: h.name,
                subtitle: "US Federal Holiday",
                date: h.date,
                type: "holiday",
                isOffDay: true,
                offType: "Federal Holiday",
                description: h.description,
                details: [
                  { label: "Holiday", value: h.name },
                  { label: "Type", value: "US Federal Holiday" },
                  { label: "Date", value: h.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) },
                ],
              });
            }
          }
        }
        return out;
      })(),

      // WVW Cultural Holidays (fixed-date ones)
      ...(() => {
        const out: EventPayload[] = [];
        const years = new Set([from.getFullYear(), to.getFullYear()]);
        for (const yr of years) {
          for (const h of getWvwCulturalHolidays(yr)) {
            if (h.date >= from && h.date <= to) {
              out.push({
                id: `wvw-${yr}-${h.name.replace(/\s+/g, "-")}`,
                title: h.name,
                subtitle: h.offType ? `${h.category} · ${h.offType}` : h.category,
                date: h.date,
                type: "cultural",
                isOffDay: !!h.offType,
                offType: h.offType,
                description: h.notes,
                details: [
                  { label: "Observance", value: h.name },
                  { label: "Category", value: h.category },
                  ...(h.offType ? [{ label: "Off Type", value: h.offType }] : []),
                  ...(h.notes ? [{ label: "Note", value: h.notes }] : []),
                ],
              });
            }
          }
        }
        return out;
      })(),
    ];

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    return ok({ events, count: events.length });
  } catch (e) {
    return serverError(e);
  }
}
