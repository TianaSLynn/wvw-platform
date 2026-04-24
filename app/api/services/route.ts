import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const SERVICE_CATEGORIES = ["AUDIT","TRAINING","CONSULTING","COACHING","ASSESSMENT","WORKSHOP","RETAINER","OTHER"] as const;

const createSchema = z.object({
  name:         z.string().min(1),
  slug:         z.string().optional(),
  category:     z.enum(SERVICE_CATEGORIES).default("OTHER"),
  description:  z.string().min(1),
  deliverables: z.string().optional(),
  duration:     z.string().optional(),
  format:       z.string().optional(),
  audience:     z.string().optional(),
  priceMin:     z.number().nullable().optional(),
  priceMax:     z.number().nullable().optional(),
  priceUnit:    z.string().optional(),
  isActive:     z.boolean().default(true),
  isFeatured:   z.boolean().default(false),
  tags:         z.array(z.string()).default([]),
});

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;
    const activeOnly = searchParams.get("active") !== "false";

    const services = await db.serviceOffering.findMany({
      where: {
        orgId: user.orgId,
        ...(activeOnly ? { isActive: true } : {}),
        ...(category ? { category: category as typeof SERVICE_CATEGORIES[number] } : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { category: "asc" }, { name: "asc" }],
    });

    return ok(services);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { slug: rawSlug, ...rest } = parsed.data;
    const baseSlug = rawSlug || toSlug(rest.name);

    // Ensure unique slug within org
    let slug = baseSlug;
    let suffix = 0;
    while (true) {
      const existing = await db.serviceOffering.findFirst({ where: { orgId: user.orgId, slug } });
      if (!existing) break;
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }

    const service = await db.serviceOffering.create({
      data: { ...rest, orgId: user.orgId, slug },
    });

    return created(service);
  } catch (e) { return serverError(e); }
}
