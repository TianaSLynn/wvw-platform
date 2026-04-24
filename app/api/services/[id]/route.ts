import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const SERVICE_CATEGORIES = ["AUDIT","TRAINING","CONSULTING","COACHING","ASSESSMENT","WORKSHOP","RETAINER","OTHER"] as const;

const updateSchema = z.object({
  name:         z.string().min(1).optional(),
  category:     z.enum(SERVICE_CATEGORIES).optional(),
  description:  z.string().optional(),
  deliverables: z.string().nullable().optional(),
  duration:     z.string().nullable().optional(),
  format:       z.string().nullable().optional(),
  audience:     z.string().nullable().optional(),
  priceMin:     z.number().nullable().optional(),
  priceMax:     z.number().nullable().optional(),
  priceUnit:    z.string().nullable().optional(),
  isActive:     z.boolean().optional(),
  isFeatured:   z.boolean().optional(),
  tags:         z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.serviceOffering.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Service");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const updated = await db.serviceOffering.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.serviceOffering.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Service");

    await db.serviceOffering.delete({ where: { id } });
    return noContent();
  } catch (e) { return serverError(e); }
}
