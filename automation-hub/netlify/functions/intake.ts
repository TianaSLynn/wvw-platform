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
import { mhfaCertificateCorrectionSchema } from "../../packages/validation/src/mhfa-certificate-correction.schema.js";
import {
  mhfaPreworkSupportSchema,
  mhfaPaymentReconciliationSchema,
} from "../../packages/validation/src/mhfa-postwork.schema.js";
import {
  formMhfa001Schema,
  assertRequiredAcknowledgments as assertFormMhfa001Acknowledgments,
} from "../../packages/validation/src/form-mhfa-001.schema.js";
import {
  formMhfa002Schema,
  assertRequiredAcknowledgments as assertFormMhfa002Acknowledgments,
} from "../../packages/validation/src/form-mhfa-002.schema.js";
import { createPage, NotionNotConfiguredError, NotionApiError } from "../../packages/integration-notion/src/client.js";
import {
  namedRegistrationFormToHubRegistration,
  formMhfa001ToHubRegistration,
  registrationToNotionProperties,
} from "../../packages/integration-notion/src/mappers.js";
import { createGroupOpportunity, type GroupOpportunityResult } from "../../packages/integration-notion/src/group-opportunity.js";
import { logWorkflowExecution } from "../../packages/integration-postgres/src/workflow-log.js";

// MHFA-02 | Learners & Registrations, confirmed live 2026-08-03 (docs/NOTION_MAPPING.md).
const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";

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
  /**
   * When present, this path can write a real Notion record once its feature
   * flag is on and NOTION_API_KEY is configured. Absent = validation/dry-run
   * only, same as every other path today.
   */
  notionRegistration?: (correlationId: string) => ReturnType<typeof namedRegistrationFormToHubRegistration>;
  /**
   * MHFA-GRP-01 only: unlike notionRegistration (one synchronous mapping +
   * one createPage call in the shared flow below), a group/private
   * opportunity needs multiple Notion lookups/writes (find-or-create
   * Organization, find-or-create Contact, then create Opportunity), so it
   * owns its own async orchestration instead of fitting the single-createPage
   * shape.
   */
  groupOpportunityWrite?: (correlationId: string) => Promise<GroupOpportunityResult>;
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
        notionRegistration: (correlationId) => namedRegistrationFormToHubRegistration(parsed.data, correlationId),
      },
    };
  },

  "FORM-MHFA-001": (body) => {
    const parsed = formMhfa001Schema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    const missing = assertFormMhfa001Acknowledgments(parsed.data);
    if (missing.length > 0) {
      return { ok: false, status: 422, body: { error: "missing_required_acknowledgments", fields: missing } };
    }

    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-REG-01",
        featureFlag: "MHFA_REG_01_ENABLED",
        hasRestrictedData: false,
        generalPayload: parsed.data,
        notionRegistration: (correlationId) => formMhfa001ToHubRegistration(parsed.data, correlationId),
      },
    };
  },

  "FORM-MHFA-002": (body) => {
    const parsed = formMhfa002Schema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    const missing = assertFormMhfa002Acknowledgments(parsed.data);
    if (missing.length > 0) {
      return { ok: false, status: 422, body: { error: "missing_required_acknowledgments", fields: missing } };
    }

    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-GRP-01",
        featureFlag: "MHFA_GRP_01_ENABLED",
        hasRestrictedData: false,
        generalPayload: parsed.data,
        groupOpportunityWrite: (correlationId) => createGroupOpportunity(parsed.data, correlationId),
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

  "FORM-MHFA-008": (body) => {
    const parsed = mhfaCertificateCorrectionSchema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-CERT-CORR-01",
        featureFlag: "MHFA_CERT_CORR_01_ENABLED",
        hasRestrictedData: false,
        generalPayload: parsed.data,
      },
    };
  },

  "FORM-MHFA-010": (body) => {
    const parsed = mhfaPreworkSupportSchema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-POST-01",
        featureFlag: "MHFA_POST_01_ENABLED",
        hasRestrictedData: false,
        generalPayload: parsed.data,
      },
    };
  },

  "FORM-MHFA-016": (body) => {
    const parsed = mhfaPaymentReconciliationSchema.safeParse(body);
    if (!parsed.success) return { ok: false, status: 422, body: { error: "validation_failed", issues: parsed.error.issues } };

    return {
      ok: true,
      result: {
        domain: "MHFA",
        automationCode: "MHFA-POST-01",
        featureFlag: "MHFA_POST_01_ENABLED",
        hasRestrictedData: false,
        generalPayload: parsed.data,
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

  const { domain, automationCode, featureFlag, hasRestrictedData, generalPayload, notionRegistration, groupOpportunityWrite } = outcome.result;
  const featureEnabled = process.env[featureFlag] === "true";
  const correlationId = generateCorrelationId(domain, automationCode);
  const payloadHash = canonicalPayloadHash(generalPayload);

  // Notion remains the system of record for this hub (ADR-003). "persisted"
  // here reflects whether a real Notion write happened for THIS response,
  // not whether a workflow_executions audit-log row was also written --
  // that's a separate, best-effort side effect (see logWorkflowExecution
  // calls below), gated on its own flag, and never changes this value.
  const persisted = false;

  if (!featureEnabled) {
    return json(200, {
      status: "dry_run_feature_disabled",
      automationCode,
      correlationId,
      payloadHash,
      hasRestrictedData,
      persisted,
      note: `${featureFlag} is not set. This is a validation-only dry run; no automation was triggered.`,
    });
  }

  // Feature is on. If this path has a Notion mapping, attempt a real write
  // and report exactly what happened -- never a bare "validated" status that
  // could be mistaken for "tracked."
  if (notionRegistration) {
    try {
      const registration = notionRegistration(correlationId);
      const page = await createPage(MHFA_02_DATABASE_ID, registrationToNotionProperties(registration));
      await logWorkflowExecution({
        correlationId,
        automationCode,
        status: "completed",
        trigger: formName,
        inputSnapshot: generalPayload,
        outputSnapshot: { notionPageId: page.id, notionPageUrl: page.url },
      });
      return json(200, {
        status: "notion_write_succeeded",
        automationCode,
        correlationId,
        payloadHash,
        hasRestrictedData,
        persisted: true,
        notionPageId: page.id,
        notionPageUrl: page.url,
        note: "Written to MHFA-02 | Learners & Registrations.",
      });
    } catch (err) {
      if (err instanceof NotionNotConfiguredError) {
        await logWorkflowExecution({
          correlationId,
          automationCode,
          status: "failed_retryable",
          trigger: formName,
          inputSnapshot: generalPayload,
          errorCode: "notion_not_configured",
          errorSummary: "NOTION_API_KEY is not set",
          retryable: true,
        });
        return json(502, {
          status: "notion_not_configured",
          automationCode,
          correlationId,
          payloadHash,
          hasRestrictedData,
          persisted: false,
          note: `${featureFlag} is on but NOTION_API_KEY is not set — nothing was written. Fix the misconfiguration rather than treating this as success.`,
        });
      }
      if (err instanceof NotionApiError) {
        await logWorkflowExecution({
          correlationId,
          automationCode,
          status: "failed_retryable",
          trigger: formName,
          inputSnapshot: generalPayload,
          errorCode: `notion_api_error_${err.status}`,
          errorSummary: JSON.stringify(err.body),
          retryable: true,
        });
        return json(502, {
          status: "notion_write_failed",
          automationCode,
          correlationId,
          payloadHash,
          hasRestrictedData,
          persisted: false,
          notionError: { status: err.status, body: err.body },
          note: "Notion API rejected the write -- see notionError for the real cause (commonly a missing integration capability).",
        });
      }
      throw err;
    }
  }

  // MHFA-GRP-01 only: a group/private opportunity needs multiple Notion
  // lookups/writes (find-or-create Organization, find-or-create Contact,
  // then create Opportunity) instead of the single createPage above.
  if (groupOpportunityWrite) {
    try {
      const result = await groupOpportunityWrite(correlationId);
      await logWorkflowExecution({
        correlationId,
        automationCode,
        status: "completed",
        trigger: formName,
        inputSnapshot: generalPayload,
        outputSnapshot: {
          notionPageId: result.opportunityPageId,
          notionPageUrl: result.opportunityUrl,
          organizationPageId: result.organizationPageId,
          contactPageId: result.contactPageId,
        },
      });
      return json(200, {
        status: "notion_write_succeeded",
        automationCode,
        correlationId,
        payloadHash,
        hasRestrictedData,
        persisted: true,
        notionPageId: result.opportunityPageId,
        notionPageUrl: result.opportunityUrl,
        organizationPageId: result.organizationPageId,
        organizationCreated: result.organizationCreated,
        contactPageId: result.contactPageId,
        contactCreated: result.contactCreated,
        note: "Written to MHFA-03 | Organizations & Group Opportunities (plus Organization and Contact records, created only if they didn't already exist).",
      });
    } catch (err) {
      if (err instanceof NotionNotConfiguredError) {
        await logWorkflowExecution({
          correlationId,
          automationCode,
          status: "failed_retryable",
          trigger: formName,
          inputSnapshot: generalPayload,
          errorCode: "notion_not_configured",
          errorSummary: "NOTION_API_KEY is not set",
          retryable: true,
        });
        return json(502, {
          status: "notion_not_configured",
          automationCode,
          correlationId,
          payloadHash,
          hasRestrictedData,
          persisted: false,
          note: `${featureFlag} is on but NOTION_API_KEY is not set — nothing was written. Fix the misconfiguration rather than treating this as success.`,
        });
      }
      if (err instanceof NotionApiError) {
        await logWorkflowExecution({
          correlationId,
          automationCode,
          status: "failed_retryable",
          trigger: formName,
          inputSnapshot: generalPayload,
          errorCode: `notion_api_error_${err.status}`,
          errorSummary: JSON.stringify(err.body),
          retryable: true,
        });
        return json(502, {
          status: "notion_write_failed",
          automationCode,
          correlationId,
          payloadHash,
          hasRestrictedData,
          persisted: false,
          notionError: { status: err.status, body: err.body },
          note: "Notion API rejected a write in the Organization/Contact/Opportunity sequence -- see notionError. Any earlier step(s) in the sequence that already succeeded were NOT rolled back (see group-opportunity.ts for why).",
        });
      }
      throw err;
    }
  }

  await logWorkflowExecution({
    correlationId,
    automationCode,
    status: "completed_with_warning",
    trigger: formName,
    inputSnapshot: generalPayload,
    outputSnapshot: { note: "validated_not_persisted -- no Notion mapping exists yet for this path" },
  });
  return json(200, {
    status: "validated_not_persisted",
    automationCode,
    correlationId,
    payloadHash,
    hasRestrictedData,
    persisted,
    note: "Validation passed. No Notion mapping exists yet for this path — see docs/IMPLEMENTATION_REGISTER.md.",
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
