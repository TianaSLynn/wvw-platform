import { db } from "@/lib/db";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  audience: z.string().optional(),
  duration: z.string().optional(),
  auditTemplateId: z.string().optional().nullable(),
  courseIds: z.array(z.string()).optional(),
  notionUrl: z.string().optional().nullable(),
  notionLabel: z.string().optional(),
  pricePerUse: z.number().min(0).optional().nullable(),
  priceMonthly: z.number().min(0).optional().nullable(),
  deliverables: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ packageId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { packageId } = await params;

    const pkg = await db.productPackage.findFirst({
      where: { id: packageId, OR: [{ orgId: user.orgId }, { orgId: null }] },
      include: {
        auditTemplate: { select: { id: true, name: true, type: true, description: true, sections: { include: { _count: { select: { items: true } } }, orderBy: { sortOrder: "asc" } } } },
        licenses: { include: { client: { select: { id: true, name: true } } }, orderBy: { licensedAt: "desc" } },
        _count: { select: { licenses: true } },
      },
    });

    if (!pkg) return notFound("Package not found");

    // Fetch linked courses if any
    let courses: { id: string; title: string; category: string; duration: string | null; level: string }[] = [];
    if (pkg.courseIds.length > 0) {
      courses = await db.course.findMany({
        where: { id: { in: pkg.courseIds }, orgId: user.orgId },
        select: { id: true, title: true, category: true, duration: true, level: true },
      });
    }

    return ok({ ...pkg, courses });
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ packageId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) return unauthorized();
    const { packageId } = await params;

    const existing = await db.productPackage.findFirst({ where: { id: packageId, orgId: user.orgId } });
    if (!existing) return notFound("Package not found");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const pkg = await db.productPackage.update({
      where: { id: packageId },
      data: parsed.data,
      include: {
        auditTemplate: { select: { id: true, name: true, type: true } },
        _count: { select: { licenses: true } },
      },
    });

    return ok(pkg);
  } catch (e) { return serverError(e); }
}

// License a package to a client
export async function POST(req: Request, { params }: { params: Promise<{ packageId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { packageId } = await params;

    const pkg = await db.productPackage.findFirst({
      where: { id: packageId, isActive: true, OR: [{ orgId: user.orgId }, { orgId: null }] },
    });
    if (!pkg) return notFound("Package not found");

    const body = await req.json();
    const { clientId, expiresAt, notes } = body;

    const license = await db.packageLicense.create({
      data: {
        orgId: user.orgId,
        packageId,
        clientId: clientId ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes,
        status: "ACTIVE",
      },
      include: { client: { select: { id: true, name: true } }, package: { select: { id: true, name: true } } },
    });

    return ok(license);
  } catch (e) { return serverError(e); }
}
