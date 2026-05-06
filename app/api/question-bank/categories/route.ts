import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  name:      z.string().min(2).max(80),
  color:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6B8F71"),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const cats = await db.questionBankCategory.findMany({
      where: { orgId: { in: [user.orgId, null as unknown as string] } },
      include: { _count: { select: { items: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return ok(cats);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body   = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const cat = await db.questionBankCategory.create({
      data: {
        orgId:     user.orgId,
        name:      parsed.data.name,
        color:     parsed.data.color,
        sortOrder: parsed.data.sortOrder,
      },
    });

    return created(cat);
  } catch (e) { return serverError(e); }
}
