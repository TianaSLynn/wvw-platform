import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const RECOGNITION_TYPES = [
  "Star Performer","Team Player","Innovation Award",
  "Above & Beyond","Growth Champion","Client Champion",
] as const;

const createSchema = z.object({
  toName:       z.string().min(1),
  toEmployeeId: z.string().optional(),
  type:         z.enum(RECOGNITION_TYPES),
  message:      z.string().min(1),
  isPublic:     z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
    const recognitions = await db.recognition.findMany({
      where: { orgId: user.orgId, isPublic: true },
      include: {
        fromUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return ok(recognitions);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const recognition = await db.recognition.create({
      data: {
        ...parsed.data,
        orgId:      user.orgId,
        fromUserId: user.id,
        toEmployeeId: parsed.data.toEmployeeId ?? null,
      },
      include: {
        fromUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    return created(recognition);
  } catch (e) { return serverError(e); }
}
