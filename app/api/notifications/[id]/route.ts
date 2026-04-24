import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const n = await db.notification.findFirst({ where: { id, userId: user.id } });
    if (!n) return notFound("Notification");

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const n = await db.notification.findFirst({ where: { id, userId: user.id } });
    if (!n) return notFound("Notification");

    await db.notification.delete({ where: { id } });
    return noContent();
  } catch (e) { return serverError(e); }
}
