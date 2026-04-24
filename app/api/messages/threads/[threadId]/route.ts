/**
 * GET   /api/messages/threads/[threadId]  — load thread messages (paginated)
 * POST  /api/messages/threads/[threadId]  — send a new message
 * PATCH /api/messages/threads/[threadId]  — mark thread as read
 */
import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, notFound, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

async function getThread(threadId: string, orgId: string, userId: string) {
  return db.messageThread.findFirst({
    where: { id: threadId, orgId, participantIds: { has: userId } },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { threadId } = await params;
    const thread = await getThread(threadId, user.orgId, user.id);
    if (!thread) return notFound("Thread not found");

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

    const messages = await db.message.findMany({
      where:   { threadId },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take:    limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    // Mark messages as read (append userId to readBy array if not already present)
    await db.$executeRaw`
      UPDATE "Message"
      SET "readBy" = array_append("readBy", ${user.id})
      WHERE "threadId" = ${threadId}
        AND NOT (${user.id} = ANY("readBy"))
    `;

    // Enrich with participant details
    const participantUsers = await db.user.findMany({
      where:  { id: { in: thread.participantIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true, title: true },
    });

    return ok({
      thread:       { ...thread, participants: participantUsers },
      messages:     messages.reverse(),
      hasMore,
      nextCursor:   hasMore ? messages[0]?.id : null,
    });
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { threadId } = await params;
    const thread = await getThread(threadId, user.orgId, user.id);
    if (!thread) return notFound("Thread not found");

    const body = await req.json() as { body?: string };
    if (!body.body?.trim()) return badRequest("Message body is required");

    const [message] = await db.$transaction([
      db.message.create({
        data: {
          orgId:    user.orgId,
          threadId,
          senderId: user.id,
          body:     body.body.trim(),
          readBy:   [user.id],
        },
        include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      }),
      db.messageThread.update({
        where: { id: threadId },
        data:  { lastMessageAt: new Date() },
      }),
    ]);

    return created(message);
  } catch (e) { return serverError(e); }
}
