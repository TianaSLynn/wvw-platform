import { db } from "@/lib/db";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  name:        z.string().min(1).optional(),
  code:        z.string().optional(),
  track:       z.string().optional(),
  description: z.string().optional(),
  status:      z.enum(["UPCOMING","ACTIVE","COMPLETED","PAUSED"]).optional(),
  startDate:   z.string().nullable().optional(),
  endDate:     z.string().nullable().optional(),
  capacity:    z.number().int().positive().nullable().optional(),
  courseIds:   z.array(z.string()).optional(),
});

const memberSchema = z.object({
  action:     z.enum(["add_member","remove_member","update_member"]),
  memberId:   z.string().optional(),
  name:       z.string().optional(),
  email:      z.string().optional(),
  employeeId: z.string().optional(),
  progress:   z.number().int().min(0).max(100).optional(),
  status:     z.enum(["ENROLLED","COMPLETED","DROPPED"]).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const cohort = await db.cohort.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        members: {
          include: { employee: { select: { id: true, firstName: true, lastName: true, title: true } } },
          orderBy: { enrolledAt: "asc" },
        },
      },
    });
    if (!cohort) return notFound();
    return ok(cohort);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN","ADMIN"].includes(user.role)) return unauthorized();
    const { id } = await params;

    const cohort = await db.cohort.findFirst({ where: { id, orgId: user.orgId } });
    if (!cohort) return notFound();

    const body = await req.json();

    // Handle member actions
    if ("action" in body) {
      const parsed = memberSchema.safeParse(body);
      if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
      const { action, memberId, name, email, employeeId, progress, status } = parsed.data;

      if (action === "add_member") {
        const member = await db.cohortMember.create({
          data: { cohortId: id, name: name ?? null, email: email ?? null, employeeId: employeeId ?? null },
        });
        return ok(member);
      }
      if (action === "remove_member" && memberId) {
        await db.cohortMember.delete({ where: { id: memberId } });
        return ok({ deleted: true });
      }
      if (action === "update_member" && memberId) {
        const member = await db.cohortMember.update({
          where: { id: memberId },
          data: {
            progress:    progress    !== undefined ? progress    : undefined,
            status:      status      !== undefined ? status      : undefined,
            completedAt: status === "COMPLETED" ? new Date() : undefined,
          },
        });
        return ok(member);
      }
      return badRequest("Unknown action");
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
    const { startDate, endDate, ...rest } = parsed.data;

    const updated = await db.cohort.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate   !== undefined ? { endDate:   endDate   ? new Date(endDate)   : null } : {}),
      },
      include: { _count: { select: { members: true } } },
    });
    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN","ADMIN"].includes(user.role)) return unauthorized();
    const { id } = await params;
    await db.cohort.delete({ where: { id, orgId: user.orgId } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
