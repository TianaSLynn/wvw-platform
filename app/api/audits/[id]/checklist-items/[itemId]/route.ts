import { db } from "@/lib/db";
import { ok, unauthorized, notFound, serverError, badRequest } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { checklistResponseSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId, itemId } = await params;

    // Verify audit belongs to org
    const audit = await db.audit.findFirst({ where: { id: auditId, orgId: user.orgId } });
    if (!audit) return notFound("Audit");

    const item = await db.auditChecklistItem.findFirst({
      where: { id: itemId, section: { auditId } },
    });
    if (!item) return notFound("Checklist item");

    const body = await req.json();
    const parsed = checklistResponseSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const isLikert = ["1","2","3","4","5"].includes(parsed.data.response);
    const isCompleted = parsed.data.isCompleted ?? (isLikert ? true : parsed.data.response === "yes");

    const updated = await db.auditChecklistItem.update({
      where: { id: itemId },
      data: {
        response:    parsed.data.response,
        notes:       parsed.data.notes,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Recompute section completion %
    const sectionItems = await db.auditChecklistItem.findMany({
      where: { sectionId: item.sectionId },
      select: { isCompleted: true },
    });
    const completedCount = sectionItems.filter((i) => i.isCompleted).length;
    const completionPct = sectionItems.length > 0 ? (completedCount / sectionItems.length) * 100 : 0;

    await db.auditSection.update({
      where: { id: item.sectionId },
      data: { completionPct },
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: "audit.checklist.item.updated",
      entityType: "AuditChecklistItem", entityId: itemId,
      entityLabel: item.question.slice(0, 80),
      afterData: { response: parsed.data.response, notes: parsed.data.notes },
      auditId, clientId: audit.clientId,
    });

    return ok({ ...updated, sectionCompletionPct: completionPct });
  } catch (e) { return serverError(e); }
}
