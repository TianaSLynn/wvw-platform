import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

const schema = z.object({ action: z.enum(["open", "pause", "close"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid collection action.");
    const audit = await db.audit.findFirst({ where: { id, orgId: user.orgId } });
    if (!audit) return notFound("Audit");
    const existingFields = audit.customFields && typeof audit.customFields === "object" && !Array.isArray(audit.customFields)
      ? audit.customFields as Record<string, unknown> : {};
    const now = new Date().toISOString();
    const state = parsed.data.action === "open"
      ? { isLocked: false, isPublicTokenActive: true, label: "OPEN" }
      : parsed.data.action === "pause"
        ? { isLocked: false, isPublicTokenActive: false, label: "PAUSED" }
        : { isLocked: true, isPublicTokenActive: false, label: "CLOSED" };
    const updated = await db.audit.update({
      where: { id: audit.id },
      data: {
        isLocked: state.isLocked,
        isPublicTokenActive: state.isPublicTokenActive,
        customFields: { ...existingFields, collectionStatus: state.label, collectionStatusChangedAt: now },
      },
    });
    await logActivity({
      orgId: user.orgId, userId: user.id, action: `audit.collection.${state.label.toLowerCase()}`,
      entityType: "Audit", entityId: audit.id, entityLabel: audit.name,
      beforeData: audit, afterData: updated, clientId: audit.clientId, auditId: audit.id,
    });
    return ok({ collectionStatus: state.label, isLocked: updated.isLocked, isPublicTokenActive: updated.isPublicTokenActive });
  } catch (error) { return serverError(error); }
}
