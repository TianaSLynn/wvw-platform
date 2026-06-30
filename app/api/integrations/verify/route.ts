/**
 * POST /api/integrations/verify
 * Re-tests a saved integration using its stored DB config, then updates status.
 * Body: { id: string }
 */
import { db } from "@/lib/db";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { runIntegrationTest } from "@/lib/integration-testers";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await req.json() as { id: string };
    if (!id) return badRequest("id required");

    const integration = await db.integration.findFirst({
      where: { id, orgId: user.orgId },
    });
    if (!integration) return notFound("Integration");

    const config = (integration.config ?? {}) as Record<string, string>;
    const result = await runIntegrationTest(integration.slug, config);

    // Update status + lastSyncAt in DB
    await db.integration.update({
      where: { id },
      data: {
        status: result.ok ? "ACTIVE" : "ERROR",
        lastSyncAt: new Date(),
        lastSyncStatus: result.message,
      },
    });

    return ok({ verified: result.ok, message: result.message });
  } catch (e) { return serverError(e); }
}
