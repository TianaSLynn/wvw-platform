/**
 * Auto-announcement helper — call from any API route to post
 * a structured announcement into the org's Announcements space.
 * Fire-and-forget: always wrap the call in .catch(() => {})
 */
import { db } from "@/lib/db";

type AnnouncementType =
  | "BIRTHDAY" | "PROMOTION" | "JOB_OPENING" | "JOB_CLOSING"
  | "ONBOARDING" | "OFFBOARDING" | "KUDOS" | "MILESTONE" | "EVENT" | "GENERAL";

export async function postAnnouncement(opts: {
  orgId:            string;
  authorId?:        string;
  announcementType: AnnouncementType;
  title:            string;
  body:             string;
  subjectName?:     string;
  subjectId?:       string;
  isPinned?:        boolean;
}) {
  // Find or create the ANNOUNCEMENT space
  let space = await db.communitySpace.findFirst({
    where: { orgId: opts.orgId, type: "ANNOUNCEMENT" },
  });
  if (!space) {
    space = await db.communitySpace.create({
      data: {
        orgId:       opts.orgId,
        name:        "Announcements",
        slug:        `announcements-${opts.orgId.slice(-8)}`,
        type:        "ANNOUNCEMENT",
        description: "Official org announcements — birthdays, promotions, kudos, and more.",
        isPrivate:   false,
      },
    });
  }

  return db.communityPost.create({
    data: {
      spaceId:          space.id,
      authorId:         opts.authorId ?? null,
      title:            opts.title,
      body:             opts.body,
      isAnnouncement:   true,
      isPinned:         opts.isPinned ?? false,
      announcementType: opts.announcementType,
      subjectName:      opts.subjectName ?? null,
      subjectId:        opts.subjectId  ?? null,
    },
  });
}
