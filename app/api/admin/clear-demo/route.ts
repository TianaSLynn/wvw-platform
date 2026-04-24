/**
 * Admin: Clear demo / placeholder data
 * Deletes all employees and soft-deletes all clients for the org.
 * Requires ADMIN or SUPER_ADMIN role.
 */
import { db } from "@/lib/db";
import { ok, unauthorized, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  target: z.enum(["employees", "clients", "both"]),
  confirm: z.literal(true),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    // Only ADMIN or SUPER_ADMIN can bulk delete
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return unauthorized();
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid request", parsed.error.flatten());

    const { target } = parsed.data;
    const results: Record<string, number> = {};

    if (target === "employees" || target === "both") {
      const deleted = await db.employee.deleteMany({ where: { orgId: user.orgId } });
      results.employees = deleted.count;
    }

    if (target === "clients" || target === "both") {
      const deleted = await db.client.updateMany({
        where: { orgId: user.orgId },
        data: { deletedAt: new Date(), isActive: false },
      });
      results.clients = deleted.count;
    }

    return ok({ deleted: results });
  } catch (e) { return serverError(e); }
}
