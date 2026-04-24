import { db } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const take = parseInt(searchParams.get("take") ?? "50", 10);

    const notifications = await db.notification.findMany({
      where: { userId: user.id, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" },
      take,
    });

    const unreadCount = await db.notification.count({ where: { userId: user.id, isRead: false } });

    return ok({ notifications, unreadCount });
  } catch (e) { return serverError(e); }
}

// Mark all as read
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json() as { markAllRead?: boolean; ids?: string[] };

    if (body.markAllRead) {
      await db.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } else if (body.ids?.length) {
      await db.notification.updateMany({
        where: { userId: user.id, id: { in: body.ids } },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return ok({ success: true });
  } catch (e) { return serverError(e); }
}
