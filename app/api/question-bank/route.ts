import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  question:     z.string().min(5).max(500),
  guidance:     z.string().max(1000).optional(),
  responseType: z.enum(["yes_no", "likert_5", "text"]).default("yes_no"),
  riskWeight:   z.number().min(0.1).max(3.0).default(1.0),
  tags:         z.array(z.string()).default([]),
  categoryId:   z.string().optional(),
  isActive:     z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search     = searchParams.get("search");
    const isActive   = searchParams.get("isActive");

    const items = await db.questionBankItem.findMany({
      where: {
        orgId: { in: [user.orgId, ...([] as string[])] },
        ...(categoryId ? { categoryId } : {}),
        ...(isActive !== null ? { isActive: isActive === "true" } : {}),
        ...(search
          ? { question: { contains: search, mode: "insensitive" } }
          : {}),
      },
      include: { category: true },
      orderBy: [{ categoryId: "asc" }, { question: "asc" }],
    });

    // Also include global items (orgId: null)
    const globalItems = await db.questionBankItem.findMany({
      where: {
        orgId: null,
        ...(categoryId ? { categoryId } : {}),
        ...(isActive !== null ? { isActive: isActive === "true" } : {}),
        ...(search
          ? { question: { contains: search, mode: "insensitive" } }
          : {}),
      },
      include: { category: true },
      orderBy: [{ categoryId: "asc" }, { question: "asc" }],
    });

    return ok([...globalItems, ...items]);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body   = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const item = await db.questionBankItem.create({
      data: {
        orgId:        user.orgId,
        question:     parsed.data.question,
        guidance:     parsed.data.guidance ?? null,
        responseType: parsed.data.responseType,
        riskWeight:   parsed.data.riskWeight,
        tags:         parsed.data.tags,
        categoryId:   parsed.data.categoryId ?? null,
        isActive:     parsed.data.isActive,
      },
      include: { category: true },
    });

    return created(item);
  } catch (e) { return serverError(e); }
}
