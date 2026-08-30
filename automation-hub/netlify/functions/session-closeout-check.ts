import type { Handler } from "@netlify/functions";
import { queryDatabaseLegacy, relationContainsFilter, NotionNotConfiguredError } from "../../packages/integration-notion/src/client.js";
import { summarizeCloseout, type SessionForCloseout, type RegistrationAttendance, type AttendanceStatusName } from "../../packages/integration-notion/src/session-closeout.js";

/**
 * AUTO-09 Attendance and Closeout replacement, closeout portion
 * (MHFA-CLOSEOUT-01) — REPORT ONLY.
 *
 * GET /.netlify/functions/session-closeout-check
 *
 * Finds MHFA-01 sessions that have ended (End Date if set, else Start Date,
 * is in the past) and aren't yet marked Closeout Complete, then aggregates
 * MHFA-02 Attendance Status across every registration linked to that
 * session -- see packages/integration-notion/src/session-closeout.ts for
 * why this never writes the real Closeout Complete checkbox itself.
 */

const MHFA_01_DATABASE_ID = "89649428-f379-405d-a66f-b9215d757b42";
const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";

const KNOWN_GAPS = [
  "\"Attendance status rules\" and \"minimum-hours rule\" are listed as still-undefined in the real AUTO-09 build sheet -- so \"readyForCloseout\" here means only \"every registrant has a recorded status,\" not a judgment about whether attendance met any completion threshold.",
  "This never writes MHFA-01's real `Closeout Complete` checkbox -- that's a genuine confirmatory claim about a real session, left for a human to set once they've reviewed the counts here.",
];

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  if (process.env.MHFA_CLOSEOUT_01_ENABLED !== "true") {
    return json(200, {
      status: "dry_run_feature_disabled",
      note: "MHFA_CLOSEOUT_01_ENABLED is not set. This endpoint only ever reports readiness -- it never writes to Notion regardless of this flag -- but stays consistent with every other path in this hub by still gating on a flag.",
    });
  }

  const now = new Date();
  let sessions: SessionForCloseout[];
  try {
    const result = await queryDatabaseLegacy(MHFA_01_DATABASE_ID, {
      and: [
        { property: "Closeout Complete", checkbox: { equals: false } },
        { property: "Start Date", date: { before: now.toISOString() } },
      ],
    });
    sessions = result.results
      .map((page): SessionForCloseout | null => {
        const props = page.properties as Record<string, any>;
        const sessionCode = props["Session Code"]?.title?.[0]?.plain_text;
        const endDateIso = props["End Date"]?.date?.start;
        const startDateIso = props["Start Date"]?.date?.start;
        const endReferenceIso = endDateIso ?? startDateIso;
        if (!sessionCode || !endReferenceIso) return null;
        return { pageId: page.id, sessionCode, endReferenceIso };
      })
      .filter((s): s is SessionForCloseout => s !== null)
      // The Notion filter above is on Start Date only (End Date can't be
      // filtered without knowing in advance whether it's set) -- re-check
      // the real "has this session ended" reference here in code.
      .filter((s) => new Date(s.endReferenceIso).getTime() < now.getTime());
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed_sessions", detail: String(err) });
  }

  const summaries = [];
  try {
    for (const session of sessions) {
      const result = await queryDatabaseLegacy(MHFA_02_DATABASE_ID, relationContainsFilter("Session", session.pageId));
      const registrations: RegistrationAttendance[] = result.results.map((page) => {
        const props = page.properties as Record<string, any>;
        const attendanceStatus = (props["Attendance Status"]?.status?.name ?? "Pending") as AttendanceStatusName;
        return { pageId: page.id, attendanceStatus };
      });
      summaries.push(summarizeCloseout(session, registrations));
    }
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed_registrations", detail: String(err) });
  }

  return json(200, {
    status: "report_only_no_writes",
    checkedAt: now.toISOString(),
    endedSessionsNotClosedOut: summaries.length,
    readyForCloseout: summaries.filter((s) => s.readyForCloseout),
    notReady: summaries.filter((s) => !s.readyForCloseout),
    knownGaps: KNOWN_GAPS,
    note: "These are readiness summaries for human review. Nothing was written to Notion -- Closeout Complete must be set manually.",
  });
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
