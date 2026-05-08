import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, serverError, badRequest, forbidden
} from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { projectSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const project = await db.project.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null },
      include: {
        client: { select: { id: true, name: true, logoUrl: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, title: true } } },
        },
        tasks: {
          where: { parentId: null },
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
            subtasks:  { select: { id: true, title: true, status: true } },
          },
          orderBy: [{ status: "asc" }, { position: "asc" }],
        },
        milestones: { orderBy: { dueDate: "asc" } },
        _count: { select: { tasks: true, timeEntries: true, documents: true } },
      },
    });

    if (!project) return notFound("Project");
    return ok(project);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.project.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Project");

    const body = await req.json();
    const parsed = projectSchema.partial().safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const updated = await db.project.update({ where: { id }, data: parsed.data });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: "project.updated", entityType: "Project",
      entityId: id, entityLabel: updated.name,
      beforeData: existing, afterData: updated,
      projectId: id, clientId: updated.clientId,
    });

    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "PARTNER", "MANAGER"].includes(user.role)) return forbidden("Insufficient permissions");
    const { id } = await params;

    const existing = await db.project.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Project");

    await db.project.update({ where: { id }, data: { deletedAt: new Date() } });
    return noContent();
  } catch (e) { return serverError(e); }
}
