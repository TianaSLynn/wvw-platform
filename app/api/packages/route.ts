import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const packageSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens"),
  tagline: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  audience: z.string().optional(),
  duration: z.string().optional(),
  auditTemplateId: z.string().optional(),
  courseIds: z.array(z.string()).optional(),
  notionUrl: z.string().url().optional().or(z.literal("")),
  notionLabel: z.string().optional(),
  pricePerUse: z.number().min(0).optional(),
  priceMonthly: z.number().min(0).optional(),
  currency: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";

    const packages = await db.productPackage.findMany({
      where: {
        isActive: true,
        OR: [{ orgId: user.orgId }, { orgId: null }], // org + global packages
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(category ? { category } : {}),
      },
      include: {
        auditTemplate: { select: { id: true, name: true, type: true } },
        _count: { select: { licenses: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    return ok(packages);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) return unauthorized();

    const body = await req.json();
    const parsed = packageSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { notionUrl, ...rest } = parsed.data;

    const pkg = await db.productPackage.create({
      data: {
        ...rest,
        notionUrl: notionUrl || null,
        orgId: user.orgId,
        courseIds: rest.courseIds ?? [],
        deliverables: rest.deliverables ?? [],
        tags: rest.tags ?? [],
      },
      include: {
        auditTemplate: { select: { id: true, name: true, type: true } },
        _count: { select: { licenses: true } },
      },
    });

    return created(pkg);
  } catch (e) { return serverError(e); }
}
