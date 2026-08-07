/**
 * AUTO-07 Pre-Work Reminder replacement (MHFA-PREWORK-01) — REPORT ONLY,
 * pure classification logic.
 *
 * Real live spec confirmed via Notion 2026-08-07 (MHFA Automation Registry,
 * "Pre-Work Reminder" build sheet, Risk: Medium): a daily scan should find
 * confirmed learners in "the pre-work window," send a reminder once per
 * cadence, and escalate incomplete pre-work at a cutoff. Same shape of
 * blocker as AUTO-03 (see payment-deadline.ts): the real build sheet's own
 * "Connection values still required" lists "reminder windows" as not yet
 * defined, MHFA-02 has no "Pre-Work Reminder Sent" idempotency field, and
 * this hub has no email-send integration. Rather than invent a window size
 * (e.g. "7 days before"), this only classifies using facts that need no
 * invented threshold: whether the linked session's real Start Date has
 * already passed while pre-work is still incomplete, versus is still
 * upcoming. Never sends anything -- see prework-readiness-check.ts.
 */

export type PreworkBucket = "session_passed_incomplete" | "upcoming_incomplete" | "no_session_date";

export interface SessionInfo {
  pageId: string;
  sessionCode: string;
  startDateIso: string;
}

export interface RegistrationPreworkInfo {
  pageId: string;
  registrationCode: string;
  preWorkStatus: string;
  sessionPageId?: string;
}

export interface PreworkCandidate extends RegistrationPreworkInfo {
  bucket: PreworkBucket;
  sessionCode?: string;
  daysUntilStart?: number;
}

export function classifyPrework(reg: RegistrationPreworkInfo, sessionsByPageId: Map<string, SessionInfo>, now: Date): PreworkCandidate {
  const session = reg.sessionPageId ? sessionsByPageId.get(reg.sessionPageId) : undefined;
  if (!session) {
    return { ...reg, bucket: "no_session_date" };
  }
  const daysUntilStart = (new Date(session.startDateIso).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const bucket: PreworkBucket = daysUntilStart < 0 ? "session_passed_incomplete" : "upcoming_incomplete";
  return { ...reg, bucket, sessionCode: session.sessionCode, daysUntilStart };
}
