/**
 * AUTO-13 Exception Alert and Retry replacement (MHFA-EXCEPTION-01) — pure
 * logic for the dedup/increment mechanic.
 *
 * Real live spec confirmed via Notion 2026-08-07 (MHFA Automation Registry,
 * "Exception Alert and Retry" build sheet, Risk: High): every other
 * automation's exception branch should post here; an existing OPEN
 * exception with the same correlation ID gets its occurrence count
 * incremented (no duplicate alert), otherwise a new exception record is
 * created. Real gaps found and NOT worked around by inventing schema:
 * MHFA-05 has no dedicated Correlation ID property (same known gap as
 * MHFA-02/03, documented in docs/NOTION_MAPPING.md -- reused here, not
 * duplicated) and no "Occurrence Count"/"Last Seen" properties either, so
 * occurrence tracking is done the same way correlation IDs already are
 * elsewhere in this codebase: appended lines in the free-text `Resolution
 * Notes` field. `Exception Type`, `Workflow Code`, and `Severity` are all
 * closed selects on the real live schema -- callers must supply a value
 * from the real option lists below; nothing here invents a new option.
 * "Email/Teams alert to owner" has no integration in this hub yet (known
 * gap, same as every other automation that needs to send something).
 */

import { extractCorrelationIdFromNotes } from "./mappers.js";

export const REAL_EXCEPTION_TYPES = [
  "Missing Payment",
  "Duplicate Registration",
  "Payment Received - Seat Not Confirmed",
  "Missing MHFA Connect Registration",
  "Incomplete Pre-Work",
  "Email Failure",
  "Missing Attendance",
  "Certificate Question",
  "Refund Request",
  "Cancellation",
  "Transfer",
] as const;
export type ExceptionType = (typeof REAL_EXCEPTION_TYPES)[number];

export const REAL_WORKFLOW_CODES = ["WF-REG", "WF-PAY", "WF-CONNECT", "WF-PREWORK", "WF-ATTEND", "WF-CERT", "WF-CANCEL"] as const;
export type WorkflowCode = (typeof REAL_WORKFLOW_CODES)[number];

export const REAL_SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Severity = (typeof REAL_SEVERITIES)[number];

// Non-terminal MHFA-05 Status values -- an existing exception in one of
// these still covers a retriggered failure, matching the real spec's
// "existing open exception found -> increment, don't re-alert."
export const OPEN_STATUSES = new Set(["Open", "In Progress", "Escalated"]);

export interface ExceptionInput {
  correlationId: string;
  workflowCode: WorkflowCode;
  exceptionType: ExceptionType;
  severity: Severity;
  errorDetail: string;
  registrationPageId?: string;
  sessionPageId?: string;
}

const OCCURRENCE_PREFIX = "Occurrence @ ";

export function buildInitialExceptionProperties(input: ExceptionInput, now: Date): Record<string, unknown> {
  const ulid = input.correlationId.split("|").pop() ?? input.correlationId;
  const properties: Record<string, unknown> = {
    "Exception Code": { title: [{ text: { content: `EXC-${ulid}` } }] },
    "Exception Type": { select: { name: input.exceptionType } },
    "Workflow Code": { select: { name: input.workflowCode } },
    Status: { status: { name: "Open" } },
    Severity: { select: { name: input.severity } },
    Detected: { date: { start: now.toISOString() } },
    "Resolution Notes": {
      rich_text: [{ text: { content: `Correlation ID: ${input.correlationId}\n${OCCURRENCE_PREFIX}${now.toISOString()}: ${input.errorDetail}` } }],
    },
  };
  if (input.registrationPageId) properties.Registration = { relation: [{ id: input.registrationPageId }] };
  if (input.sessionPageId) properties.Session = { relation: [{ id: input.sessionPageId }] };
  return properties;
}

export function countOccurrences(notes: string): number {
  return notes.split("\n").filter((line) => line.startsWith(OCCURRENCE_PREFIX)).length;
}

export function appendOccurrenceNotes(existingNotes: string, errorDetail: string, now: Date): string {
  return `${existingNotes}\n${OCCURRENCE_PREFIX}${now.toISOString()}: ${errorDetail}`;
}

/** True only if this page's Notes contains an exact correlation-ID match and its Status is still open. */
export function matchesOpenException(pageNotes: string | undefined, pageStatus: string | undefined, correlationId: string): boolean {
  if (!pageStatus || !OPEN_STATUSES.has(pageStatus)) return false;
  return extractCorrelationIdFromNotes(pageNotes) === correlationId;
}
