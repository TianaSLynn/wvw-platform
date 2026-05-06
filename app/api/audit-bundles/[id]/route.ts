import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, notFound, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  name:        z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  isActive:    z.boolean().optional(),
  templateIds: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const bundle = await db.auditBundle.findFirst({ where: { id, orgId: user.orgId } });
    if (!bundle) return notFound("Bundle not found");

    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const updated = await db.auditBundle.update({
      where: { id },
      data: {
        ...(parsed.data.name        !== undefined ? { name: parsed.data.name }               : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.isActive    !== undefined ? { isActive: parsed.data.isActive }       : {}),
        ...(parsed.data.templateIds ? {
          items: {
            deleteMany: {},
            create: parsed.data.templateIds.map((templateId, i) => ({ templateId, sortOrder: i })),
          },
        } : {}),
      },
      include: {
        items: {
          include: { template: { select: { id: true, name: true, type: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const bundle = await db.auditBundle.findFirst({ where: { id, orgId: user.orgId } });
    if (!bundle) return notFound("Bundle not found");

    await db.auditBundle.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
