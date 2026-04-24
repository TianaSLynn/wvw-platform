import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MessagingClient } from "./MessagingClient";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser();

  // Load initial threads + org users (for starting new conversations)
  const [threads, orgUsers] = await Promise.all([
    db.messageThread.findMany({
      where: { orgId: user.orgId, participantIds: { has: user.id } },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
    }),
    db.user.findMany({
      where:   { orgId: user.orgId, deletedAt: null, id: { not: user.id } },
      select:  { id: true, firstName: true, lastName: true, avatarUrl: true, title: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  // Enrich threads with participant details
  const allParticipantIds = [...new Set(threads.flatMap(t => t.participantIds))];
  const participantUsers = await db.user.findMany({
    where:  { id: { in: allParticipantIds } },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  });
  const participantMap = Object.fromEntries(participantUsers.map(p => [p.id, p]));

  const enrichedThreads = threads.map(t => ({
    ...t,
    participants:  t.participantIds.map(id => participantMap[id]).filter((p): p is NonNullable<typeof p> => p != null),
    lastMessage:   t.messages[0] ?? null,
    lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
    unreadCount:   t.messages.filter(m => !m.readBy.includes(user.id)).length,
  }));

  return (
    <MessagingClient
      initialThreads={enrichedThreads}
      orgUsers={orgUsers}
      currentUserId={user.id}
      currentUserName={`${user.firstName} ${user.lastName}`}
    />
  );
}
