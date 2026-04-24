import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return <AppShell user={user} unreadCount={unreadCount}>{children}</AppShell>;
}
