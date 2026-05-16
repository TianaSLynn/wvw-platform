import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to   = url.searchParams.get("to");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startFilter = from ? new Date(from) : today;
    const endFilter   = to   ? new Date(to)   : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

    const records = await db.availability.findMany({
      where: {
        user: { orgId: user.orgId, deletedAt: null },
        type: { in: ["pto", "holiday"] },
        endDate:   { gte: startFilter },
        startDate: { lte: endFilter },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, title: true, department: true } },
      },
      orderBy: { startDate: "asc" },
    });

    // Compute days for each record
    const data = records.map((r) => {
      const msPerDay = 24 * 60 * 60 * 1000;
      const days = Math.round((r.endDate.getTime() - r.startDate.getTime()) / msPerDay) + 1;
      return {
        id: r.id,
        userId: r.userId,
        userName: `${r.user.firstName} ${r.user.lastName}`,
        title: r.user.title,
        department: r.user.department,
        startDate: r.startDate,
        endDate: r.endDate,
        days,
        type: r.type,
        note: r.note,
      };
    });

    // Users with NO upcoming PTO (potential use-or-lose risk)
    const usersWithPto = new Set(data.filter((r) => r.type === "pto").map((r) => r.userId));
    const allOrgUsers = await db.user.findMany({
      where: { orgId: user.orgId, deletedAt: null, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, title: true, department: true },
      orderBy: { firstName: "asc" },
    });
    const noUpcomingPto = allOrgUsers.filter((u) => !usersWithPto.has(u.id));

    return ok({ records: data, noUpcomingPto });
  } catch (e) {
    return serverError(e);
  }
}
