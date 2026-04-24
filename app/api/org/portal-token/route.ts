import { db } from "@/lib/db";
import { ok, unauthorized, notFound, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { generatePortalToken } from "@/lib/portal-token";
import { z } from "zod";

const schema = z.object({ clientId: z.string() });

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("clientId required");

    const client = await db.client.findFirst({
      where: { id: parsed.data.clientId, orgId: user.orgId },
      select: { id: true, name: true },
    });
    if (!client) return notFound("Client");

    const token = generatePortalToken(client.id);
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/portal/${token}`;

    return ok({ token, portalUrl, clientName: client.name });
  } catch (e) { return serverError(e); }
}
