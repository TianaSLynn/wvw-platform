import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

const PRIVACY_CONFIGURATION_VERSION = "WVW-PRIVACY-2026-08-29";

const privacySchema = z.object({
  minimumAnonymousResponses: z.number().int().min(5).max(50),
  responseRetentionDays: z.number().int().min(30).max(2555),
  evidenceRetentionDays: z.number().int().min(30).max(3650),
  deletionPolicy: z.enum(["DELETE_AFTER_RETENTION", "ANONYMIZE_AFTER_RETENTION", "LEGAL_HOLD_OVERRIDE"]),
});

function fields(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const audit = await db.audit.findFirst({ where: { id, orgId: user.orgId }, select: { customFields: true } });
    if (!audit) return notFound("Audit");
    const value = fields(audit.customFields);
    return ok({
      minimumAnonymousResponses: value.minimumAnonymousResponses ?? 5,
      responseRetentionDays: value.responseRetentionDays ?? null,
      evidenceRetentionDays: value.evidenceRetentionDays ?? null,
      deletionPolicy: value.deletionPolicy ?? null,
      configuredAt: value.privacyConfiguredAt ?? null,
      configurationVersion: value.privacyConfigurationVersion ?? null,
    });
  } catch (error) { return serverError(error); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const parsed = privacySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
    const audit = await db.audit.findFirst({ where: { id, orgId: user.orgId } });
    if (!audit) return notFound("Audit");
    const previous = fields(audit.customFields);
    const configuredAt = new Date().toISOString();
    const next = {
      ...previous,
      ...parsed.data,
      privacyConfiguredAt: configuredAt,
      privacyConfiguredBy: user.id,
      privacyConfigurationVersion: PRIVACY_CONFIGURATION_VERSION,
    };
    await db.audit.update({ where: { id }, data: { customFields: next } });
    await logActivity({
      orgId: user.orgId, userId: user.id, action: "audit.privacy_configured",
      entityType: "Audit", entityId: id, entityLabel: audit.name,
      beforeData: previous, afterData: next, clientId: audit.clientId, auditId: id,
    });
    return ok({ ...parsed.data, configuredAt, configurationVersion: PRIVACY_CONFIGURATION_VERSION });
  } catch (error) { return serverError(error); }
}
