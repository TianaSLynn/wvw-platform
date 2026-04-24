import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, serverError, badRequest } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const updateSchema = z.object({
  status: z.enum(["PENDING_AUTH", "ACTIVE", "ERROR", "INACTIVE"]).optional(),
  config: z.record(z.unknown()).optional(),
  accessToken:  z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().optional(),
  scopes: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) return badRequest("Admins only");
    const { id } = await params;

    const integration = await db.integration.findFirst({ where: { id, orgId: user.orgId } });
    if (!integration) return notFound("Integration");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { config, tokenExpiresAt, ...rest } = parsed.data;
    const updated = await db.integration.update({
      where: { id },
      data: {
        ...rest,
        ...(config !== undefined ? { config: config as Prisma.InputJsonValue } : {}),
        ...(tokenExpiresAt ? { tokenExpiresAt: new Date(tokenExpiresAt) } : {}),
      },
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: `integration.${parsed.data.status?.toLowerCase() ?? "updated"}`,
      entityType: "Integration", entityId: id,
      entityLabel: integration.name,
    });

    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) return badRequest("Admins only");
    const { id } = await params;

    const integration = await db.integration.findFirst({ where: { id, orgId: user.orgId } });
    if (!integration) return notFound("Integration");

    await db.integration.delete({ where: { id } });
    return noContent();
  } catch (e) { return serverError(e); }
}
