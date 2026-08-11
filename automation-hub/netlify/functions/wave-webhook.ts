import type { Handler, HandlerEvent } from "@netlify/functions";
import { generateCorrelationId } from "../../packages/shared-types/src/correlation-id.js";
import { verifyWaveWebhookSignature, requireWebhookSecret, WaveWebhookNotConfiguredError } from "../../packages/integration-wave/src/webhook-verify.js";
import { logWorkflowExecution } from "../../packages/integration-postgres/src/workflow-log.js";

/**
 * POST /.netlify/functions/wave-webhook
 *
 * Receives real-time invoice/payment events from Wave (invoice.approved,
 * invoice.overdue, invoice.viewed, and whatever payment-received-equivalent
 * event Wave's 17-event catalog includes -- not yet enumerated here). This
 * is the first real alternative to the dead end documented in
 * docs/CREDENTIALS_AND_MANUAL_ACTIONS.md ("Confirmed 2026-07-28: Wave's
 * Zapier integration has no Invoice Paid/Payment Received trigger").
 *
 * Scope of what this endpoint does TODAY: verify the signature (real
 * security, not optional) and log every event it receives. It deliberately
 * does NOT yet update MHFA-02 Payment Status or trigger MHFA-COMM-005
 * (Payment Received) -- no MHFA-02 registration currently stores a Wave
 * invoice number or customer ID, so there is no honest way to match an
 * incoming webhook event to a specific registration record. That matching
 * (adding an Invoice Number field to MHFA-02 and populating it, or matching
 * on customer email) is a real decision for Tiána, not something to invent
 * here -- tracked as a follow-up in IMPLEMENTATION_REGISTER.md.
 */

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const rawBody = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf-8") : (event.body ?? "");
  const signatureHeader = event.headers["x-wave-signature"] ?? event.headers["X-Wave-Signature"];

  let secret: string;
  try {
    secret = requireWebhookSecret();
  } catch (err) {
    if (err instanceof WaveWebhookNotConfiguredError) {
      console.error("[wave-webhook] WAVE_WEBHOOK_SECRET is not set -- rejecting all deliveries until configured.");
      return json(503, { error: "webhook_not_configured" });
    }
    throw err;
  }

  const verification = verifyWaveWebhookSignature(rawBody, signatureHeader, secret);
  if (!verification.valid) {
    console.error(`[wave-webhook] signature verification failed: ${verification.reason}`);
    return json(401, { error: "invalid_signature", reason: verification.reason });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json(400, { error: "invalid_json_body" });
  }

  const eventType = String(payload["event_type"] ?? payload["type"] ?? "unknown");
  const correlationId = generateCorrelationId("WAVE", "WAVE-WEBHOOK-01");

  await logWorkflowExecution({
    correlationId,
    automationCode: "WAVE-WEBHOOK-01",
    status: "completed",
    trigger: eventType,
    inputSnapshot: payload,
    outputSnapshot: { note: "Signature verified and event logged. No registration-matching or downstream action taken yet -- see file header comment." },
  });

  return json(200, { status: "received", eventType, correlationId });
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
