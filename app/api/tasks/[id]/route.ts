import { db } from "@/lib/db";
import { ok, unauthorized, notFound, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { sendTaskAssigned } from "@/lib/email";
import { z } from "zod";

const updateSchema = z.object({
  title:          z.string().min(1).optional(),
  description:    z.string().optional(),
  status:         z.enum(["BACKLOG","TODO","IN_PROGRESS","IN_REVIEW","DONE","CANCELLED"]).optional(),
  priority:       z.enum(["CRITICAL","HIGH","MEDIUM","LOW"]).optional(),
  assigneeId:     z.string().cuid().nullable().optional(),
  dueDate:        z.string().datetime().nullable().optional(),
  estimatedHours: z.number().positive().optional(),
  position:       z.number().int().optional(),
  milestoneId:    z.string().cuid().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const task = await db.task.findFirst({
      where: { id, project: { orgId: user.orgId } },
    });
    if (!task) return notFound("Task");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const updated = await db.task.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.status === "DONE" ? { completedAt: new Date() } : {}),
      },
    });

    // Notify new assignee when assigneeId changes (fire-and-forget)
    if (parsed.data.assigneeId && parsed.data.assigneeId !== task.assigneeId) {
      db.user.findUnique({
        where: { id: parsed.data.assigneeId },
        select: { email: true, firstName: true },
      }).then((assignee) => {
        if (!assignee) return;
        sendTaskAssigned({
          to: assignee.email,
          firstName: assignee.firstName,
          taskTitle: updated.title,
          dueDate: updated.dueDate ? new Date(updated.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
          assignedBy: `${user.firstName} ${user.lastName}`,
        }).catch(() => {});
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

    const task = await db.task.findFirst({ where: { id, project: { orgId: user.orgId } } });
    if (!task) return notFound("Task");

    await db.task.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) { return serverError(e); }
}
