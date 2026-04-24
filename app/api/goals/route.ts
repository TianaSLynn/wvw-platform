import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const goalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  owner: z.string().optional(),
  quarter: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  keyResults: z.array(z.object({
    title: z.string().min(1),
    current: z.string().optional(),
    target: z.string(),
    progress: z.number().int().min(0).max(100).optional(),
  })).optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const goals = await db.employeeGoal.findMany({
      where: { orgId: user.orgId, status: { not: "ARCHIVED" } },
      include: { keyResults: true },
      orderBy: [{ status: "asc" }, { quarter: "desc" }, { createdAt: "desc" }],
    });

    return ok(goals);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = goalSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { keyResults, ...rest } = parsed.data;

    const goal = await db.employeeGoal.create({
      data: {
        ...rest,
        orgId: user.orgId,
        keyResults: keyResults?.length
          ? { create: keyResults.map((kr) => ({ ...kr, progress: kr.progress ?? 0 })) }
          : undefined,
      },
      include: { keyResults: true },
    });

    return created(goal);
  } catch (e) { return serverError(e); }
}
