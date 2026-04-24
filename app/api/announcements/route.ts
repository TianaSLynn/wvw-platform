/**
 * Announcements API
 * Automatically finds or creates the org's ANNOUNCEMENT community space,
 * then creates/lists structured announcement posts.
 */
import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const ANNOUNCEMENT_TYPES = [
  "BIRTHDAY", "PROMOTION", "JOB_OPENING", "JOB_CLOSING",
  "ONBOARDING", "OFFBOARDING", "KUDOS", "MILESTONE", "EVENT", "GENERAL",
] as const;

const createSchema = z.object({
  announcementType: z.enum(ANNOUNCEMENT_TYPES),
  title:       z.string().min(1),
  body:        z.string().min(1),
  subjectName: z.string().optional(),
  subjectId:   z.string().optional(),
  isPinned:    z.boolean().optional(),
});

/** Get or create the org's primary ANNOUNCEMENT space */
async function getAnnouncementSpace(orgId: string) {
  let space = await db.communitySpace.findFirst({
    where: { orgId, type: "ANNOUNCEMENT" },
  });
  if (!space) {
    space = await db.communitySpace.create({
      data: {
        orgId,
        name: "Announcements",
        slug: `announcements-${orgId.slice(-8)}`,
        type: "ANNOUNCEMENT",
        description: "Official org announcements — birthdays, promotions, kudos, and more.",
        isPrivate: false,
      },
    });
  }
  return space;
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type  = searchParams.get("type") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

    const posts = await db.communityPost.findMany({
      where: {
        space: { orgId: user.orgId },
        isArchived: false,
        OR: [
          { isAnnouncement: true },
          { space: { type: "ANNOUNCEMENT" } },
        ],
        ...(type ? { announcementType: type } : {}),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        space:  { select: { id: true, name: true } },
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return ok(posts);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const space = await getAnnouncementSpace(user.orgId);

    const post = await db.communityPost.create({
      data: {
        spaceId:         space.id,
        authorId:        user.id,
        title:           parsed.data.title,
        body:            parsed.data.body,
        isAnnouncement:  true,
        isPinned:        parsed.data.isPinned ?? false,
        announcementType: parsed.data.announcementType,
        subjectName:     parsed.data.subjectName ?? null,
        subjectId:       parsed.data.subjectId   ?? null,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    return created(post);
  } catch (e) { return serverError(e); }
}

