import { db } from "@/lib/db";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  isActive:     z.boolean().optional(),
  question:     z.string().min(5).max(500).optional(),
  guidance:     z.string().max(1000).optional(),
  responseType: z.enum(["yes_no", "likert_5", "text"]).optional(),
  riskWeight:   z.number().min(0.1).max(3.0).optional(),
  categoryId:   z.string().nullable().optional(),
  tags:         z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const item = await db.questionBankItem.findFirst({
      where: { id, orgId: user.orgId },
    });
    if (!item) return notFound("Question not found");

    const body   = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const updated = await db.questionBankItem.update({
      where: { id },
      data:  parsed.data,
      include: { category: true },
    });

    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const item = await db.questionBankItem.findFirst({
      where: { id, orgId: user.orgId },
    });
    if (!item) return notFound("Question not found");

    await db.questionBankItem.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
