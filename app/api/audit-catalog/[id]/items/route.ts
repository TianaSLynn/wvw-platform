import { db } from "@/lib/db";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const template = await db.auditTemplate.findFirst({
      where: { id, OR: [{ orgId: user.orgId }, { isGlobal: true }] },
      include: {
        sections: {
          include: {
            items: {
              include: { questionBankItem: { include: { category: true } } },
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!template) return notFound("Template not found");
    return ok(template);
  } catch (e) { return serverError(e); }
}

const patchItemSchema = z.object({
  itemId:   z.string(),
  isActive: z.boolean().optional(),
  question: z.string().min(5).max(500).optional(),
  guidance: z.string().max(1000).optional(),
  riskWeight: z.number().min(0.1).max(3.0).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;

    // Verify template belongs to org (or is global and user is admin)
    const template = await db.auditTemplate.findFirst({
      where: { id, OR: [{ orgId: user.orgId }, { isGlobal: true }] },
    });
    if (!template) return notFound("Template not found");

    const body   = await req.json();
    const parsed = patchItemSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { itemId, ...updates } = parsed.data;
    const item = await db.auditTemplateItem.update({
      where: { id: itemId },
      data: updates,
    });

    return ok(item);
  } catch (e) { return serverError(e); }
}

const addItemSchema = z.object({
  sectionId:        z.string(),
  question:         z.string().min(5).max(500),
  guidance:         z.string().max(1000).optional(),
  riskWeight:       z.number().min(0.1).max(3.0).default(1.0),
  evidenceRequired: z.boolean().default(false),
  questionBankItemId: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const template = await db.auditTemplate.findFirst({
      where: { id, OR: [{ orgId: user.orgId }, { isGlobal: true }] },
    });
    if (!template) return notFound("Template not found");

    const body   = await req.json();
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    // Get max sortOrder in section
    const maxOrder = await db.auditTemplateItem.aggregate({
      where:   { sectionId: parsed.data.sectionId },
      _max:    { sortOrder: true },
    });

    const item = await db.auditTemplateItem.create({
      data: {
        sectionId:          parsed.data.sectionId,
        question:           parsed.data.question,
        guidance:           parsed.data.guidance ?? null,
        riskWeight:         parsed.data.riskWeight,
        evidenceRequired:   parsed.data.evidenceRequired,
        isRequired:         true,
        isActive:           true,
        sortOrder:          (maxOrder._max.sortOrder ?? 0) + 1,
        questionBankItemId: parsed.data.questionBankItemId ?? null,
      },
    });

    return ok(item);
  } catch (e) { return serverError(e); }
}
