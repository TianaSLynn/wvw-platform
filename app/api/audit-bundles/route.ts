import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  name:        z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  templateIds: z.array(z.string()).min(1, "At least one template required"),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const bundles = await db.auditBundle.findMany({
      where:   { orgId: user.orgId },
      include: {
        items: {
          include: { template: { select: { id: true, name: true, type: true, isActive: true } } },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { audits: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(bundles);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body   = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const bundle = await db.auditBundle.create({
      data: {
        orgId:       user.orgId,
        name:        parsed.data.name,
        description: parsed.data.description ?? null,
        items: {
          create: parsed.data.templateIds.map((templateId, i) => ({
            templateId,
            sortOrder: i,
          })),
        },
      },
      include: {
        items: {
          include: { template: { select: { id: true, name: true, type: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return created(bundle);
  } catch (e) { return serverError(e); }
}
