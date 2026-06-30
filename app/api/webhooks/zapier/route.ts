import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest } from "@/lib/api-response";

// POST — send an event from WVW to Zapier (outbound trigger)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json() as { event: string; payload: Record<string, unknown> };
  if (!body.event) return badRequest("Missing event name");

  const integration = await db.integration.findFirst({
    where: { orgId: user.orgId, slug: "zapier", status: "ACTIVE" },
  });

  if (!integration) return badRequest("Zapier integration not connected.");

  const config = integration.config as Record<string, string>;
  const webhookUrl = config["Webhook URL"] ?? config["webhookUrl"];

  if (!webhookUrl) return badRequest("No Zapier webhook URL configured. Edit the Zapier integration to add one.");

  const zapPayload = {
    event: body.event,
    org: user.org?.name ?? user.orgId,
    triggeredBy: `${user.firstName} ${user.lastName}`,
    timestamp: new Date().toISOString(),
    ...body.payload,
  };

  const zapRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(zapPayload),
  });

  if (!zapRes.ok) {
    return badRequest(`Zapier rejected the webhook: ${zapRes.status}`);
  }

  await db.activityLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: `Zapier webhook triggered — event: ${body.event}`,
      entityType: "Integration",
      entityId: integration.id,
    },
  }).catch(() => {});

  return ok({ sent: true, event: body.event });
}

// GET — inbound from Zapier to WVW (used with Zapier's "Webhooks by Zapier" action)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orgId = url.searchParams.get("orgId");
  const event = url.searchParams.get("event") ?? "zapier.ping";

  if (!orgId) return badRequest("Missing orgId");

  await db.activityLog.create({
    data: {
      orgId,
      action: `Zapier inbound event: ${event}`,
      entityType: "Integration",
      entityId: orgId,
      metadata: Object.fromEntries(url.searchParams.entries()) as Record<string, string>,
    },
  }).catch(() => {});

  return ok({ received: true, event });
}
