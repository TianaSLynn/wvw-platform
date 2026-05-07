import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { clientSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const search    = searchParams.get("search") ?? "";
    const isActive  = searchParams.get("active");
    const industry  = searchParams.get("industry");

    const clients = await db.client.findMany({
      where: {
        orgId: user.orgId,
        deletedAt: null,
        ...(isActive !== null ? { isActive: isActive === "true" } : {}),
        ...(industry ? { industry } : {}),
        ...(search ? {
          OR: [
            { name:      { contains: search, mode: "insensitive" } },
            { legalName: { contains: search, mode: "insensitive" } },
            { industry:  { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      include: {
        contacts: { where: { isPrimary: true, deletedAt: null }, take: 1 },
        _count: { select: { projects: true, audits: true } },
      },
      orderBy: { name: "asc" },
    });

    return ok(clients);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const client = await db.client.create({
      data: { ...parsed.data, orgId: user.orgId, onboardedAt: new Date() },
    });

    await logActivity({
      orgId: user.orgId,
      userId: user.id,
      action: "client.created",
      entityType: "Client",
      entityId: client.id,
      entityLabel: client.name,
      afterData: client,
      clientId: client.id,
    });

    return created(client);
  } catch (e) { return serverError(e); }
}
