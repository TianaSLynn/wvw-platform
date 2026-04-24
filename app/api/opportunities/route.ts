import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  stage:       z.enum(["PROSPECT","QUALIFIED","PROPOSAL","NEGOTIATION","CLOSED_WON","CLOSED_LOST"]).default("PROSPECT"),
  value:       z.number().positive().optional(),
  probability: z.number().min(0).max(100).default(50),
  closeDate:   z.string().optional(),
  clientId:    z.string().optional(),
  source:      z.string().optional(),
  tags:        z.array(z.string()).default([]),
});

const updateSchema = createSchema.partial().extend({
  lostReason: z.string().optional(),
});

export async function GET(_req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const opportunities = await db.opportunity.findMany({
      where: { orgId: user.orgId },
      include: {
        client: { select: { id: true, name: true } },
        owner:  { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { activities: true } },
      },
      orderBy: [{ stage: "asc" }, { updatedAt: "desc" }],
    });
    return ok(opportunities);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const { closeDate, clientId, ...rest } = parsed.data;

    const opp = await db.opportunity.create({
      data: {
        ...rest,
        orgId:    user.orgId,
        ownerId:  user.id,
        clientId: clientId || null,
        closeDate: closeDate ? new Date(closeDate) : null,
      },
    });
    return created(opp);
  } catch (e) { return serverError(e); }
}
