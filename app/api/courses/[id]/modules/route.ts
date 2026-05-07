import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, notFound, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  content:     z.string().optional(),
  videoUrl:    z.string().url().optional().or(z.literal("")),
  moduleType:  z.enum(["text", "video", "quiz", "document"]).default("text"),
  durationMin: z.number().int().min(1).optional(),
  questions:   z.array(z.object({
    question:    z.string().min(1),
    options:     z.array(z.string()).min(2),
    answer:      z.string(),
    explanation: z.string().optional(),
  })).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const course = await db.course.findFirst({ where: { id, orgId: user.orgId } });
    if (!course) return notFound("Course not found");

    const modules = await db.courseModule.findMany({
      where:   { courseId: id },
      include: { questions: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });

    return ok(modules);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const course = await db.course.findFirst({ where: { id, orgId: user.orgId } });
    if (!course) return notFound("Course not found");

    const body   = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const maxOrder = await db.courseModule.aggregate({
      where: { courseId: id }, _max: { sortOrder: true },
    });

    const mod = await db.courseModule.create({
      data: {
        courseId:    id,
        title:       parsed.data.title,
        description: parsed.data.description ?? null,
        content:     parsed.data.content ?? null,
        videoUrl:    parsed.data.videoUrl || null,
        moduleType:  parsed.data.moduleType,
        durationMin: parsed.data.durationMin ?? null,
        sortOrder:   (maxOrder._max.sortOrder ?? -1) + 1,
        questions: parsed.data.questions?.length
          ? {
              create: parsed.data.questions.map((q, i) => ({
                question:    q.question,
                options:     q.options,
                answer:      q.answer,
                explanation: q.explanation ?? null,
                sortOrder:   i,
              })),
            }
          : undefined,
      },
      include: { questions: { orderBy: { sortOrder: "asc" } } },
    });

    // Update modules count on course
    await db.course.update({
      where: { id },
      data:  { modules: { increment: 1 } },
    });

    return created(mod);
  } catch (e) { return serverError(e); }
}
