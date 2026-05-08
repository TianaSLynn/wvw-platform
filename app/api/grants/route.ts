import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const GRANT_STATUSES = ["RESEARCHING","DRAFTING","SUBMITTED","UNDER_REVIEW","AWARDED","REJECTED","WITHDRAWN"] as const;

const createSchema = z.object({
  name:         z.string().min(1),
  funder:       z.string().min(1),
  programName:  z.string().optional(),
  description:  z.string().optional(),
  status:       z.enum(GRANT_STATUSES).default("RESEARCHING"),
  amount:       z.number().optional(),
  deadline:     z.string().optional(),
  decisionAt:   z.string().optional(),
  reportDueAt:  z.string().optional(),
  requirements: z.string().optional(),
  notes:        z.string().optional(),
  assignedToId: z.string().optional(),
  tags:         z.array(z.string()).default([]),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    const grants = await db.grant.findMany({
      where: {
        orgId: user.orgId,
        ...(status ? { status: status as typeof GRANT_STATUSES[number] } : {}),
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
      take: 500,
    });

    return ok(grants);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { deadline, decisionAt, reportDueAt, assignedToId, ...rest } = parsed.data;

    const grant = await db.grant.create({
      data: {
        ...rest,
        orgId:        user.orgId,
        assignedToId: assignedToId || null,
        deadline:     deadline   ? new Date(deadline)   : null,
        decisionAt:   decisionAt ? new Date(decisionAt) : null,
        reportDueAt:  reportDueAt ? new Date(reportDueAt) : null,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return created(grant);
  } catch (e) { return serverError(e); }
}
