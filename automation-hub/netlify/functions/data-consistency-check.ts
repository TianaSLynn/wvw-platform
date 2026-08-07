import type { Handler } from "@netlify/functions";
import { queryDatabaseLegacy, NotionNotConfiguredError } from "../../packages/integration-notion/src/client.js";
import { findDuplicateEmails, findOrphanRegistrations, type RegistrationForConsistency } from "../../packages/integration-notion/src/data-consistency.js";

/**
 * AUTO-14 Data Reconciliation replacement (MHFA-RECONCILE-01) — SCOPED,
 * REPORT ONLY.
 *
 * GET /.netlify/functions/data-consistency-check
 *
 * Deliberately scoped down from the full real spec -- see
 * packages/integration-notion/src/data-consistency.ts for why the
 * cross-system (Forms/Excel/Wave/MHFA Connect) reconciliation isn't
 * attempted here. This only checks what needs no invented tolerance rule:
 * duplicate registrations by email, and registrations with no linked
 * session. Never writes or deletes anything, per the real spec's own
 * "never auto-delete."
 */

const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";

const SCOPE_NOTE =
  "This is a SCOPED subset of the real AUTO-14 spec, not the full cross-system reconciliation. " +
  "Checks Notion-internal consistency only (duplicate emails, orphan registrations) -- these need no tolerance rule. " +
  "Wave-vs-Notion payment reconciliation is already covered separately by MHFA-PAY-01 (GET /reconcile-payments), not repeated here. " +
  "Cross-system checks against Forms/Excel intake, MHFA Connect, attendance, and certification are not attempted -- " +
  "the real build sheet lists 'tolerance rules' and 'report destination' as still undefined, and guessing either risks a false mismatch report.";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  if (process.env.MHFA_RECONCILE_01_ENABLED !== "true") {
    return json(200, {
      status: "dry_run_feature_disabled",
      note: "MHFA_RECONCILE_01_ENABLED is not set. This endpoint only ever reports -- it never writes or deletes anything regardless of this flag -- but stays consistent with every other path in this hub by still gating on a flag.",
    });
  }

  let registrations: RegistrationForConsistency[];
  try {
    const result = await queryDatabaseLegacy(MHFA_02_DATABASE_ID);
    registrations = result.results
      .map((page): RegistrationForConsistency | null => {
        const props = page.properties as Record<string, any>;
        const registrationCode = props["Registration Code"]?.title?.[0]?.plain_text;
        const email = props.Email?.email;
        const sessionRelations = props.Session?.relation as Array<{ id: string }> | undefined;
        if (!registrationCode || !email) return null;
        const sessionPageId = sessionRelations?.[0]?.id;
        return sessionPageId
          ? { pageId: page.id, registrationCode, email, sessionPageId }
          : { pageId: page.id, registrationCode, email };
      })
      .filter((r): r is RegistrationForConsistency => r !== null);
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed", detail: String(err) });
  }

  return json(200, {
    status: "report_only_no_writes_scoped_subset",
    checkedAt: new Date().toISOString(),
    registrationsChecked: registrations.length,
    duplicateEmails: findDuplicateEmails(registrations),
    orphanRegistrations: findOrphanRegistrations(registrations),
    scopeNote: SCOPE_NOTE,
  });
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
