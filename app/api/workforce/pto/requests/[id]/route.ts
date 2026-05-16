/**
 * PATCH /api/workforce/pto/requests/[id]  — approve / deny / cancel
 */
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const { action, reviewNote } = body ?? {};

    if (!action || !["approve", "deny", "cancel"].includes(action)) {
      return badRequest("action must be approve | deny | cancel");
    }

    const request = await db.ptoRequest.findUnique({ where: { id }, include: { ptoType: true } });
    if (!request || request.orgId !== user.orgId) return notFound("Request");
    if (request.status !== "PENDING") return badRequest("Only PENDING requests can be actioned");

    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MANAGER";
    const isOwner = request.userId === user.id;

    if (action === "cancel" && !isOwner && !isAdmin) return forbidden("You can only cancel your own requests");
    if ((action === "approve" || action === "deny") && !isAdmin) return forbidden("Only managers can approve or deny requests");

    const newStatus = action === "approve" ? "APPROVED" : action === "deny" ? "DENIED" : "CANCELLED";
    const year      = new Date(request.startDate).getFullYear();

    await db.$transaction(async (tx) => {
      await tx.ptoRequest.update({
        where: { id },
        data: {
          status:       newStatus,
          reviewedById: (action !== "cancel") ? user.id : undefined,
          reviewNote:   reviewNote ?? null,
          reviewedAt:   (action !== "cancel") ? new Date() : undefined,
        },
      });

      // Balance reconciliation
      if (action === "approve") {
        // Move days from pending → used
        await tx.ptoBalance.upsert({
          where: { userId_ptoTypeId_year: { userId: request.userId, ptoTypeId: request.ptoTypeId, year } },
          create: { userId: request.userId, ptoTypeId: request.ptoTypeId, year, allocated: request.ptoType.defaultDays, used: request.days, pending: 0 },
          update: { pending: { decrement: request.days }, used: { increment: request.days } },
        });
      } else {
        // Denied or cancelled — release pending days
        await tx.ptoBalance.updateMany({
          where: { userId: request.userId, ptoTypeId: request.ptoTypeId, year },
          data:  { pending: { decrement: request.days } },
        });
      }
    });

    return ok({ id, status: newStatus });
  } catch (e) {
    return serverError(e);
  }
}
