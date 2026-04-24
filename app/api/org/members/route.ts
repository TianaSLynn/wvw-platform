import { db } from "@/lib/db";
import { ok, unauthorized, serverError, badRequest, notFound } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  userId: z.string(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "PARTNER", "MANAGER", "CONSULTANT", "AUDITOR", "CLIENT_ADMIN", "CLIENT_USER"]),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const members = await db.user.findMany({
      where: { orgId: user.orgId, deletedAt: null },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, title: true, avatarUrl: true, createdAt: true,
        _count: { select: { timeEntries: true } },
      },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
    });
    return ok(members);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return badRequest("Only admins can change member roles");
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const target = await db.user.findFirst({ where: { id: parsed.data.userId, orgId: user.orgId } });
    if (!target) return notFound("User");

    // Prevent demoting self
    if (target.id === user.id) return badRequest("You cannot change your own role");

    const updated = await db.user.update({
      where: { id: parsed.data.userId },
      data: { role: parsed.data.role },
    });
    return ok(updated);
  } catch (e) { return serverError(e); }
}
