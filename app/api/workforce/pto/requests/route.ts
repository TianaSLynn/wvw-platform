/**
 * GET  /api/workforce/pto/requests  — list requests (admin sees all; user sees own)
 * POST /api/workforce/pto/requests  — submit a PTO request
 */
import { ok, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export async function GET(req: Request) {
  try {
    const user   = await getCurrentUser();
    if (!user) return unauthorized();

    const url    = new URL(req.url);
    const status = url.searchParams.get("status");
    const userId = url.searchParams.get("userId");
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MANAGER";

    const where: Record<string, unknown> = { orgId: user.orgId };
    if (!isAdmin) where.userId = user.id;
    else if (userId) where.userId = userId;
    if (status) where.status = status;

    const requests = await db.ptoRequest.findMany({
      where,
      include: {
        user:    { select: { id: true, firstName: true, lastName: true, title: true, department: true } },
        ptoType: { select: { id: true, name: true, code: true, color: true, icon: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(requests);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json().catch(() => null);
    const { ptoTypeId, startDate, endDate, note } = body ?? {};
    if (!ptoTypeId || !startDate || !endDate) return badRequest("ptoTypeId, startDate, and endDate are required");

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (end < start) return badRequest("endDate must be on or after startDate");

    const ptoType = await db.ptoType.findFirst({ where: { id: ptoTypeId, orgId: user.orgId } });
    if (!ptoType) return badRequest("PTO type not found");

    const days = countBusinessDays(start, end);
    if (days === 0) return badRequest("No business days in the selected range");

    const year = start.getFullYear();

    // Check balance (skip check for Jury Duty / types with unlimited)
    if (ptoType.maxCarryover !== null || ptoType.code !== "JURY") {
      const balance = await db.ptoBalance.findUnique({
        where: { userId_ptoTypeId_year: { userId: user.id, ptoTypeId, year } },
      });
      const allocated = balance?.allocated  ?? ptoType.defaultDays;
      const carryover = balance?.carryover  ?? 0;
      const used      = balance?.used       ?? 0;
      const pending   = balance?.pending    ?? 0;
      const remaining = allocated + carryover - used - pending;
      if (days > remaining) return badRequest(`Insufficient balance. You have ${remaining} day(s) available.`);
    }

    // Create request + update pending balance in a transaction
    const request = await db.$transaction(async (tx) => {
      const req = await tx.ptoRequest.create({
        data: {
          orgId: user.orgId, userId: user.id, ptoTypeId,
          startDate: start, endDate: end, days,
          note: note ?? null,
          status: ptoType.requiresApproval ? "PENDING" : "APPROVED",
        },
        include: {
          ptoType: { select: { id: true, name: true, code: true, color: true, icon: true } },
        },
      });

      // If auto-approved (no approval required), mark used; otherwise mark pending
      if (!ptoType.requiresApproval) {
        await tx.ptoBalance.upsert({
          where: { userId_ptoTypeId_year: { userId: user.id, ptoTypeId, year } },
          create: { userId: user.id, ptoTypeId, year, allocated: ptoType.defaultDays, used: days },
          update: { used: { increment: days } },
        });
      } else {
        await tx.ptoBalance.upsert({
          where: { userId_ptoTypeId_year: { userId: user.id, ptoTypeId, year } },
          create: { userId: user.id, ptoTypeId, year, allocated: ptoType.defaultDays, pending: days },
          update: { pending: { increment: days } },
        });
      }

      return req;
    });

    return ok(request);
  } catch (e) {
    return serverError(e);
  }
}
