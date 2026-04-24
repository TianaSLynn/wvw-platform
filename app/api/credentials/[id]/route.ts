import { db } from "@/lib/db";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  status:    z.enum(["ACTIVE","EXPIRED","REVOKED"]).optional(),
  expiresAt: z.string().nullable().optional(),
  notes:     z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN","ADMIN"].includes(user.role)) return unauthorized();
    const { id } = await params;

    const existing = await db.issuedCredential.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound();

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { expiresAt, ...rest } = parsed.data;
    const updated = await db.issuedCredential.update({
      where: { id },
      data: {
        ...rest,
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      },
    });
    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN","ADMIN"].includes(user.role)) return unauthorized();
    const { id } = await params;
    await db.issuedCredential.delete({ where: { id, orgId: user.orgId } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
