/**
 * GET  /api/messages/threads  — list threads the current user participates in
 * POST /api/messages/threads  — create a new thread (DM or group)
 */
import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  participantIds: z.array(z.string().cuid()).min(1),
  title:          z.string().optional(),
  isGroup:        z.boolean().default(false),
  clientId:       z.string().cuid().optional().or(z.literal("")).transform(v => v || undefined),
  auditId:        z.string().cuid().optional().or(z.literal("")).transform(v => v || undefined),
  firstMessage:   z.string().min(1).optional(),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const threads = await db.messageThread.findMany({
      where: {
        orgId: user.orgId,
        participantIds: { has: user.id },
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
        client: { select: { id: true, name: true } },
        audit:  { select: { id: true, name: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
    });

    // Enrich with participant details
    const allParticipantIds = [...new Set(threads.flatMap(t => t.participantIds))];
    const participants = await db.user.findMany({
      where: { id: { in: allParticipantIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true, title: true },
    });
    const participantMap = Object.fromEntries(participants.map(p => [p.id, p]));

    const enriched = threads.map(thread => ({
      ...thread,
      participants: thread.participantIds.map(id => participantMap[id]).filter(Boolean),
      lastMessage: thread.messages[0] ?? null,
      unreadCount: thread.messages.filter(m => !m.readBy.includes(user.id)).length,
    }));

    return ok(enriched);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { participantIds, title, isGroup, clientId, auditId, firstMessage } = parsed.data;

    // Always include the creator in participants
    const allParticipants = [...new Set([user.id, ...participantIds])];

    // For DMs: check if a thread already exists between these exact two users
    if (!isGroup && allParticipants.length === 2) {
      const existing = await db.messageThread.findFirst({
        where: {
          orgId:    user.orgId,
          isGroup:  false,
          participantIds: { hasEvery: allParticipants },
        },
      });
      if (existing) return ok(existing);
    }

    const thread = await db.messageThread.create({
      data: {
        orgId:          user.orgId,
        title:          title ?? null,
        isGroup,
        participantIds: allParticipants,
        clientId:       clientId ?? null,
        auditId:        auditId  ?? null,
        createdById:    user.id,
        lastMessageAt:  firstMessage ? new Date() : null,
        messages: firstMessage ? {
          create: {
            orgId:    user.orgId,
            senderId: user.id,
            body:     firstMessage,
            readBy:   [user.id],
          },
        } : undefined,
      },
    });

    return created(thread);
  } catch (e) { return serverError(e); }
}
