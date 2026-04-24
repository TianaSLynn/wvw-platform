import { db } from "@/lib/db";
import { ok, unauthorized, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createSchema = z.object({
  name:   z.string().min(1),
  slug:   z.string().min(1),
  config: z.record(z.unknown()).optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const integrations = await db.integration.findMany({
      where: { orgId: user.orgId },
      orderBy: { name: "asc" },
    });
    return ok(integrations);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return badRequest("Only admins can manage integrations");
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const integration = await db.integration.upsert({
      where: { orgId_slug: { orgId: user.orgId, slug: parsed.data.slug } },
      create: {
        orgId: user.orgId,
        name: parsed.data.name,
        slug: parsed.data.slug,
        config: (parsed.data.config ?? {}) as Prisma.InputJsonValue,
        status: "PENDING_AUTH",
      },
      update: {
        config: (parsed.data.config ?? {}) as Prisma.InputJsonValue,
        status: "PENDING_AUTH",
      },
    });
    return ok(integration);
  } catch (e) { return serverError(e); }
}
