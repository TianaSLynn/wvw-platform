import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  name:        z.string().min(1),
  code:        z.string().optional(),
  track:       z.string().optional(),
  description: z.string().optional(),
  status:      z.enum(["UPCOMING","ACTIVE","COMPLETED","PAUSED"]).default("UPCOMING"),
  startDate:   z.string().optional(),
  endDate:     z.string().optional(),
  capacity:    z.number().int().positive().optional(),
  courseIds:   z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const cohorts = await db.cohort.findMany({
      where: { orgId: user.orgId },
      include: {
        _count: { select: { members: true } },
        members: { where: { status: "COMPLETED" }, select: { id: true } },
      },
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
    });
    return ok(cohorts);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN","ADMIN"].includes(user.role)) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { startDate, endDate, ...rest } = parsed.data;
    const cohort = await db.cohort.create({
      data: {
        ...rest,
        orgId: user.orgId,
        startDate: startDate ? new Date(startDate) : null,
        endDate:   endDate   ? new Date(endDate)   : null,
      },
      include: { _count: { select: { members: true } } },
    });
    return created(cohort);
  } catch (e) { return serverError(e); }
}
