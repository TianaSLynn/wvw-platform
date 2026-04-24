import { db } from "@/lib/db";
import { ok, unauthorized, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const orgSchema = z.object({
  name:            z.string().min(1).optional(),
  website:         z.string().url().optional().or(z.literal("")),
  industry:        z.string().optional(),
  timezone:        z.string().optional(),
  currency:        z.string().length(3).optional(),
  fiscalYearStart: z.coerce.number().min(1).max(12).optional(),
  settings:        z.record(z.unknown()).optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const org = await db.organization.findUnique({
      where: { id: user.orgId },
      include: { _count: { select: { users: true, clients: true, audits: true } } },
    });
    return ok(org);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return badRequest("Only admins can update org settings");
    }

    const body = await req.json();
    const parsed = orgSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { settings, ...rest } = parsed.data;
    const updated = await db.organization.update({
      where: { id: user.orgId },
      data: {
        ...rest,
        ...(settings !== undefined ? { settings: settings as Prisma.InputJsonValue } : {}),
      },
    });
    return ok(updated);
  } catch (e) { return serverError(e); }
}
