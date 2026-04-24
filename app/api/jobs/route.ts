import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  title:        z.string().min(1),
  type:         z.enum(["FULL_TIME","PART_TIME","CONTRACT","INTERNSHIP","VOLUNTEER","FREELANCE"]),
  department:   z.string().optional(),
  location:     z.string().optional(),
  remote:       z.boolean().optional(),
  description:  z.string().min(1),
  requirements: z.string().optional(),
  benefits:     z.string().optional(),
  salaryMin:    z.number().optional(),
  salaryMax:    z.number().optional(),
  salaryUnit:   z.string().optional(),
  duration:     z.string().optional(),
  isPaid:       z.boolean().optional(),
  closingDate:  z.string().datetime().optional(),
  externalUrls: z.array(z.string()).optional(),
  tags:         z.array(z.string()).optional(),
  status:       z.enum(["DRAFT","PUBLISHED"]).optional(),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type   = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const postings = await db.jobPosting.findMany({
      where: {
        orgId: user.orgId,
        ...(type   ? { type:   type   as never } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: {
        postedBy: { select: { id: true, firstName: true, lastName: true } },
        _count:   { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(postings);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const posting = await db.jobPosting.create({
      data: {
        ...parsed.data,
        orgId:       user.orgId,
        postedById:  user.id,
        publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
        externalUrls: parsed.data.externalUrls ?? [],
        tags:         parsed.data.tags ?? [],
      },
    });

    return created(posting);
  } catch (e) { return serverError(e); }
}
