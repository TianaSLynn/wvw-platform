/**
 * AUTO-03 Payment Reminder and Registration Expiration replacement
 * (MHFA-PAY-02) — REPORT ONLY, pure classification logic.
 *
 * Real live spec confirmed via Notion 2026-08-07 (MHFA Automation Registry,
 * "Payment Reminder and Registration Expiration" build sheet): the intended
 * design fires an hourly scheduled check, sends a 24-hour reminder, sends a
 * final reminder at ~2 hours remaining, and expires the registration
 * (releasing the seat) once the deadline passes -- each reminder gated by a
 * `24hr Reminder Sent` / `Final Reminder Sent` checkbox so it fires exactly
 * once.
 *
 * Neither checkbox field exists yet on the live MHFA-02 schema (confirmed
 * via direct fetch 2026-08-07 -- the real property list has `Payment
 * Deadline` but no `24hr Reminder Sent`/`Final Reminder Sent`), and this hub
 * has no email-send integration built (Microsoft Graph is read/search only
 * so far). Auto-sending a reminder or auto-expiring a real registration
 * without those idempotency fields risks double-sending or wrongly expiring
 * someone who paid minutes earlier. So this module only classifies
 * candidates for human review -- see payment-deadline-check.ts, which never
 * writes to Notion or sends anything regardless of its feature flag.
 */

export type DeadlineBucket = "expired" | "final_reminder_due" | "reminder_due" | "no_action_yet" | "no_action_paid_like";

// Real live Payment Status options that mean no reminder/expiration logic applies.
const PAID_LIKE_STATUSES = new Set(["Paid", "Waived", "Sponsored", "Refunded"]);

export interface RegistrationDeadlineInfo {
  registrationCode: string;
  pageId: string;
  email: string;
  paymentStatus: string;
  paymentDeadlineIso: string;
}

export interface DeadlineCandidate extends RegistrationDeadlineInfo {
  bucket: DeadlineBucket;
  hoursRemaining: number;
}

/**
 * Thresholds are report-only judgment calls, not the exact "fires once at
 * the ~24h/~2h mark" semantics the real hourly-cron design needs -- this
 * has no fire-once flag to enforce that, so it always reports what's
 * currently true rather than trying to mimic one-shot firing.
 */
export function classifyDeadline(reg: RegistrationDeadlineInfo, now: Date): DeadlineCandidate {
  if (PAID_LIKE_STATUSES.has(reg.paymentStatus)) {
    return { ...reg, bucket: "no_action_paid_like", hoursRemaining: NaN };
  }
  const deadline = new Date(reg.paymentDeadlineIso);
  const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  let bucket: DeadlineBucket;
  if (hoursRemaining <= 0) bucket = "expired";
  else if (hoursRemaining <= 2) bucket = "final_reminder_due";
  else if (hoursRemaining <= 24) bucket = "reminder_due";
  else bucket = "no_action_yet";

  return { ...reg, bucket, hoursRemaining };
}
