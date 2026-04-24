import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, serverError, badRequest } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { remediationSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateSchema = remediationSchema.partial().extend({
  status: z.enum(["BACKLOG","TODO","IN_PROGRESS","IN_REVIEW","DONE","CANCELLED"]).optional(),
  completedAt: z.string().optional(),
  verificationNotes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const action = await db.remediationAction.findFirst({
      where: { id },
      include: { finding: { include: { audit: { select: { orgId: true, clientId: true, id: true } } } } },
    });
    if (!action || action.finding.audit.orgId !== user.orgId) return notFound("Remediation action");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const updated = await db.remediationAction.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.status === "DONE" ? {
          completedAt: new Date(),
          verifiedById: user.id,
          verifiedAt: new Date(),
        } : {}),
        ...(parsed.data.status === "IN_PROGRESS" && !action.startedAt ? { startedAt: new Date() } : {}),
      },
    });

    // If all remediation actions are done, suggest closing the finding
    const allActions = await db.remediationAction.findMany({
      where: { findingId: action.findingId },
      select: { status: true },
    });
    const allDone = allActions.every((a) => a.status === "DONE");

    await logActivity({
      orgId: user.orgId,
      userId: user.id,
      action: `remediation.action.${(parsed.data.status ?? "updated").toLowerCase()}`,
      entityType: "RemediationAction",
      entityId: id,
      entityLabel: action.title,
      auditId: action.finding.audit.id,
      clientId: action.finding.audit.clientId,
      metadata: { allActionsDone: allDone },
    });

    return ok({ ...updated, allActionsDone: allDone });
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const action = await db.remediationAction.findFirst({
      where: { id },
      include: { finding: { include: { audit: { select: { orgId: true } } } } },
    });
    if (!action || action.finding.audit.orgId !== user.orgId) return notFound("Remediation action");

    await db.remediationAction.delete({ where: { id } });
    return noContent();
  } catch (e) { return serverError(e); }
}
