/**
 * GET  /api/workforce/pto/balance?userId=&year=  — get balances for a user (or all users for admin)
 * PATCH /api/workforce/pto/balance               — adjust allocated days (SUPER_ADMIN only)
 */
import { ok, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const url    = new URL(req.url);
    const userId = url.searchParams.get("userId") ?? user.id;
    const year   = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()), 10);

    // Non-admins can only see their own balance
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
    if (!isAdmin && userId !== user.id) return forbidden("You can only view your own balance");

    // If admin requests all users (userId = "all")
    if (isAdmin && userId === "all") {
      const allUsers = await db.user.findMany({
        where: { orgId: user.orgId, deletedAt: null, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, title: true, department: true },
        orderBy: { firstName: "asc" },
      });

      const types = await db.ptoType.findMany({
        where: { orgId: user.orgId, isActive: true },
        orderBy: { sortOrder: "asc" },
      });

      const existingBalances = await db.ptoBalance.findMany({
        where: { user: { orgId: user.orgId }, year },
        include: { ptoType: { select: { id: true, name: true, code: true, color: true } } },
      });

      // Build a lookup: userId → typeId → balance
      const balanceMap = new Map<string, Map<string, typeof existingBalances[0]>>();
      for (const b of existingBalances) {
        if (!balanceMap.has(b.userId)) balanceMap.set(b.userId, new Map());
        balanceMap.get(b.userId)!.set(b.ptoTypeId, b);
      }

      const result = allUsers.map((u) => ({
        user: u,
        balances: types.map((t) => {
          const b = balanceMap.get(u.id)?.get(t.id);
          return {
            ptoTypeId:  t.id,
            ptoType:    { id: t.id, name: t.name, code: t.code, color: t.color },
            year,
            allocated:  b?.allocated  ?? t.defaultDays,
            used:       b?.used       ?? 0,
            pending:    b?.pending    ?? 0,
            carryover:  b?.carryover  ?? 0,
            remaining:  (b?.allocated ?? t.defaultDays) + (b?.carryover ?? 0) - (b?.used ?? 0) - (b?.pending ?? 0),
            balanceId:  b?.id ?? null,
          };
        }),
      }));

      return ok(result);
    }

    // Single user
    const types = await db.ptoType.findMany({
      where: { orgId: user.orgId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const balances = await db.ptoBalance.findMany({
      where: { userId, year },
      include: { ptoType: { select: { id: true, name: true, code: true, color: true, icon: true } } },
    });

    const balanceMap = new Map(balances.map((b) => [b.ptoTypeId, b]));

    const result = types.map((t) => {
      const b = balanceMap.get(t.id);
      return {
        ptoTypeId:  t.id,
        ptoType:    { id: t.id, name: t.name, code: t.code, color: t.color, icon: t.icon },
        year,
        allocated:  b?.allocated  ?? t.defaultDays,
        used:       b?.used       ?? 0,
        pending:    b?.pending    ?? 0,
        carryover:  b?.carryover  ?? 0,
        remaining:  (b?.allocated ?? t.defaultDays) + (b?.carryover ?? 0) - (b?.used ?? 0) - (b?.pending ?? 0),
        balanceId:  b?.id ?? null,
      };
    });

    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (user.role !== "SUPER_ADMIN") return forbidden("Only SUPER_ADMIN can adjust PTO balances");

    const body = await req.json().catch(() => null);
    const { userId, ptoTypeId, year, allocated, carryover } = body ?? {};
    if (!userId || !ptoTypeId || !year) return badRequest("userId, ptoTypeId, and year are required");

    const balance = await db.ptoBalance.upsert({
      where: { userId_ptoTypeId_year: { userId, ptoTypeId, year } },
      create: { userId, ptoTypeId, year, allocated: allocated ?? 0, carryover: carryover ?? 0 },
      update: {
        ...(allocated   !== undefined && { allocated }),
        ...(carryover   !== undefined && { carryover }),
      },
      include: { ptoType: { select: { name: true, code: true } } },
    });

    return ok(balance);
  } catch (e) {
    return serverError(e);
  }
}
