import type { Handler } from "@netlify/functions";
import { NotionNotConfiguredError, NotionApiError } from "../../packages/integration-notion/src/client.js";
import { findReadyRegistrations, ensureReadinessQueueItems } from "../../packages/integration-notion/src/mhfa-connect-readiness-orchestration.js";
import { generateCorrelationId } from "../../packages/shared-types/src/correlation-id.js";
import { recordException } from "../../packages/integration-notion/src/exception-recorder-orchestration.js";

/**
 * AUTO-06 MHFA Connect Enrollment Readiness replacement (MHFA-CONNECT-01).
 *
 * GET /.netlify/functions/mhfa-connect-readiness
 *
 * Finds registrations that are Paid, Seat Status Confirmed, and MHFA
 * Connect Status Not Registered, and creates an internal MHFA-05 |
 * Automation & Exception Queue item for each one not already queued -- see
 * packages/integration-notion/src/mhfa-connect-readiness.ts for why this
 * only ever writes an internal task, never a customer email or an
 * MHFA Connect API call (none exists in this hub, matching the real
 * AUTO-06 spec).
 *
 * On-demand only for now -- no scheduled/cron trigger wired up yet in this
 * hub (the real spec's trigger is "Registration becomes Confirmed and
 * Paid, or scheduled readiness scan"; a scheduled Netlify Function is a
 * separate follow-up, not required for this endpoint to be useful today).
 */

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  if (process.env.MHFA_CONNECT_01_ENABLED !== "true") {
    return json(200, {
      status: "dry_run_feature_disabled",
      note: "MHFA_CONNECT_01_ENABLED is not set. No candidates were queried and nothing was written.",
    });
  }

  let candidates;
  try {
    candidates = await findReadyRegistrations();
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed", detail: String(err) });
  }

  let results;
  try {
    results = await ensureReadinessQueueItems(candidates, (registrationCode) => generateCorrelationId("MHFA", "MHFA-CONNECT-01"));
  } catch (err) {
    if (err instanceof NotionApiError) {
      // AUTO-13 (MHFA-EXCEPTION-01) wiring: this is the one place in this
      // hub where a write failure has an honest match among MHFA-05's real
      // Exception Type options -- a failed write here means a registration
      // that's missing MHFA Connect registration also failed to get
      // queued for a human to handle, which "Missing MHFA Connect
      // Registration" genuinely describes. Gated on its own flag (separate
      // from MHFA_CONNECT_01_ENABLED) so this stays inert until that path
      // is separately approved -- matches every other automation's
      // explicit-approval-per-path pattern. Never let exception-recording
      // itself break the real error response to the caller.
      if (process.env.MHFA_EXCEPTION_01_ENABLED === "true") {
        try {
          await recordException({
            correlationId: generateCorrelationId("MHFA", "MHFA-CONNECT-01"),
            workflowCode: "WF-CONNECT",
            exceptionType: "Missing MHFA Connect Registration",
            severity: "High",
            errorDetail: `mhfa-connect-readiness write failed: ${JSON.stringify({ status: err.status, body: err.body })}`,
          });
        } catch {
          // Exception-recording is best-effort here -- the caller still
          // needs the real notion_write_failed response below regardless.
        }
      }
      return json(502, {
        status: "notion_write_failed",
        notionError: { status: err.status, body: err.body },
        note: "Notion API rejected a write while creating queue items -- see notionError. Items created before the failure were NOT rolled back.",
      });
    }
    throw err;
  }

  return json(200, {
    status: "processed",
    readyRegistrationsFound: candidates.length,
    created: results.filter((r) => r.action === "created").length,
    alreadyQueued: results.filter((r) => r.action === "already_queued").length,
    results,
    note: "Each 'created' entry is a new internal MHFA-05 task for a human to manually enroll the learner in MHFA Connect. No email was sent and no MHFA Connect API was called.",
  });
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
