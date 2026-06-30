import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { nanoid } from "nanoid";

// GET /api/surveys — list org surveys
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const surveys = await db.survey.findMany({
    where: { orgId: user.orgId },
    include: {
      _count: { select: { questions: true, submissions: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      audit: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return ok(surveys);
}

// POST /api/surveys — create survey
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json() as { title?: string; description?: string; auditId?: string };
    if (!body.title?.trim()) return badRequest("Title is required");

    const slug = nanoid(10);

    const survey = await db.survey.create({
      data: {
        orgId:       user.orgId,
        createdById: user.id,
        title:       body.title.trim(),
        description: body.description?.trim() ?? null,
        auditId:     body.auditId ?? null,
        slug,
        confirmMessage: "Thank you for completing this survey. Your response has been recorded.",
      },
    });

    return ok(survey);
  } catch (e) {
    return serverError(e);
  }
}
