import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";

// Every route in this group requires a live session (requireUser() runs a
// per-request Clerk check), so there's nothing to statically prerender here.
// Without this, Next.js still attempts to build a static shell at build time,
// which fails wherever Clerk's publishable key isn't available in that
// build environment (e.g. Missing publishableKey during `next build`).
export const dynamic = "force-dynamic";

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
