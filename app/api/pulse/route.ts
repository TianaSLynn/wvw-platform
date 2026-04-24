import { ok, badRequest, unauthorized, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json() as { responses?: { question: string; rating: number }[] };
    const { responses } = body;

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return badRequest("responses array is required");
    }

    for (const r of responses) {
      if (typeof r.question !== "string" || typeof r.rating !== "number" || r.rating < 1 || r.rating > 5) {
        return badRequest("Each response must have a question string and rating 1–5");
      }
    }

    await db.activityLog.create({
      data: {
        orgId:      user.orgId,
        userId:     user.id,
        action:     "pulse.submitted",
        entityType: "PulseResponse",
        entityId:   user.id,
        entityLabel: `Pulse by ${user.firstName} ${user.lastName}`,
        metadata:   responses as unknown as Prisma.InputJsonValue,
      },
    });

    return ok({ submitted: true });
  } catch (e) {
    console.error(e);
    return serverError("Failed to save pulse response");
  }
}
