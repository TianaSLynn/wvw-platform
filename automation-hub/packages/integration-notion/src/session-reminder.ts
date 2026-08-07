/**
 * AUTO-08 Session Reminder Cadence replacement (MHFA-SESSREM-01) — REPORT
 * ONLY, pure classification logic.
 *
 * Real live spec confirmed via Notion 2026-08-07 (MHFA Automation Registry,
 * "Session Reminder Cadence" build sheet, Risk: Medium): unlike AUTO-03/
 * AUTO-07, the cadence itself is a real, already-decided business rule
 * (CEO decision, 2026-07-22) -- 14 days, 7 days, 3 days, 1 day, and
 * morning-of the session, each firing on an EXACT day-count match, not a
 * range. What's still missing is execution, not policy: the build sheet's
 * own "Connection values still required" lists the five per-bucket "Sent"
 * checkbox fields (`14-Day Sent`, `7-Day Sent`, `3-Day Sent`, `1-Day Sent`,
 * `Morning-Of Sent`) as "create if they don't exist" -- confirmed via
 * direct fetch 2026-08-07 that none of them exist yet on the live MHFA-02
 * schema -- and this hub has no email-send integration. So this only
 * classifies candidates for human review; see session-reminder-check.ts,
 * which never sends anything.
 */

export type ReminderBucket = "14_day" | "7_day" | "3_day" | "1_day" | "morning_of" | "no_action";

export interface SessionInfo {
  pageId: string;
  sessionCode: string;
  startDateIso: string;
}

export interface RegistrationReminderInfo {
  pageId: string;
  registrationCode: string;
  sessionPageId?: string;
}

export interface ReminderCandidate extends RegistrationReminderInfo {
  bucket: ReminderBucket;
  sessionCode?: string;
  daysUntilStart?: number;
}

/** Calendar-day difference, matching the real spec's "days between today and the session date" (date-only, not fractional hours). */
function calendarDaysUntil(startDateIso: string, now: Date): number {
  const start = new Date(startDateIso);
  const startDateOnly = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const nowDateOnly = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((startDateOnly - nowDateOnly) / (1000 * 60 * 60 * 24));
}

const BUCKET_BY_DAY_COUNT: Record<number, ReminderBucket> = {
  14: "14_day",
  7: "7_day",
  3: "3_day",
  1: "1_day",
  0: "morning_of",
};

export function classifySessionReminder(reg: RegistrationReminderInfo, sessionsByPageId: Map<string, SessionInfo>, now: Date): ReminderCandidate {
  const session = reg.sessionPageId ? sessionsByPageId.get(reg.sessionPageId) : undefined;
  if (!session) {
    return { ...reg, bucket: "no_action" };
  }
  const daysUntilStart = calendarDaysUntil(session.startDateIso, now);
  const bucket = BUCKET_BY_DAY_COUNT[daysUntilStart] ?? "no_action";
  return { ...reg, bucket, sessionCode: session.sessionCode, daysUntilStart };
}
