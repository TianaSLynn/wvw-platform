import { ok, unauthorized, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const schema = z.object({
  settings: z.record(z.boolean()),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const u = await db.user.findUnique({ where: { id: user.id }, select: { preferences: true } });
    const prefs = (u?.preferences ?? {}) as Record<string, unknown>;
    return ok(prefs.notifications ?? {});
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const current = await db.user.findUnique({ where: { id: user.id }, select: { preferences: true } });
    const prefs = ((current?.preferences ?? {}) as Record<string, unknown>);
    prefs.notifications = parsed.data.settings;

    await db.user.update({
      where: { id: user.id },
      data: { preferences: prefs as Prisma.InputJsonValue },
    });
    return ok({ saved: true });
  } catch (e) { return serverError(e); }
}
