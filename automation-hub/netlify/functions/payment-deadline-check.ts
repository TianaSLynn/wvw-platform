import type { Handler } from "@netlify/functions";
import { queryDatabaseLegacy, NotionNotConfiguredError } from "../../packages/integration-notion/src/client.js";
import { classifyDeadline, type RegistrationDeadlineInfo } from "../../packages/integration-notion/src/payment-deadline.js";

/**
 * AUTO-03 Payment Reminder and Registration Expiration replacement
 * (MHFA-PAY-02) — REPORT ONLY.
 *
 * GET /.netlify/functions/payment-deadline-check
 *
 * Identifies MHFA-02 registrations whose Payment Deadline has passed or is
 * approaching, bucketed for human review. Deliberately never sends a
 * reminder email or writes Seat Status = "Expired" -- see
 * packages/integration-notion/src/payment-deadline.ts for why: the real
 * spec's idempotency fields (`24hr Reminder Sent`, `Final Reminder Sent`)
 * don't exist yet on the live MHFA-02 schema, and this hub has no
 * email-send integration built. Always feature-flag gated like every other
 * path, even though it's read-only, so its presence/absence in a response
 * is consistent with the rest of the system.
 */

// Database page ID (not data source ID) -- queryDatabaseLegacy uses the
// pre-2025-09-03 /databases/{id}/query endpoint. See NOTION_MAPPING.md.
const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";

const KNOWN_GAPS = [
  "No `24hr Reminder Sent` / `Final Reminder Sent` checkbox fields exist yet on the live MHFA-02 schema -- required by the real AUTO-03 build sheet so a reminder fires exactly once. Without them, an automated sender could not tell whether a given registration's reminder already went out.",
  "This hub has no email-send integration built yet (Microsoft Graph access here is read/search only) -- Email 3/4/5 (24-Hour Reminder, Final Reminder, Registration Expired) are not wired to anything.",
  "Auto-writing Seat Status = \"Expired\" on the real registration is not done here -- that's a real state change with no rollback path from this report-only tool, and AUTO-03 is rated Risk: High in the live Automation Registry with an explicit production-approval gate.",
];

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  if (process.env.MHFA_PAY_02_ENABLED !== "true") {
    return json(200, {
      status: "dry_run_feature_disabled",
      note: "MHFA_PAY_02_ENABLED is not set. This endpoint only ever reports candidates -- it never writes to Notion or sends anything regardless of this flag -- but stays consistent with every other path in this hub by still gating on a flag.",
    });
  }

  let registrations: RegistrationDeadlineInfo[];
  try {
    const result = await queryDatabaseLegacy(MHFA_02_DATABASE_ID, {
      property: "Payment Deadline",
      date: { is_not_empty: true },
    });
    registrations = result.results
      .map((page) => {
        const props = page.properties as Record<string, any>;
        const email = props.Email?.email;
        const registrationCode = props["Registration Code"]?.title?.[0]?.plain_text;
        const paymentStatus = props["Payment Status"]?.status?.name;
        const paymentDeadlineIso = props["Payment Deadline"]?.date?.start;
        if (!email || !registrationCode || !paymentStatus || !paymentDeadlineIso) return null;
        return { email, registrationCode, pageId: page.id, paymentStatus, paymentDeadlineIso };
      })
      .filter((r): r is RegistrationDeadlineInfo => r !== null);
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed", detail: String(err) });
  }

  const now = new Date();
  const classified = registrations.map((reg) => classifyDeadline(reg, now));

  const expired = classified.filter((c) => c.bucket === "expired");
  const finalReminderDue = classified.filter((c) => c.bucket === "final_reminder_due");
  const reminderDue = classified.filter((c) => c.bucket === "reminder_due");

  return json(200, {
    status: "report_only_no_writes_no_sends",
    checkedAt: now.toISOString(),
    registrationsWithDeadlineSet: registrations.length,
    buckets: { expired, finalReminderDue, reminderDue },
    knownGaps: KNOWN_GAPS,
    note: "These are candidates for human review. Nothing was written to Notion and no email was sent.",
  });
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
