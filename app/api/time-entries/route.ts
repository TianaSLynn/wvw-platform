import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { timeEntrySchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const userId    = searchParams.get("userId") ?? user.id;
    const from      = searchParams.get("from");
    const to        = searchParams.get("to");
    const status    = searchParams.get("status");

    const entries = await db.timeEntry.findMany({
      where: {
        orgId: user.orgId,
        // Admins/managers can view all; others only own
        userId: ["ADMIN","SUPER_ADMIN","MANAGER","PARTNER"].includes(user.role)
          ? (userId !== "all" ? userId : undefined)
          : user.id,
        ...(projectId ? { projectId } : {}),
        ...(status ? { status: status as never } : {}),
        ...(from || to ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to   ? { lte: new Date(to)   } : {}),
          },
        } : {}),
      },
      include: {
        user:    { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
        task:    { select: { id: true, title: true } },
      },
      orderBy: { date: "desc" },
    });

    return ok(entries);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = timeEntrySchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    // Get billable rate for this project/user
    let billableRate = user.billableRate ?? 0;
    if (parsed.data.projectId) {
      const member = await db.projectMember.findFirst({
        where: { projectId: parsed.data.projectId, userId: user.id },
      });
      if (member?.billableRate) billableRate = member.billableRate;
    }

    const entry = await db.timeEntry.create({
      data: {
        ...parsed.data,
        orgId: user.orgId,
        userId: user.id,
        billableRate: parsed.data.isBillable ? billableRate : 0,
        amount: parsed.data.isBillable ? parsed.data.hours * billableRate : 0,
        status: "DRAFT",
        date: new Date(parsed.data.date),
      },
    });

    return created(entry);
  } catch (e) { return serverError(e); }
}
