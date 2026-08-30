import type { Handler } from "@netlify/functions";
import { queryDatabaseLegacy, NotionNotConfiguredError } from "../../packages/integration-notion/src/client.js";
import { classifySessionReminder, type SessionInfo, type RegistrationReminderInfo } from "../../packages/integration-notion/src/session-reminder.js";

/**
 * AUTO-08 Session Reminder Cadence replacement (MHFA-SESSREM-01) — REPORT
 * ONLY.
 *
 * GET /.netlify/functions/session-reminder-check
 *
 * Joins MHFA-02 (Seat Status Confirmed) to MHFA-01's real Start Date and
 * classifies each registration into the real, CEO-decided 5-touch cadence
 * (14/7/3/1-day + morning-of) -- see
 * packages/integration-notion/src/session-reminder.ts for why this stays
 * report-only despite the cadence itself being settled: the five per-bucket
 * "Sent" idempotency fields don't exist yet on MHFA-02, and this hub has no
 * email-send integration.
 */

// Database page IDs (not data source IDs) -- queryDatabaseLegacy uses the
// pre-2025-09-03 /databases/{id}/query endpoint. See NOTION_MAPPING.md.
const MHFA_01_DATABASE_ID = "89649428-f379-405d-a66f-b9215d757b42";
const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";

const KNOWN_GAPS = [
  "The five per-bucket idempotency fields (`14-Day Sent`, `7-Day Sent`, `3-Day Sent`, `1-Day Sent`, `Morning-Of Sent`) don't exist yet on the live MHFA-02 schema -- the real AUTO-08 build sheet itself says 'create if they don't exist.' Without them, an automated sender could not tell whether a given touch already went out for a registration.",
  "This hub has no email-send integration built yet (Microsoft Graph access here is read/search only) -- Emails 8/9/21/22/23 are not wired to anything, and per the real build sheet, Emails 21/22/23 are still drafted-not-final in COMMS-02.",
];

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  if (process.env.MHFA_SESSREM_01_ENABLED !== "true") {
    return json(200, {
      status: "dry_run_feature_disabled",
      note: "MHFA_SESSREM_01_ENABLED is not set. This endpoint only ever reports candidates -- it never writes to Notion or sends anything regardless of this flag -- but stays consistent with every other path in this hub by still gating on a flag.",
    });
  }

  let sessionsByPageId: Map<string, SessionInfo>;
  try {
    const result = await queryDatabaseLegacy(MHFA_01_DATABASE_ID, {
      property: "Start Date",
      date: { is_not_empty: true },
    });
    sessionsByPageId = new Map(
      result.results
        .map((page): [string, SessionInfo] | null => {
          const props = page.properties as Record<string, any>;
          const sessionCode = props["Session Code"]?.title?.[0]?.plain_text;
          const startDateIso = props["Start Date"]?.date?.start;
          if (!sessionCode || !startDateIso) return null;
          return [page.id, { pageId: page.id, sessionCode, startDateIso }];
        })
        .filter((entry): entry is [string, SessionInfo] => entry !== null)
    );
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed_sessions", detail: String(err) });
  }

  let registrations: RegistrationReminderInfo[];
  try {
    const result = await queryDatabaseLegacy(MHFA_02_DATABASE_ID, {
      property: "Seat Status",
      status: { equals: "Confirmed" },
    });
    registrations = result.results
      .map((page): RegistrationReminderInfo | null => {
        const props = page.properties as Record<string, any>;
        const registrationCode = props["Registration Code"]?.title?.[0]?.plain_text;
        const sessionRelations = props.Session?.relation as Array<{ id: string }> | undefined;
        if (!registrationCode) return null;
        const sessionPageId = sessionRelations?.[0]?.id;
        return sessionPageId
          ? { pageId: page.id, registrationCode, sessionPageId }
          : { pageId: page.id, registrationCode };
      })
      .filter((r): r is RegistrationReminderInfo => r !== null);
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed_registrations", detail: String(err) });
  }

  const now = new Date();
  const classified = registrations
    .map((reg) => classifySessionReminder(reg, sessionsByPageId, now))
    .filter((c) => c.bucket !== "no_action");

  return json(200, {
    status: "report_only_no_writes_no_sends",
    checkedAt: now.toISOString(),
    confirmedRegistrationsChecked: registrations.length,
    buckets: {
      fourteenDay: classified.filter((c) => c.bucket === "14_day"),
      sevenDay: classified.filter((c) => c.bucket === "7_day"),
      threeDay: classified.filter((c) => c.bucket === "3_day"),
      oneDay: classified.filter((c) => c.bucket === "1_day"),
      morningOf: classified.filter((c) => c.bucket === "morning_of"),
    },
    knownGaps: KNOWN_GAPS,
    note: "These are candidates for human review, matching the real 14/7/3/1-day + morning-of cadence. Nothing was written to Notion and no email was sent.",
  });
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
