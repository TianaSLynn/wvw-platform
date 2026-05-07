import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { postAnnouncement } from "@/lib/announcements";
import { ROLE_CHANGE_STEPS } from "@/lib/onboarding-templates";
import { z } from "zod";

const updateSchema = z.object({
  firstName:         z.string().min(1).optional(),
  lastName:          z.string().min(1).optional(),
  email:             z.string().email().nullable().optional(),
  phone:             z.string().nullable().optional(),
  title:             z.string().nullable().optional(),
  department:        z.string().nullable().optional(),
  location:          z.string().nullable().optional(),
  managerId:         z.string().nullable().optional(),
  employmentStatus:  z.enum(["ACTIVE","LEAVE","TERMINATED","CONTRACT","ONBOARDING"]).optional(),
  employmentType:    z.string().optional(),
  level:             z.string().nullable().optional(),
  band:              z.string().nullable().optional(),
  startDate:         z.string().nullable().optional(),
  endDate:           z.string().nullable().optional(),
  isNeurodivergent:  z.boolean().nullable().optional(),
  hasAccommodation:  z.boolean().optional(),
  accommodationNote: z.string().nullable().optional(),
  tags:              z.array(z.string()).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const employee = await db.employee.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        manager:      { select: { id: true, firstName: true, lastName: true } },
        directReports:{ select: { id: true, firstName: true, lastName: true, title: true } },
        trainingRecords: { orderBy: { completedAt: "desc" }, take: 10 },
        policyAcknowledgements: { orderBy: { acknowledgedAt: "desc" }, take: 10 },
      },
    });

    if (!employee) return notFound("Employee");
    return ok(employee);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.employee.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Employee");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { startDate, endDate, ...rest } = parsed.data;

    const updated = await db.employee.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate   !== undefined ? { endDate:   endDate   ? new Date(endDate)   : null } : {}),
      },
    });

    const fullName = `${updated.firstName} ${updated.lastName}`;

    // Auto-announce status transitions (fire-and-forget)
    if (parsed.data.employmentStatus && parsed.data.employmentStatus !== existing.employmentStatus) {
      const newStatus = parsed.data.employmentStatus;

      if (newStatus === "ACTIVE" && existing.employmentStatus === "ONBOARDING") {
        // Onboarding complete → welcome announcement
        postAnnouncement({
          orgId:    user.orgId,
          authorId: user.id,
          announcementType: "ONBOARDING",
          title:   `Welcome to the team, ${updated.firstName}! 🎉`,
          body:    `${fullName}${updated.title ? `, our new ${updated.title}` : ""}, has officially joined the team. Please give them a warm welcome! 👋`,
          subjectName: fullName,
          subjectId:   id,
        }).catch(() => {});
      } else if (newStatus === "TERMINATED") {
        postAnnouncement({
          orgId:    user.orgId,
          authorId: user.id,
          announcementType: "OFFBOARDING",
          title:   `Farewell, ${updated.firstName} — thank you! 👏`,
          body:    `We want to take a moment to thank ${fullName}${updated.title ? `, our ${updated.title}` : ""}, for their contributions to the team. We wish them all the best in their next chapter. 💫`,
          subjectName: fullName,
          subjectId:   id,
        }).catch(() => {});
      }
    }

    // Auto-launch role-change workflow on title/department change
    const titleChanged = parsed.data.title && parsed.data.title !== existing.title && existing.title;
    const deptChanged  = parsed.data.department && parsed.data.department !== existing.department && existing.department;
    if (titleChanged || deptChanged) {
      db.onboardingWorkflow.create({
        data: {
          orgId:      user.orgId,
          employeeId: id,
          type:       "ONBOARDING",
          status:     "ACTIVE",
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes:      `Role transition: ${existing.title ?? existing.department} → ${updated.title ?? updated.department}`,
          steps: {
            create: ROLE_CHANGE_STEPS.map((step) => ({
              title:       step.title,
              description: step.description,
              category:    step.category,
              sortOrder:   step.sortOrder,
              status:      "PENDING" as const,
            })),
          },
        },
      }).catch(() => {});
    }

    // Auto-announce title/promotion change (fire-and-forget)
    if (parsed.data.title && parsed.data.title !== existing.title && existing.title) {
      postAnnouncement({
        orgId:    user.orgId,
        authorId: user.id,
        announcementType: "PROMOTION",
        title:   `Congratulations, ${updated.firstName}! 🚀`,
        body:    `We're excited to announce that ${fullName} has been promoted to ${updated.title}! Please join us in celebrating this well-deserved achievement. 🎉`,
        subjectName: fullName,
        subjectId:   id,
      }).catch(() => {});
    }

    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.employee.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Employee");

    await db.employee.delete({ where: { id } });
    return noContent();
  } catch (e) { return serverError(e); }
}
