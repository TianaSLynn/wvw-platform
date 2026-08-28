import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { generateSurveyToken } from "@/lib/survey-token";
import { sendAuditParticipantInvitation } from "@/lib/email";
import type { AuditParticipantInvite } from "../route";

const updateSchema = z.object({
  action: z.enum(["resend", "support", "clear-support"]),
  supportNotes: z.string().max(1000).optional(),
});
const fields = (value: unknown) => value && typeof value === "object" && !Array.isArray(value)
  ? value as Record<string, unknown> : {};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; participantId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id, participantId } = await params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
    const audit = await db.audit.findFirst({
      where: { id, orgId: user.orgId },
      select: { id: true, name: true, customFields: true, client: { select: { name: true } } },
    });
    if (!audit) return notFound("Audit");
    const list = Array.isArray(fields(audit.customFields).participantInvites)
      ? fields(audit.customFields).participantInvites as AuditParticipantInvite[] : [];
    const index = list.findIndex((item) => item.id === participantId);
    if (index < 0) return notFound("Participant");
    const existing = list[index]!;
    const now = new Date().toISOString();
    const updated: AuditParticipantInvite = parsed.data.action === "resend"
      ? { ...existing, inviteCount: existing.inviteCount + 1, lastSentAt: now }
      : parsed.data.action === "support"
        ? {
            ...existing,
            status: "NEEDS_SUPPORT",
            statusBeforeSupport: existing.status === "NEEDS_SUPPORT"
              ? existing.statusBeforeSupport ?? "INVITED"
              : existing.status,
            supportNotes: parsed.data.supportNotes ?? "",
          }
        : { ...existing, status: existing.statusBeforeSupport ?? "INVITED", statusBeforeSupport: undefined, supportNotes: undefined };
    const next = [...list]; next[index] = updated;
    await db.audit.update({ where: { id: audit.id }, data: { customFields: { ...fields(audit.customFields), participantInvites: next } } });
    if (parsed.data.action === "resend") {
      const token = generateSurveyToken(audit.id);
      const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
      const surveyUrl = `${origin}/survey/${token}?participant=${encodeURIComponent(existing.id)}`;
      const sent = await sendAuditParticipantInvitation({ to: existing.email, name: existing.name, clientName: audit.client.name, auditName: audit.name, surveyUrl });
      if (!sent.ok) return badRequest("The invitation email could not be resent.");
    }
    return ok(updated);
  } catch (error) { return serverError(error); }
}
