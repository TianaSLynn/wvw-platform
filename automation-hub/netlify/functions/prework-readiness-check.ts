import type { Handler } from "@netlify/functions";
import { queryDatabaseLegacy, NotionNotConfiguredError } from "../../packages/integration-notion/src/client.js";
import { classifyPrework, type SessionInfo, type RegistrationPreworkInfo } from "../../packages/integration-notion/src/prework-readiness.js";

/**
 * AUTO-07 Pre-Work Reminder replacement (MHFA-PREWORK-01) — REPORT ONLY.
 *
 * GET /.netlify/functions/prework-readiness-check
 *
 * Joins MHFA-02 (Paid, Confirmed, pre-work not Complete) to MHFA-01's real
 * Start Date and reports whether each registration's session has already
 * passed with pre-work still incomplete, or is still upcoming -- see
 * packages/integration-notion/src/prework-readiness.ts for why this never
 * guesses a "reminder window" size or sends anything.
 */

// Database page IDs (not data source IDs) -- queryDatabaseLegacy uses the
// pre-2025-09-03 /databases/{id}/query endpoint. See NOTION_MAPPING.md.
const MHFA_01_DATABASE_ID = "89649428-f379-405d-a66f-b9215d757b42";
const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";

const KNOWN_GAPS = [
  "No defined 'reminder window' size exists in any live doc checked -- the real AUTO-07 build sheet itself lists 'reminder windows' under 'Connection values still required,' meaning Tiána hasn't set this yet. Rather than guess a number of days, this only reports whether pre-work is incomplete relative to the session's real Start Date, not a specific reminder cadence.",
  "No 'Pre-Work Reminder Sent' idempotency field exists yet on MHFA-02 -- needed for a real automated sender to fire exactly once per cadence.",
  "This hub has no email-send integration built yet (Microsoft Graph access here is read/search only).",
];

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  if (process.env.MHFA_PREWORK_01_ENABLED !== "true") {
    return json(200, {
      status: "dry_run_feature_disabled",
      note: "MHFA_PREWORK_01_ENABLED is not set. This endpoint only ever reports candidates -- it never writes to Notion or sends anything regardless of this flag -- but stays consistent with every other path in this hub by still gating on a flag.",
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

  let registrations: RegistrationPreworkInfo[];
  try {
    const result = await queryDatabaseLegacy(MHFA_02_DATABASE_ID, {
      and: [
        { property: "Payment Status", status: { equals: "Paid" } },
        { property: "Seat Status", status: { equals: "Confirmed" } },
        { property: "Pre-Work Status", status: { does_not_equal: "Complete" } },
      ],
    });
    registrations = result.results
      .map((page): RegistrationPreworkInfo | null => {
        const props = page.properties as Record<string, any>;
        const registrationCode = props["Registration Code"]?.title?.[0]?.plain_text;
        const preWorkStatus = props["Pre-Work Status"]?.status?.name;
        const sessionRelations = props.Session?.relation as Array<{ id: string }> | undefined;
        if (!registrationCode || !preWorkStatus) return null;
        const sessionPageId = sessionRelations?.[0]?.id;
        return sessionPageId
          ? { pageId: page.id, registrationCode, preWorkStatus, sessionPageId }
          : { pageId: page.id, registrationCode, preWorkStatus };
      })
      .filter((r): r is RegistrationPreworkInfo => r !== null);
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed_registrations", detail: String(err) });
  }

  const now = new Date();
  const classified = registrations.map((reg) => classifyPrework(reg, sessionsByPageId, now));

  return json(200, {
    status: "report_only_no_writes_no_sends",
    checkedAt: now.toISOString(),
    registrationsChecked: registrations.length,
    buckets: {
      sessionPassedIncomplete: classified.filter((c) => c.bucket === "session_passed_incomplete"),
      upcomingIncomplete: classified.filter((c) => c.bucket === "upcoming_incomplete"),
      noSessionDate: classified.filter((c) => c.bucket === "no_session_date"),
    },
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
