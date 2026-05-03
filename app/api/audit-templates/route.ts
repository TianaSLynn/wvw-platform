import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  name:        z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  type:        z.enum(["INTERNAL", "EXTERNAL", "COMPLIANCE", "OPERATIONAL", "FINANCIAL", "IT", "HR", "RISK", "CUSTOM"]),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const template = await db.auditTemplate.create({
      data: {
        orgId:       user.orgId,
        name:        parsed.data.name,
        description: parsed.data.description ?? null,
        type:        parsed.data.type,
        isPublished: true,
        isGlobal:    false,
      },
    });

    return created(template);
  } catch (e) { return serverError(e); }
}
