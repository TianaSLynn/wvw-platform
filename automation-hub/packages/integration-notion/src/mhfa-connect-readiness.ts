/**
 * AUTO-06 MHFA Connect Enrollment Readiness replacement (MHFA-CONNECT-01).
 *
 * Real live spec confirmed via Notion 2026-08-07 (MHFA Automation Registry,
 * "MHFA Connect Enrollment Readiness" build sheet, Risk: Medium): a paid,
 * confirmed registration not yet MHFA Connect-registered should get an
 * internal queue item so a human enrolls them -- the build sheet explicitly
 * says "no direct MHFA Connect API assumed." This module only ever
 * produces an internal MHFA-05 | Automation & Exception Queue item
 * (Exception Type "Missing MHFA Connect Registration", already a real
 * option on the live schema -- Workflow Code "WF-CONNECT", also already
 * real), never anything customer-facing or any call to MHFA Connect
 * itself. Kept pure/testable; the Notion search-before-create calls live in
 * mhfa-connect-readiness-orchestration.ts.
 */

export interface ReadyRegistration {
  pageId: string;
  registrationCode: string;
  sessionPageId?: string;
}

/**
 * No real SLA/"Resolution Due" number of days has been defined by Tiana
 * anywhere in the live docs checked -- left unset rather than invented (see
 * governance notes throughout this hub about never fabricating business
 * parameters). "Severity" is "Low": this flags a routine next step, not a
 * failure or an emergency.
 */
export function readinessQueueItemProperties(reg: ReadyRegistration, correlationId: string): Record<string, unknown> {
  const ulid = correlationId.split("|").pop() ?? correlationId;
  const properties: Record<string, unknown> = {
    "Exception Code": { title: [{ text: { content: `CONNECT-${ulid}` } }] },
    "Exception Type": { select: { name: "Missing MHFA Connect Registration" } },
    "Workflow Code": { select: { name: "WF-CONNECT" } },
    Status: { status: { name: "Open" } },
    Severity: { select: { name: "Low" } },
    Registration: { relation: [{ id: reg.pageId }] },
    "Resolution Notes": {
      rich_text: [
        {
          text: {
            content: `Correlation ID: ${correlationId}\nRegistration ${reg.registrationCode} is Paid, Seat Status Confirmed, and MHFA Connect Status Not Registered -- ready for a human to manually enroll in MHFA Connect. No automated MHFA Connect enrollment call was made (none exists in this hub, matching the real AUTO-06 spec's "no direct MHFA Connect API assumed").`,
          },
        },
      ],
    },
  };
  if (reg.sessionPageId) properties.Session = { relation: [{ id: reg.sessionPageId }] };
  return properties;
}
