import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { postAnnouncement } from "@/lib/announcements";
import { z } from "zod";

const updateSchema = z.object({
  title:        z.string().min(1).optional(),
  type:         z.enum(["FULL_TIME","PART_TIME","CONTRACT","INTERNSHIP","VOLUNTEER","FREELANCE"]).optional(),
  status:       z.enum(["DRAFT","PUBLISHED","PAUSED","CLOSED","FILLED"]).optional(),
  department:   z.string().optional(),
  location:     z.string().optional(),
  remote:       z.boolean().optional(),
  description:  z.string().optional(),
  requirements: z.string().optional(),
  benefits:     z.string().optional(),
  salaryMin:    z.number().nullable().optional(),
  salaryMax:    z.number().nullable().optional(),
  salaryUnit:   z.string().nullable().optional(),
  duration:     z.string().nullable().optional(),
  isPaid:       z.boolean().nullable().optional(),
  closingDate:  z.string().datetime().nullable().optional(),
  externalUrls: z.array(z.string()).optional(),
  tags:         z.array(z.string()).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const posting = await db.jobPosting.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        postedBy: { select: { id: true, firstName: true, lastName: true } },
        applications: {
          include: { reviewedBy: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { appliedAt: "desc" },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!posting) return notFound("Job posting");
    return ok(posting);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.jobPosting.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Job posting");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const updated = await db.jobPosting.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.status === "PUBLISHED" && existing.status !== "PUBLISHED"
          ? { publishedAt: new Date() }
          : {}),
      },
    });

    // Auto-post announcement when status changes
    if (parsed.data.status && parsed.data.status !== existing.status) {
      const typeLabels: Record<string, string> = {
        FULL_TIME: "Full-Time", PART_TIME: "Part-Time", CONTRACT: "Contract",
        INTERNSHIP: "Internship", VOLUNTEER: "Volunteer", FREELANCE: "Freelance",
      };
      const typeLabel = typeLabels[existing.type] ?? existing.type;

      if (parsed.data.status === "PUBLISHED") {
        postAnnouncement({
          orgId:   user.orgId,
          authorId: user.id,
          announcementType: "JOB_OPENING",
          title:   `Now Hiring: ${existing.title}`,
          body:    `We're looking for a ${typeLabel}${existing.department ? ` in ${existing.department}` : ""}! ${existing.description.slice(0, 200)}${existing.description.length > 200 ? "…" : ""}`,
          subjectName: existing.title,
          subjectId:   existing.id,
        }).catch(() => {});
      } else if (parsed.data.status === "FILLED") {
        postAnnouncement({
          orgId:   user.orgId,
          authorId: user.id,
          announcementType: "JOB_CLOSING",
          title:   `Position Filled: ${existing.title}`,
          body:    `Great news — we've filled the ${existing.title} ${typeLabel.toLowerCase()} role. Thank you to everyone who applied!`,
          subjectName: existing.title,
          subjectId:   existing.id,
        }).catch(() => {});
      } else if (parsed.data.status === "CLOSED") {
        postAnnouncement({
          orgId:   user.orgId,
          authorId: user.id,
          announcementType: "JOB_CLOSING",
          title:   `Role Closed: ${existing.title}`,
          body:    `The ${existing.title} ${typeLabel.toLowerCase()} posting is now closed.`,
          subjectName: existing.title,
          subjectId:   existing.id,
        }).catch(() => {});
      }
    }

    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.jobPosting.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Job posting");

    await db.jobPosting.delete({ where: { id } });
    return noContent();
  } catch (e) { return serverError(e); }
}
