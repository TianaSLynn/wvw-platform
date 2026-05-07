import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  email:      z.string().email().optional(),
  role:       z.string().default("CONSULTANT"),
  inviteType: z.enum(["team", "client", "employee"]).default("team"),
  clientId:   z.string().optional(),
  message:    z.string().max(500).optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "PARTNER"].includes(user.role)) return unauthorized();

    const invites = await db.invite.findMany({
      where:   { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
    });

    return ok(invites);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "PARTNER"].includes(user.role)) return unauthorized();

    const body   = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays);

    const invite = await db.invite.create({
      data: {
        orgId:      user.orgId,
        email:      parsed.data.email ?? null,
        role:       parsed.data.role,
        inviteType: parsed.data.inviteType,
        clientId:   parsed.data.clientId ?? null,
        message:    parsed.data.message ?? null,
        expiresAt,
        createdById: user.id,
      },
    });

    return created(invite);
  } catch (e) { return serverError(e); }
}
