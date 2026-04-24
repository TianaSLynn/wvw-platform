import { ok, unauthorized, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;

  // Only SUPER_ADMIN / ADMIN can edit others; anyone can edit themselves
  const isSelf = user.id === id;
  const canEdit = isSelf || user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  if (!canEdit) return unauthorized();

  // Confirm target user belongs to same org
  const target = await db.user.findFirst({ where: { id, orgId: user.orgId } });
  if (!target) return badRequest("User not found");

  const body = await req.json() as Record<string, unknown>;

  // Fields any user can update on themselves
  const selfFields = ["firstName", "lastName", "email", "phone", "bio", "avatarUrl"];
  // Admin-only fields
  const adminFields = ["title", "department", "role", "billableRate", "targetUtilization", "status"];

  const allowed = isSelf ? selfFields : [...selfFields, ...adminFields];
  const data: Record<string, unknown> = {};
  for (const field of allowed) {
    if (field in body) data[field] = body[field];
  }

  if (Object.keys(data).length === 0) return badRequest("No valid fields to update");

  try {
    const updated = await db.user.update({ where: { id }, data });
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
