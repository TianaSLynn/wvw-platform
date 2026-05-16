/**
 * GET  /api/workforce/pto/types  — list org PTO types
 * POST /api/workforce/pto/types  — create PTO type (SUPER_ADMIN only)
 * PUT  /api/workforce/pto/types  — update PTO type (SUPER_ADMIN only)
 */
import { ok, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const WVW_DEFAULT_TYPES = [
  { name: "Vacation",           code: "VAC",  color: "#3B82F6", icon: "🌴", defaultDays: 15, requiresApproval: true,  isPaid: true,  sortOrder: 0, description: "Annual vacation and leisure time" },
  { name: "Sick Leave",         code: "SICK", color: "#EF4444", icon: "🤒", defaultDays: 10, requiresApproval: false, isPaid: true,  sortOrder: 1, description: "Illness and medical appointments" },
  { name: "Personal Day",       code: "PER",  color: "#8B5CF6", icon: "⭐", defaultDays: 3,  requiresApproval: true,  isPaid: true,  sortOrder: 2, description: "Personal errands and flex time" },
  { name: "Mental Health Day",  code: "MHD",  color: "#10B981", icon: "🧘", defaultDays: 5,  requiresApproval: false, isPaid: true,  sortOrder: 3, description: "WVW wellness benefit — no questions asked" },
  { name: "Bereavement",        code: "BRV",  color: "#6B7280", icon: "🕊️", defaultDays: 5,  requiresApproval: false, isPaid: true,  sortOrder: 4, description: "Loss of an immediate family member" },
  { name: "Birthday Leave",     code: "BDAY", color: "#F59E0B", icon: "🎂", defaultDays: 1,  requiresApproval: false, isPaid: true,  sortOrder: 5, description: "WVW perk — celebrate your birthday" },
  { name: "Volunteer / Service",code: "VOL",  color: "#059669", icon: "🤝", defaultDays: 2,  requiresApproval: true,  isPaid: true,  sortOrder: 6, description: "Community service and volunteer work" },
  { name: "Jury Duty",          code: "JURY", color: "#374151", icon: "⚖️", defaultDays: 0,  requiresApproval: false, isPaid: true,  sortOrder: 7, description: "Legal obligation — unlimited as needed", maxCarryover: null },
  { name: "Floating Holiday",   code: "FLOAT",color: "#C9A84C", icon: "🌟", defaultDays: 2,  requiresApproval: true,  isPaid: true,  sortOrder: 8, description: "Flexible holiday for cultural observances", maxCarryover: 0 },
  { name: "Parental Leave",     code: "PAR",  color: "#EC4899", icon: "👶", defaultDays: 60, requiresApproval: true,  isPaid: true,  sortOrder: 9, description: "New child — birth, adoption, or foster" },
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const types = await db.ptoType.findMany({
    where: { orgId: user.orgId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return ok(types);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return forbidden("Only SUPER_ADMIN can manage PTO types");

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid JSON");

  // Seed WVW defaults if body.seedDefaults = true
  if (body.seedDefaults) {
    const existing = await db.ptoType.findMany({ where: { orgId: user.orgId }, select: { code: true } });
    const existingCodes = new Set(existing.map((t) => t.code));
    const toCreate = WVW_DEFAULT_TYPES.filter((t) => !existingCodes.has(t.code));
    if (toCreate.length > 0) {
      await db.ptoType.createMany({
        data: toCreate.map((t) => ({ ...t, orgId: user.orgId })),
      });
    }
    return ok({ seeded: toCreate.length });
  }

  const { name, code, color, icon, defaultDays, maxCarryover, requiresApproval, isPaid, description, sortOrder } = body;
  if (!name || !code) return badRequest("name and code are required");

  const ptoType = await db.ptoType.create({
    data: {
      orgId: user.orgId, name, code: code.toUpperCase(),
      color: color ?? "#6B8F71", icon, defaultDays: defaultDays ?? 0,
      maxCarryover: maxCarryover ?? null, requiresApproval: requiresApproval ?? true,
      isPaid: isPaid ?? true, description, sortOrder: sortOrder ?? 0,
    },
  });

  return ok(ptoType);
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "SUPER_ADMIN") return forbidden("Only SUPER_ADMIN can manage PTO types");

  const body = await req.json().catch(() => null);
  if (!body?.id) return badRequest("id is required");

  const ptoType = await db.ptoType.update({
    where: { id: body.id },
    data: {
      name:             body.name,
      color:            body.color,
      icon:             body.icon,
      defaultDays:      body.defaultDays,
      maxCarryover:     body.maxCarryover,
      requiresApproval: body.requiresApproval,
      isPaid:           body.isPaid,
      description:      body.description,
      isActive:         body.isActive,
      sortOrder:        body.sortOrder,
    },
  });

  return ok(ptoType);
}
