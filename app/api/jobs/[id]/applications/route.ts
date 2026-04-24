import { db } from "@/lib/db";
import { ok, created, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const applySchema = z.object({
  firstName:   z.string().min(1),
  lastName:    z.string().min(1),
  email:       z.string().email(),
  phone:       z.string().optional(),
  linkedIn:    z.string().url().optional().or(z.literal("")),
  portfolio:   z.string().url().optional().or(z.literal("")),
  coverLetter: z.string().optional(),
  answers:     z.record(z.string()).optional(),
});

const updateSchema = z.object({
  applicationId: z.string().cuid(),
  status:   z.enum(["NEW","REVIEWING","INTERVIEW","OFFERED","HIRED","REJECTED","WITHDRAWN"]).optional(),
  rating:   z.number().int().min(1).max(5).nullable().optional(),
  notes:    z.string().nullable().optional(),
});

// GET — list applications for a posting
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: postingId } = await params;

    const posting = await db.jobPosting.findFirst({ where: { id: postingId, orgId: user.orgId } });
    if (!posting) return notFound("Job posting");

    const applications = await db.jobApplication.findMany({
      where: { postingId },
      include: { reviewedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { appliedAt: "desc" },
    });

    return ok(applications);
  } catch (e) { return serverError(e); }
}

// POST — submit a new application (no auth required — public applicants)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postingId } = await params;

    const posting = await db.jobPosting.findFirst({
      where: { id: postingId, status: "PUBLISHED" },
    });
    if (!posting) return notFound("Job posting");

    const body = await req.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    // Prevent duplicate applications from the same email
    const duplicate = await db.jobApplication.findFirst({
      where: { postingId, email: parsed.data.email },
    });
    if (duplicate) return badRequest("You have already applied for this position");

    const application = await db.jobApplication.create({
      data: {
        orgId:      posting.orgId,
        postingId,
        ...parsed.data,
        linkedIn:    parsed.data.linkedIn    || null,
        portfolio:   parsed.data.portfolio   || null,
        answers:     parsed.data.answers     ?? {},
      },
    });

    return created(application);
  } catch (e) { return serverError(e); }
}

// PATCH — update application status/rating/notes (internal use)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: postingId } = await params;

    const posting = await db.jobPosting.findFirst({ where: { id: postingId, orgId: user.orgId } });
    if (!posting) return notFound("Job posting");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { applicationId, ...data } = parsed.data;

    const updated = await db.jobApplication.update({
      where: { id: applicationId },
      data: {
        ...data,
        ...(data.status ? { reviewedById: user.id } : {}),
      },
    });

    return ok(updated);
  } catch (e) { return serverError(e); }
}
