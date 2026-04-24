import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const GRANT_STATUSES = ["RESEARCHING","DRAFTING","SUBMITTED","UNDER_REVIEW","AWARDED","REJECTED","WITHDRAWN"] as const;

const updateSchema = z.object({
  name:          z.string().min(1).optional(),
  funder:        z.string().optional(),
  programName:   z.string().nullable().optional(),
  description:   z.string().nullable().optional(),
  status:        z.enum(GRANT_STATUSES).optional(),
  amount:        z.number().nullable().optional(),
  amountAwarded: z.number().nullable().optional(),
  deadline:      z.string().nullable().optional(),
  submittedAt:   z.string().nullable().optional(),
  decisionAt:    z.string().nullable().optional(),
  reportDueAt:   z.string().nullable().optional(),
  requirements:  z.string().nullable().optional(),
  notes:         z.string().nullable().optional(),
  assignedToId:  z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.grant.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Grant");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { deadline, submittedAt, decisionAt, reportDueAt, ...rest } = parsed.data;

    const updated = await db.grant.update({
      where: { id },
      data: {
        ...rest,
        ...(deadline    !== undefined ? { deadline:    deadline    ? new Date(deadline)    : null } : {}),
        ...(submittedAt !== undefined ? { submittedAt: submittedAt ? new Date(submittedAt) : null } : {}),
        ...(decisionAt  !== undefined ? { decisionAt:  decisionAt  ? new Date(decisionAt)  : null } : {}),
        ...(reportDueAt !== undefined ? { reportDueAt: reportDueAt ? new Date(reportDueAt) : null } : {}),
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.grant.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Grant");

    await db.grant.delete({ where: { id } });
    return noContent();
  } catch (e) { return serverError(e); }
}
