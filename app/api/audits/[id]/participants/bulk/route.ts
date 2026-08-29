import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { created, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import type { AuditParticipantInvite } from "../route";

const schema = z.object({
  participants: z.array(z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    group: z.string().max(100).default("Workforce"),
  })).min(1).max(500),
});
const fields = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value)
  ? value as Record<string, unknown> : {};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Check the participant names and email addresses.", parsed.error.flatten());
    const audit = await db.audit.findFirst({ where: { id, orgId: user.orgId }, select: { id: true, customFields: true } });
    if (!audit) return notFound("Audit");
    const customFields = fields(audit.customFields);
    const existing = Array.isArray(customFields.participantInvites)
      ? customFields.participantInvites as AuditParticipantInvite[] : [];
    const existingEmails = new Set(existing.map((item) => item.email.toLowerCase()));
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const added: AuditParticipantInvite[] = [];
    for (const input of parsed.data.participants) {
      const email = input.email.toLowerCase();
      if (existingEmails.has(email) || seen.has(email)) { duplicates.push(email); continue; }
      seen.add(email);
      added.push({ id: randomUUID(), name: input.name, email, group: input.group, status: "READY", inviteCount: 0, sentAt: "", lastSentAt: "" });
    }
    if (!added.length) return badRequest("Every email address in this list is already assigned to the audit.");
    await db.audit.update({ where: { id: audit.id }, data: { customFields: { ...customFields, participantInvites: [...existing, ...added] } } });
    return created({ added, duplicates, totalAssigned: existing.length + added.length });
  } catch (error) { return serverError(error); }
}
