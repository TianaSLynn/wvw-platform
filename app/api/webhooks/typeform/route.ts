import { db } from "@/lib/db";
import { ok, badRequest } from "@/lib/api-response";
import crypto from "crypto";

// Typeform sends a `Typeform-Signature` header to verify authenticity
function verifyTypeformSignature(payload: string, signature: string, secret: string): boolean {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  // orgId can be passed as a query param: /api/webhooks/typeform?orgId=xxx
  const url = new URL(req.url);
  const orgId = url.searchParams.get("orgId");

  if (!orgId) return badRequest("Missing orgId query parameter");

  const rawBody = await req.text();
  const signature = req.headers.get("Typeform-Signature") ?? "";

  // Verify signature if the integration has a webhook secret configured
  const integration = await db.integration.findFirst({
    where: { orgId, slug: "typeform", status: "ACTIVE" },
  });

  if (integration) {
    const config = integration.config as Record<string, string>;
    const secret = config["Webhook Secret"] ?? config["webhookSecret"];
    if (secret && signature) {
      if (!verifyTypeformSignature(rawBody, signature, secret)) {
        return new Response("Invalid signature", { status: 401 });
      }
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON payload");
  }

  // Typeform webhook payload structure
  const formId = (payload.form_id ?? payload.formId ?? "") as string;
  const answers = payload.form_response as Record<string, unknown> | undefined;
  const respondent = (answers?.hidden as Record<string, string> | undefined) ?? {};

  // Log to ActivityLog for now; future: map to audit survey responses
  await db.activityLog.create({
    data: {
      orgId,
      action: `Typeform submission received — form: ${formId}`,
      entityType: "Survey",
      entityId: formId,
      metadata: JSON.parse(JSON.stringify({ formId, respondent })),
    },
  }).catch(() => {}); // non-fatal

  // If a client name or email is included, try to link to an audit
  const email = respondent["email"] ?? (answers?.email as string | undefined);
  if (email) {
    const client = await db.client.findFirst({
      where: { orgId },
      include: { contacts: { where: { email: { contains: email, mode: "insensitive" } }, take: 1 } },
    });
    if (client?.contacts.length) {
      // Future: create SurveyResponse record linked to the client's active audit
    }
  }

  return ok({ received: true, formId });
}
