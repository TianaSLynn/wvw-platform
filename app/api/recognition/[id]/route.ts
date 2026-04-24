import { db } from "@/lib/db";
import { ok, unauthorized, notFound, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const rec = await db.recognition.findFirst({ where: { id, orgId: user.orgId } });
    if (!rec) return notFound();
    if (rec.fromUserId !== user.id && !["SUPER_ADMIN","ADMIN"].includes(user.role)) return unauthorized();
    await db.recognition.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
