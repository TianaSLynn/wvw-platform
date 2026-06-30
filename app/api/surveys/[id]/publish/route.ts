import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, notFound, badRequest } from "@/lib/api-response";

// POST /api/surveys/[id]/publish — set ACTIVE; PATCH with status to close/archive
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const survey = await db.survey.findFirst({ where: { id, orgId: user.orgId } });
  if (!survey) return notFound();
  const qCount = await db.surveyQuestion.count({ where: { surveyId: id } });
  if (qCount === 0) return badRequest("Add at least one question before publishing.");

  const updated = await db.survey.update({
    where: { id },
    data: { status: "ACTIVE", publishedAt: new Date() },
  });

  return ok(updated);
}

// PATCH /api/surveys/[id]/publish — close or archive
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const survey = await db.survey.findFirst({ where: { id, orgId: user.orgId } });
  if (!survey) return notFound();

  const body = await req.json() as { status: "DRAFT" | "CLOSED" | "ARCHIVED" };
  const allowed = ["DRAFT", "CLOSED", "ARCHIVED"] as const;
  if (!allowed.includes(body.status)) return badRequest("Invalid status");

  const updated = await db.survey.update({ where: { id }, data: { status: body.status } });
  return ok(updated);
}
