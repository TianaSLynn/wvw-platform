import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, badRequest, serverError, forbidden
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const LEVELS = ["BEGINNER","INTERMEDIATE","ADVANCED","EXPERT"] as const;
const CATEGORIES = ["ONBOARDING","ANNUAL","QUARTERLY","MANDATORY","COMPLIANCE","LEADERSHIP","DEI","WELLBEING","SKILLS","ELECTIVE"] as const;

const updateSchema = z.object({
  title:        z.string().min(1).optional(),
  description:  z.string().optional(),
  category:     z.enum(CATEGORIES).optional(),
  level:        z.enum(LEVELS).optional(),
  duration:     z.string().nullable().optional(),
  format:       z.string().nullable().optional(),
  audience:     z.string().nullable().optional(),
  modules:      z.number().optional(),
  passingScore: z.number().optional(),
  contentUrl:   z.string().nullable().optional(),
  isActive:     z.boolean().optional(),
  isPublished:  z.boolean().optional(),
  tags:         z.array(z.string()).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const course = await db.course.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        assignments: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, title: true, department: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { assignments: true } },
      },
    });

    if (!course) return notFound("Course");
    return ok(course);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.course.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Course");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const updated = await db.course.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "PARTNER", "MANAGER"].includes(user.role)) return forbidden("Insufficient permissions");
    const { id } = await params;

    const existing = await db.course.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Course");

    await db.course.delete({ where: { id } });
    return noContent();
  } catch (e) { return serverError(e); }
}
