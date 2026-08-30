import type { Handler } from "@netlify/functions";
import { queryDatabaseLegacy, NotionNotConfiguredError } from "../../packages/integration-notion/src/client.js";
import { needsFollowup, classifyCertFollowup, type SessionInfo, type RegistrationCertInfo, type CertificateStatusName } from "../../packages/integration-notion/src/certification-followup.js";

/**
 * AUTO-10 Certification Follow-Up replacement (MHFA-CERTFOLLOWUP-01) —
 * REPORT ONLY.
 *
 * GET /.netlify/functions/certification-followup-check
 *
 * Finds MHFA-02 registrations that Attended but whose Certificate Status is
 * still Pending or Processing, joins to MHFA-01's real session end
 * reference for context, and reports them for human review -- see
 * packages/integration-notion/src/certification-followup.ts for why this
 * never guesses a follow-up cadence or writes anything.
 */

const MHFA_01_DATABASE_ID = "89649428-f379-405d-a66f-b9215d757b42";
const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";

const KNOWN_GAPS = [
  "\"Follow-up days,\" \"final deadline,\" and \"exception owner\" are all listed as still-undefined in the real AUTO-10 build sheet -- so this reports incomplete certifications with days-since-session-end for context, not a specific follow-up cadence or escalation.",
  "This hub has no email-send integration built yet (Microsoft Graph access here is read/search only).",
];

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  if (process.env.MHFA_CERTFOLLOWUP_01_ENABLED !== "true") {
    return json(200, {
      status: "dry_run_feature_disabled",
      note: "MHFA_CERTFOLLOWUP_01_ENABLED is not set. This endpoint only ever reports candidates -- it never writes to Notion or sends anything regardless of this flag -- but stays consistent with every other path in this hub by still gating on a flag.",
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
          const endDateIso = props["End Date"]?.date?.start;
          const startDateIso = props["Start Date"]?.date?.start;
          const endReferenceIso = endDateIso ?? startDateIso;
          if (!sessionCode || !endReferenceIso) return null;
          return [page.id, { pageId: page.id, sessionCode, endReferenceIso }];
        })
        .filter((entry): entry is [string, SessionInfo] => entry !== null)
    );
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed_sessions", detail: String(err) });
  }

  let registrations: RegistrationCertInfo[];
  try {
    const result = await queryDatabaseLegacy(MHFA_02_DATABASE_ID, {
      and: [
        { property: "Attendance Status", status: { equals: "Attended" } },
        { property: "Certificate Status", status: { does_not_equal: "Issued" } },
        { property: "Certificate Status", status: { does_not_equal: "Not Earned" } },
      ],
    });
    registrations = result.results
      .map((page): RegistrationCertInfo | null => {
        const props = page.properties as Record<string, any>;
        const registrationCode = props["Registration Code"]?.title?.[0]?.plain_text;
        const certificateStatus = props["Certificate Status"]?.status?.name as CertificateStatusName | undefined;
        const sessionRelations = props.Session?.relation as Array<{ id: string }> | undefined;
        if (!registrationCode || !certificateStatus) return null;
        const sessionPageId = sessionRelations?.[0]?.id;
        return sessionPageId
          ? { pageId: page.id, registrationCode, certificateStatus, sessionPageId }
          : { pageId: page.id, registrationCode, certificateStatus };
      })
      .filter((r): r is RegistrationCertInfo => r !== null)
      .filter((r) => needsFollowup(r.certificateStatus));
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed_registrations", detail: String(err) });
  }

  const now = new Date();
  const candidates = registrations.map((reg) => classifyCertFollowup(reg, sessionsByPageId, now));

  return json(200, {
    status: "report_only_no_writes_no_sends",
    checkedAt: now.toISOString(),
    candidates,
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
