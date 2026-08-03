import type { Handler, HandlerEvent } from "@netlify/functions";
import { generateCorrelationId } from "../../packages/shared-types/src/correlation-id.js";
import { canonicalPayloadHash } from "../../packages/shared-types/src/payload-hash.js";
import {
  mhfaIndividualRegistrationSchema,
  assertRequiredAcknowledgments,
  splitRestrictedFields,
} from "../../packages/validation/src/mhfa-individual-registration.schema.js";

/**
 * POST /.netlify/functions/intake
 *
 * Governed intake gateway for MHFA-REG-01 (individual registration).
 *
 * Feature-flagged off by default (governance rule 30 — new production-capable
 * features default to inactive). Set MHFA_REG_01_ENABLED=true only after
 * Tiána has approved cutting this specific path over from the live Zap
 * (see docs/ARCHITECTURE_DECISIONS.md ADR-001). Until then this endpoint
 * validates and echoes a dry-run result — it does not persist anything and
 * must never be pointed at by a live form's Netlify Forms notification/webhook.
 *
 * Only mhfa-individual-registration is implemented. Other forms in
 * docs/FORM_REGISTRY.md are not yet handled here — see docs/IMPLEMENTATION_REGISTER.md.
 */

const SUPPORTED_FORMS = new Set(["mhfa-individual-registration"]);

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const featureEnabled = process.env.MHFA_REG_01_ENABLED === "true";

  let body: Record<string, unknown>;
  try {
    body = parseBody(event);
  } catch {
    return json(400, { error: "invalid_body" });
  }

  const formName = String(body["form-name"] ?? body["form_name"] ?? "");
  if (!SUPPORTED_FORMS.has(formName)) {
    return json(422, { error: "unsupported_form", formName });
  }

  const parsed = mhfaIndividualRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return json(422, { error: "validation_failed", issues: parsed.error.issues });
  }

  const missingAcknowledgments = assertRequiredAcknowledgments(parsed.data);
  if (missingAcknowledgments.length > 0) {
    return json(422, { error: "missing_required_acknowledgments", fields: missingAcknowledgments });
  }

  const { general, restricted } = splitRestrictedFields(parsed.data);
  const correlationId = generateCorrelationId("MHFA", "MHFA-REG-01");
  const payloadHash = canonicalPayloadHash(general);
  const hasRestrictedData = Object.keys(restricted).length > 0;

  // No persistence layer is wired up: both candidate Supabase projects are
  // paused pending approval (docs/DECISION_REGISTER.md, Decision 6). This
  // function is intentionally honest about that rather than claiming a write
  // that didn't happen (governance: "Do not represent mock data as production data").
  const persisted = false;

  return json(200, {
    status: featureEnabled ? "validated_not_persisted" : "dry_run_feature_disabled",
    correlationId,
    payloadHash,
    hasRestrictedData,
    persisted,
    note: featureEnabled
      ? "Validation passed. Supabase persistence is not yet connected — see docs/DECISION_REGISTER.md."
      : "MHFA_REG_01_ENABLED is not set. This is a validation-only dry run; no automation was triggered.",
  });
};

function parseBody(event: HandlerEvent): Record<string, unknown> {
  if (!event.body) return {};
  const contentType = event.headers["content-type"] ?? event.headers["Content-Type"] ?? "";
  if (contentType.includes("application/json")) {
    return JSON.parse(event.body);
  }
  // application/x-www-form-urlencoded (native Netlify Forms POST shape)
  const params = new URLSearchParams(event.body);
  return Object.fromEntries(params.entries());
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
