import { db } from "@/lib/db";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
  quarter: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { goalId } = await params;

    const existing = await db.employeeGoal.findFirst({ where: { id: goalId, orgId: user.orgId } });
    if (!existing) return notFound("Goal not found");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const goal = await db.employeeGoal.update({
      where: { id: goalId },
      data: parsed.data,
      include: { keyResults: true },
    });

    return ok(goal);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { goalId } = await params;

    const existing = await db.employeeGoal.findFirst({ where: { id: goalId, orgId: user.orgId } });
    if (!existing) return notFound("Goal not found");

    await db.employeeGoal.update({
      where: { id: goalId },
      data: { status: "ARCHIVED" },
    });

    return ok({ archived: true });
  } catch (e) { return serverError(e); }
}
