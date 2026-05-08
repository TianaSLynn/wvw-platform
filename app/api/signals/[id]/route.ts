import { db } from "@/lib/db";
import { ok, unauthorized, notFound, badRequest, serverError, forbidden
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  title:          z.string().min(1).optional(),
  summary:        z.string().optional(),
  actionRequired: z.string().optional(),
  severity:       z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).optional(),
  isActive:       z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const existing = await db.externalSignal.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound();

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
    const updated = await db.externalSignal.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "PARTNER", "MANAGER"].includes(user.role)) return forbidden("Insufficient permissions");
    const { id } = await params;
    await db.externalSignal.update({ where: { id, orgId: user.orgId }, data: { isActive: false } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
