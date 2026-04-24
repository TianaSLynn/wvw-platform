import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, serverError, badRequest } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { auditSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";
import { sendAuditStatusUpdate } from "@/lib/email";
import { sendTeamsAuditStatusUpdate } from "@/lib/ms365";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const audit = await db.audit.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        client:   { select: { id: true, name: true, logoUrl: true } },
        project:  { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, title: true } } },
        },
        sections: {
          include: {
            checklistItems: {
              orderBy: { sortOrder: "asc" },
              include: {
                evidence: { select: { id: true, title: true, type: true, createdAt: true } },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        findings: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
            remediationActions: { select: { id: true, status: true } },
            _count: { select: { evidence: true } },
          },
          orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
        },
        evidence: {
          include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        },
        frameworks: { include: { framework: { select: { name: true, type: true } } } },
        _count: { select: { findings: true, evidence: true, members: true } },
      },
    });

    if (!audit) return notFound("Audit");
    return ok(audit);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.audit.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Audit");

    const body = await req.json();
    const parsed = auditSchema.partial().safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    // Handle status transitions with timestamps
    const statusTimestamps: Record<string, object> = {
      FIELDWORK: { fieldworkStartDate: new Date() },
      COMPLETED: { completedAt: new Date() },
    };

    const updated = await db.audit.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.status && statusTimestamps[parsed.data.status] ? statusTimestamps[parsed.data.status] : {}),
      },
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: `audit.${parsed.data.status ? `status.changed.${parsed.data.status.toLowerCase()}` : "updated"}`,
      entityType: "Audit", entityId: id, entityLabel: updated.name,
      beforeData: existing, afterData: updated,
      clientId: updated.clientId, auditId: id,
    });

    // Notify audit members on status change (fire-and-forget)
    if (parsed.data.status && parsed.data.status !== existing.status) {
      db.auditMember.findMany({
        where: { auditId: id },
        include: { user: { select: { email: true, firstName: true } } },
      }).then(async (members) => {
        const client = updated.clientId
          ? await db.client.findUnique({ where: { id: updated.clientId }, select: { name: true } }).catch(() => null)
          : null;
        members.forEach(({ user: member }) => {
          sendAuditStatusUpdate({
            to: member.email,
            firstName: member.firstName,
            auditName: updated.name,
            newStatus: parsed.data.status!,
            clientName: client?.name ?? "Unknown Client",
            auditId: id,
          }).catch(() => {});
        });

        // Also post to Microsoft Teams if configured
        sendTeamsAuditStatusUpdate({
          orgId: user.orgId,
          auditName: updated.name,
          auditId: id,
          newStatus: parsed.data.status!,
          clientName: client?.name ?? "Unknown Client",
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

    const existing = await db.audit.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Audit");
    if (!["ADMIN","SUPER_ADMIN","PARTNER"].includes(user.role)) {
      return badRequest("Only admins can delete audits");
    }

    await db.audit.delete({ where: { id } });
    return noContent();
  } catch (e) { return serverError(e); }
}
