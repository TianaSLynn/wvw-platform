import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type:        z.enum(["GENERAL","COHORT","IMPLEMENTATION","ANNOUNCEMENT","RESOURCE","ACADEMY"]).default("GENERAL"),
  slug:        z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  isPrivate:   z.boolean().default(false),
  iconEmoji:   z.string().max(4).optional(),
});

export async function GET(_req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const spaces = await db.communitySpace.findMany({
      where: { orgId: user.orgId, isArchived: false },
      include: { _count: { select: { posts: true } } },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });
    return ok(spaces);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["SUPER_ADMIN","ADMIN","PARTNER","MANAGER","CONSULTANT"].includes(user.role)) {
    return unauthorized();
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const space = await db.communitySpace.create({
      data: { ...parsed.data, orgId: user.orgId },
    });
    return created(space);
  } catch (e) { return serverError(e); }
}
