import type { Handler, HandlerEvent } from "@netlify/functions";
import { generateCorrelationId } from "../../packages/shared-types/src/correlation-id.js";
import { canonicalPayloadHash } from "../../packages/shared-types/src/payload-hash.js";
import {
  mhfaIndividualRegistrationSchema,
  assertRequiredAcknowledgments,
  splitRestrictedFields,
} from "../../packages/validation/src/mhfa-individual-registration.schema.js";
import {
  mhfaGroupTrainingInquirySchema,
  splitGroupInquiryRestrictedFields,
} from "../../packages/validation/src/mhfa-group-training-inquiry.schema.js";
import {
  mhfaAccommodationRequestSchema,
  toGeneralAccommodationPointer,
} from "../../packages/validation/src/mhfa-accommodation-request.schema.js";
import { mhfaAttendanceSchema } from "../../packages/validation/src/mhfa-attendance.schema.js";
import {
  mhfaEvaluationSchema,
  splitEvaluationFreeText,
} from "../../packages/validation/src/mhfa-evaluation.schema.js";
import {
  mhfaComplaintSchema,
  toGeneralComplaintPointer,
} from "../../packages/validation/src/mhfa-complaint.schema.js";

/**
 * POST /.netlify/functions/intake
 *
 * Governed intake gateway. Each supported form has its own feature flag
 * (governance rule 30 — new production-capable features default to
 * inactive) and is only enabled after Tiána approves cutting that specific
 * path over from its live Zap (see docs/ARCHITECTURE_DECISIONS.md ADR-001).
 * Until then, every path validates and returns a dry-run result — nothing
 * is persisted and nothing must be pointed at by a live form's Netlify
 * Forms notification/webhook.
 *
 * See docs/FORM_REGISTRY.md for the full form inventory; only the forms
 * below are implemented so far (docs/IMPLEMENTATION_REGISTER.md).
 */

interface FormHandlerResult {
  domain: string;
  automationCode: string;
  featureFlag: string;
  hasRestrictedData: boolean;
  generalPayload: Record<string, unknown>;
}

type FormHandler = (body: Record<string, unknown>) => { ok: true; result: FormHandlerResult } | { ok: false; status: number; body: unknown };

const FORM_HANDLERS: Record<string, FormHandler> = {
  "mhfa-individual-registration": (body) => {
    const parsed = mhfaIndividualRegistrationSchema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    const missing = assertRequiredAcknowledgments(parsed.data);
    if (missing.length > 0) {
      return { ok: false, status: 422, body: { error: "missing_required_acknowledgments", fields: missing } };
    }

    const { general, restricted } = splitRestrictedFields(parsed.data);
    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-REG-01",
        featureFlag: "MHFA_REG_01_ENABLED",
        hasRestrictedData: Object.keys(restricted).length > 0,
        generalPayload: general,
      },
    };
  },

  "mhfa-group-training-inquiry": (body) => {
    const parsed = mhfaGroupTrainingInquirySchema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    const { general, restricted } = splitGroupInquiryRestrictedFields(parsed.data);
    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-GRP-01",
        featureFlag: "MHFA_GRP_01_ENABLED",
        hasRestrictedData: Object.keys(restricted).length > 0,
        generalPayload: general,
      },
    };
  },

  "mhfa-accommodation-request": (body) => {
    const parsed = mhfaAccommodationRequestSchema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    // Entire form is Restricted (governance): only a sanitized pointer is
    // ever eligible for a general-purpose payload/log.
    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-ACC-01",
        featureFlag: "MHFA_ACC_01_ENABLED",
        hasRestrictedData: true,
        generalPayload: toGeneralAccommodationPointer(parsed.data),
      },
    };
  },

  "FORM-MHFA-014": (body) => {
    const parsed = mhfaAttendanceSchema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-ATT-01",
        featureFlag: "MHFA_ATT_01_ENABLED",
        hasRestrictedData: false,
        generalPayload: parsed.data,
      },
    };
  },

  "FORM-MHFA-011": (body) => {
    const parsed = mhfaEvaluationSchema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    const { scores, freeText } = splitEvaluationFreeText(parsed.data);
    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-EVAL-01",
        featureFlag: "MHFA_EVAL_01_ENABLED",
        hasRestrictedData: Object.keys(freeText).length > 0,
        generalPayload: scores,
      },
    };
  },

  "FORM-MHFA-013": (body) => {
    const parsed = mhfaComplaintSchema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    // Entire form is Restricted (governance + CEO decision doc): narrative
    // routes to TRAIN-19-equivalent protected storage, never general logs.
    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-COMP-01",
        featureFlag: "MHFA_COMP_01_ENABLED",
        hasRestrictedData: true,
        generalPayload: toGeneralComplaintPointer(parsed.data),
      },
    };
  },
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  let body: Record<string, unknown>;
  try {
    body = parseBody(event);
  } catch {
    return json(400, { error: "invalid_body" });
  }

  const formName = String(body["form-name"] ?? body["form_name"] ?? "");
  const formHandler = FORM_HANDLERS[formName];
  if (!formHandler) {
    return json(422, { error: "unsupported_form", formName });
  }

  const outcome = formHandler(body);
  if (!outcome.ok) {
    return json(outcome.status, outcome.body);
  }

  const { domain, automationCode, featureFlag, hasRestrictedData, generalPayload } = outcome.result;
  const featureEnabled = process.env[featureFlag] === "true";
  const correlationId = generateCorrelationId(domain, automationCode);
  const payloadHash = canonicalPayloadHash(generalPayload);

  // No persistence layer is wired up: both candidate Supabase projects are
  // paused pending approval (docs/DECISION_REGISTER.md, Decision 6). This
  // function is intentionally honest about that rather than claiming a write
  // that didn't happen (governance: "Do not represent mock data as production data").
  const persisted = false;

  return json(200, {
    status: featureEnabled ? "validated_not_persisted" : "dry_run_feature_disabled",
    automationCode,
    correlationId,
    payloadHash,
    hasRestrictedData,
    persisted,
    note: featureEnabled
      ? "Validation passed. Supabase persistence is not yet connected — see docs/DECISION_REGISTER.md."
      : `${featureFlag} is not set. This is a validation-only dry run; no automation was triggered.`,
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
