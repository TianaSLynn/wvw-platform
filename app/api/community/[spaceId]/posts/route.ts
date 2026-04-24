import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  title:          z.string().max(200).optional(),
  body:           z.string().min(1).max(10000),
  isAnnouncement: z.boolean().default(false),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { spaceId } = await params;

  try {
    const posts = await db.communityPost.findMany({
      where: { spaceId, isArchived: false },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 50,
    });
    return ok(posts);
  } catch (e) { return serverError(e); }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { spaceId } = await params;

  try {
    const space = await db.communitySpace.findFirst({
      where: { id: spaceId, orgId: user.orgId },
    });
    if (!space) return badRequest("Space not found");

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const post = await db.communityPost.create({
      data: { ...parsed.data, spaceId, authorId: user.id },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
    return created(post);
  } catch (e) { return serverError(e); }
}
