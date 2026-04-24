import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  title:       z.string().min(1),
  type:        z.string().default("GENERAL"),
  description: z.string().optional(),
  scheduledAt: z.string(),
  duration:    z.number().default(60),
  location:    z.string().optional(),
  meetingUrl:  z.string().optional(),
  clientId:    z.string().optional(),
  auditId:     z.string().optional(),
  attendeeIds: z.array(z.string()).default([]),
  notes:       z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
    const to   = searchParams.get("to")   ? new Date(searchParams.get("to")!)   : undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

    const meetings = await db.meeting.findMany({
      where: {
        orgId: user.orgId,
        ...(from || to ? { scheduledAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        audit:  { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: limit,
    });

    return ok(meetings);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { scheduledAt, clientId, auditId, ...rest } = parsed.data;

    const meeting = await db.meeting.create({
      data: {
        ...rest,
        orgId:       user.orgId,
        createdById: user.id,
        scheduledAt: new Date(scheduledAt),
        clientId:    clientId || null,
        auditId:     auditId  || null,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return created(meeting);
  } catch (e) { return serverError(e); }
}
