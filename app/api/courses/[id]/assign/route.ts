/**
 * Assign a course to one or many employees.
 * PATCH updates an assignment status/score.
 */
import { db } from "@/lib/db";
import { ok, created, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const ASSIGNMENT_STATUSES = ["ASSIGNED","IN_PROGRESS","COMPLETED","FAILED","EXEMPT","OVERDUE"] as const;

const assignSchema = z.object({
  employeeIds: z.array(z.string()).min(1),
  dueDate:     z.string().optional(),
  notes:       z.string().optional(),
});

const updateSchema = z.object({
  assignmentId: z.string(),
  status:       z.enum(ASSIGNMENT_STATUSES).optional(),
  score:        z.number().nullable().optional(),
  notes:        z.string().nullable().optional(),
  dueDate:      z.string().nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: courseId } = await params;

    const course = await db.course.findFirst({ where: { id: courseId, orgId: user.orgId } });
    if (!course) return notFound("Course");

    const body = await req.json();
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { employeeIds, dueDate, notes } = parsed.data;

    // Upsert — skip employees who are already assigned
    const results = await Promise.all(
      employeeIds.map(async (employeeId) => {
        return db.courseAssignment.upsert({
          where: { courseId_employeeId: { courseId, employeeId } },
          create: {
            orgId:        user.orgId,
            courseId,
            employeeId,
            assignedById: user.id,
            status:       "ASSIGNED",
            dueDate:      dueDate ? new Date(dueDate) : null,
            notes:        notes ?? null,
          },
          update: {
            status:  "ASSIGNED",
            dueDate: dueDate ? new Date(dueDate) : undefined,
          },
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        });
      })
    );

    return created({ assigned: results.length, assignments: results });
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: courseId } = await params;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { assignmentId, status, score, notes, dueDate } = parsed.data;

    // Fetch current to check startedAt
    const current = await db.courseAssignment.findFirst({ where: { id: assignmentId } });

    const updated = await db.courseAssignment.update({
      where: { id: assignmentId },
      data: {
        ...(status !== undefined ? {
          status,
          ...(status === "COMPLETED" ? { completedAt: new Date(), passed: score != null ? score >= 70 : true } : {}),
          ...(status === "IN_PROGRESS" && !current?.startedAt ? { startedAt: new Date() } : {}),
        } : {}),
        ...(score   !== undefined ? { score }   : {}),
        ...(notes   !== undefined ? { notes }   : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
    });

    return ok(updated);
  } catch (e) { return serverError(e); }
}
