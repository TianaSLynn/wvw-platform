import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const LEVELS = ["BEGINNER","INTERMEDIATE","ADVANCED","EXPERT"] as const;
const CATEGORIES = ["ONBOARDING","ANNUAL","QUARTERLY","MANDATORY","COMPLIANCE","LEADERSHIP","DEI","WELLBEING","SKILLS","ELECTIVE"] as const;

const createSchema = z.object({
  title:        z.string().min(1),
  slug:         z.string().optional(),
  description:  z.string().min(1),
  category:     z.enum(CATEGORIES).default("ELECTIVE"),
  level:        z.enum(LEVELS).default("BEGINNER"),
  duration:     z.string().optional(),
  format:       z.string().optional(),
  audience:     z.string().optional(),
  modules:      z.number().default(1),
  passingScore: z.number().default(70),
  contentUrl:   z.string().optional(),
  isActive:     z.boolean().default(true),
  isPublished:  z.boolean().default(false),
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
    const published = searchParams.get("published");

    const courses = await db.course.findMany({
      where: {
        orgId: user.orgId,
        isActive: true,
        ...(published === "true" ? { isPublished: true } : {}),
        ...(category ? { category: category as typeof CATEGORIES[number] } : {}),
      },
      include: {
        _count: { select: { assignments: true } },
      },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    });

    return ok(courses);
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
    const baseSlug = rawSlug || toSlug(rest.title);

    let slug = baseSlug;
    let suffix = 0;
    while (true) {
      const existing = await db.course.findFirst({ where: { orgId: user.orgId, slug } });
      if (!existing) break;
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }

    const course = await db.course.create({
      data: { ...rest, orgId: user.orgId, slug, createdById: user.id },
    });

    return created(course);
  } catch (e) { return serverError(e); }
}
