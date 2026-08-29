import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, created, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { generateSurveyToken } from "@/lib/survey-token";
import { sendAuditParticipantInvitation } from "@/lib/email";

export type AuditParticipantInvite = {
  id: string;
  name: string;
  email: string;
  group: string;
  status: "READY" | "INVITED" | "OPENED" | "SUBMITTED" | "NEEDS_SUPPORT";
  inviteCount: number;
  sentAt: string;
  lastSentAt: string;
  supportNotes?: string;
  statusBeforeSupport?: "READY" | "INVITED" | "OPENED" | "SUBMITTED";
};

const addSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  group: z.string().max(100).default("Workforce"),
  sendNow: z.boolean().default(true),
});

function fields(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function participants(value: unknown): AuditParticipantInvite[] {
  const list = fields(value).participantInvites;
  return Array.isArray(list) ? list as AuditParticipantInvite[] : [];
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const audit = await db.audit.findFirst({ where: { id, orgId: user.orgId }, select: { customFields: true } });
    if (!audit) return notFound("Audit");
    return ok({ participants: participants(audit.customFields) });
  } catch (error) { return serverError(error); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const parsed = addSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const audit = await db.audit.findFirst({
      where: { id, orgId: user.orgId },
      select: { id: true, name: true, customFields: true, client: { select: { name: true } } },
    });
    if (!audit) return notFound("Audit");

    const current = participants(audit.customFields);
    if (current.some((item) => item.email.toLowerCase() === parsed.data.email.toLowerCase())) {
      return badRequest("This participant is already assigned to the audit.");
    }

    const now = new Date().toISOString();
    const participant: AuditParticipantInvite = {
      id: randomUUID(),
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      group: parsed.data.group,
      status: "READY",
      inviteCount: 0,
      sentAt: "",
      lastSentAt: "",
    };
    const token = generateSurveyToken(audit.id);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const surveyUrl = `${origin}/survey/${token}?participant=${encodeURIComponent(participant.id)}`;

    let savedParticipant = participant;
    if (parsed.data.sendNow) {
      const sent = await sendAuditParticipantInvitation({
        to: participant.email,
        name: participant.name,
        clientName: audit.client.name,
        auditName: audit.name,
        surveyUrl,
      });
      if (!sent.ok) return badRequest("The invitation email could not be sent. The participant was not added; try again or add them without sending.");
      savedParticipant = {
        ...participant,
        status: "INVITED",
        inviteCount: 1,
        sentAt: now,
        lastSentAt: now,
      };
    }

    await db.audit.update({
      where: { id: audit.id },
      data: { customFields: { ...fields(audit.customFields), participantInvites: [...current, savedParticipant] } },
    });

    return created({ participant: savedParticipant, surveyUrl });
  } catch (error) { return serverError(error); }
}
