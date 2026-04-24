import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { projectSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const status   = searchParams.get("status");

    const projects = await db.project.findMany({
      where: {
        orgId: user.orgId,
        deletedAt: null,
        ...(clientId ? { clientId } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        _count: { select: { tasks: true, timeEntries: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    return ok(projects);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    // Verify client belongs to this org
    const client = await db.client.findFirst({ where: { id: parsed.data.clientId, orgId: user.orgId } });
    if (!client) return badRequest("Invalid client");

    const project = await db.project.create({
      data: {
        ...parsed.data,
        orgId: user.orgId,
        // Auto-add creator as project lead
        members: { create: { userId: user.id, role: "lead" } },
      },
      include: { client: { select: { name: true } } },
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: "project.created", entityType: "Project",
      entityId: project.id, entityLabel: project.name,
      afterData: project, clientId: project.clientId, projectId: project.id,
    });

    return created(project);
  } catch (e) { return serverError(e); }
}
