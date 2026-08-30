import type { Handler } from "@netlify/functions";
import { NotionNotConfiguredError, NotionApiError } from "../../packages/integration-notion/src/client.js";
import { recordException } from "../../packages/integration-notion/src/exception-recorder-orchestration.js";
import { REAL_EXCEPTION_TYPES, REAL_WORKFLOW_CODES, REAL_SEVERITIES } from "../../packages/integration-notion/src/exception-recorder.js";

/**
 * AUTO-13 Exception Alert and Retry replacement (MHFA-EXCEPTION-01).
 *
 * POST /.netlify/functions/record-exception
 * Body: { correlationId, workflowCode, exceptionType, severity, errorDetail, registrationPageId?, sessionPageId? }
 *
 * A reusable primitive other automations in this hub can call when they
 * hit a terminal error: dedups against an existing open MHFA-05 exception
 * by correlation ID (incrementing instead of re-alerting), or creates a
 * new one -- see packages/integration-notion/src/exception-recorder.ts.
 *
 * Scope note: this delivers the reusable primitive itself. None of this
 * hub's other functions call it yet on their own failures -- wiring all of
 * them in is a separate follow-up, not done in this pass. "Email/Teams
 * alert to owner" also has no integration here -- known gap, same as every
 * other automation that needs to send something.
 */

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  if (process.env.MHFA_EXCEPTION_01_ENABLED !== "true") {
    return json(200, {
      status: "dry_run_feature_disabled",
      note: "MHFA_EXCEPTION_01_ENABLED is not set. No Notion write was attempted.",
    });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "invalid_json_body" });
  }

  const { correlationId, workflowCode, exceptionType, severity, errorDetail, registrationPageId, sessionPageId } = body as Record<string, string | undefined>;

  if (!correlationId || !errorDetail) {
    return json(422, { error: "validation_failed", detail: "correlationId and errorDetail are required." });
  }
  if (!workflowCode || !REAL_WORKFLOW_CODES.includes(workflowCode as any)) {
    return json(422, { error: "validation_failed", detail: `workflowCode must be one of: ${REAL_WORKFLOW_CODES.join(", ")}` });
  }
  if (!exceptionType || !REAL_EXCEPTION_TYPES.includes(exceptionType as any)) {
    return json(422, { error: "validation_failed", detail: `exceptionType must be one of the real live MHFA-05 options: ${REAL_EXCEPTION_TYPES.join(", ")}` });
  }
  if (!severity || !REAL_SEVERITIES.includes(severity as any)) {
    return json(422, { error: "validation_failed", detail: `severity must be one of: ${REAL_SEVERITIES.join(", ")}` });
  }

  try {
    const result = await recordException({
      correlationId,
      workflowCode: workflowCode as any,
      exceptionType: exceptionType as any,
      severity: severity as any,
      errorDetail,
      registrationPageId,
      sessionPageId,
    });
    return json(200, {
      status: "notion_write_succeeded",
      ...result,
      note:
        result.action === "created"
          ? "New MHFA-05 exception record created. No email/Teams alert was sent -- this hub has no alert-send integration yet."
          : "Existing open exception found and its occurrence count incremented -- no duplicate alert.",
    });
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    if (err instanceof NotionApiError) {
      return json(502, { status: "notion_write_failed", notionError: { status: err.status, body: err.body } });
    }
    throw err;
  }
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
