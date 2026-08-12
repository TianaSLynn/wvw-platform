import { schedule } from "@netlify/functions";
import { queryDatabaseLegacy, updatePage, NotionNotConfiguredError } from "../../packages/integration-notion/src/client.js";
import { classifyDeadline, type RegistrationDeadlineInfo } from "../../packages/integration-notion/src/payment-deadline.js";
import { sendPaymentReminder, type RegistrationForReminder } from "../../packages/integration-email/src/payment-reminder.js";
import { generateCorrelationId } from "../../packages/shared-types/src/correlation-id.js";
import { logWorkflowExecution } from "../../packages/integration-postgres/src/workflow-log.js";
import { recordException } from "../../packages/integration-notion/src/exception-recorder-orchestration.js";

/**
 * AUTO-03 Payment Reminder and Registration Expiration -- write-capable
 * version (MHFA-PAY-02-CRON), per Tiána's 2026-08-12 decision to
 * auto-expire seats and send real reminder/expiration emails, once all 14
 * Zapier MHFA automations were confirmed fully disconnected (Decision 9
 * update) with nothing covering this path anymore.
 *
 * Runs hourly (matches the real spec's "hourly scheduled check"). Each
 * reminder is gated by its own idempotency checkbox
 * (`24hr Reminder Sent`/`Final Reminder Sent`) so it fires exactly once --
 * these do NOT exist on the live MHFA-02 schema until Tiána adds them
 * manually (see docs/DECISION_REGISTER.md); until then this function
 * degrades safely: it still classifies and would still attempt sends, but
 * every send after the first for a given registration would re-send
 * (no idempotency) -- MHFA_PAY_02_CRON_ENABLED must stay off until those
 * fields are confirmed present.
 */

const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";

async function fetchCandidates(): Promise<Array<RegistrationDeadlineInfo & { seatStatus?: string; registrationSnapshot: RegistrationForReminder; reminderSentFlags: { hour24: boolean; final: boolean } }>> {
  const result = await queryDatabaseLegacy(MHFA_02_DATABASE_ID, {
    property: "Payment Deadline",
    date: { is_not_empty: true },
  });

  return result.results
    .map((page) => {
      const props = page.properties as Record<string, any>;
      const email = props.Email?.email;
      const registrationCode = props["Registration Code"]?.title?.[0]?.plain_text;
      const paymentStatus = props["Payment Status"]?.status?.name;
      const seatStatus = props["Seat Status"]?.status?.name;
      const paymentDeadlineIso = props["Payment Deadline"]?.date?.start;
      const firstName = props["First Name"]?.rich_text?.[0]?.plain_text;
      if (!email || !registrationCode || !paymentStatus || !paymentDeadlineIso || !firstName) return null;

      const sessionRelation = props.Session?.relation as Array<{ id: string }> | undefined;

      return {
        email,
        registrationCode,
        pageId: page.id,
        paymentStatus,
        seatStatus,
        paymentDeadlineIso,
        reminderSentFlags: {
          hour24: props["24hr Reminder Sent"]?.checkbox === true,
          final: props["Final Reminder Sent"]?.checkbox === true,
        },
        registrationSnapshot: {
          pageId: page.id,
          firstName,
          email,
          amountDue: props["Amount Due"]?.number,
          paymentDeadlineIso,
          registrationReference: props.RegistrationReference?.rich_text?.[0]?.plain_text,
          paymentUrl: props.PaymentURL?.url,
          courseNameSnapshot: props.CourseNameSnapshot?.rich_text?.[0]?.plain_text,
          sessionDateTimeSnapshot: props.SessionDateTimeSnapshot?.rich_text?.[0]?.plain_text,
          sessionTimezoneSnapshot: props.SessionTimezoneSnapshot?.rich_text?.[0]?.plain_text,
          sessionPageId: sessionRelation?.[0]?.id,
        } satisfies RegistrationForReminder,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

async function runCheck(): Promise<{ processed: number; sent: number; expired: number; skipped: number; failed: number }> {
  let candidates;
  try {
    candidates = await fetchCandidates();
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      console.error("[payment-deadline-cron] NOTION_API_KEY not set -- skipping this run.");
      return { processed: 0, sent: 0, expired: 0, skipped: 0, failed: 0 };
    }
    throw err;
  }

  const now = new Date();
  let sent = 0;
  let expired = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const classified = classifyDeadline(candidate, now);
    const correlationId = generateCorrelationId("MHFA", "MHFA-PAY-02");

    if (classified.bucket === "no_action_paid_like" || classified.bucket === "no_action_yet") {
      continue;
    }

    // Only a seat still actively awaiting payment is eligible for
    // reminders or expiration -- anything already Confirmed, Expired,
    // Cancelled, Transferred, etc. is a terminal state this cron must
    // never touch again. This is the real idempotency guard for the
    // "expired" bucket (which has no dedicated checkbox the way the two
    // reminder buckets do).
    if (candidate.seatStatus !== "Awaiting Payment") {
      skipped++;
      continue;
    }

    // Idempotency: never re-send a reminder that's already gone out.
    if (classified.bucket === "reminder_due" && candidate.reminderSentFlags.hour24) {
      skipped++;
      continue;
    }
    if (classified.bucket === "final_reminder_due" && candidate.reminderSentFlags.final) {
      skipped++;
      continue;
    }

    try {
      const result = await sendPaymentReminder(candidate.registrationSnapshot, classified.bucket as "reminder_due" | "final_reminder_due" | "expired");

      if (!result.sent) {
        failed++;
        await recordException({
          correlationId,
          workflowCode: "WF-PAY",
          exceptionType: "Missing Payment",
          severity: "Medium",
          errorDetail: `${classified.bucket} email failed for ${candidate.registrationCode}: ${result.detail}`,
          registrationPageId: candidate.pageId,
        });
        await logWorkflowExecution({ correlationId, automationCode: "MHFA-PAY-02", status: "completed_with_warning", trigger: "hourly-cron", errorSummary: result.detail });
        continue;
      }

      const updateProps: Record<string, unknown> = {};
      if (classified.bucket === "reminder_due") updateProps["24hr Reminder Sent"] = { checkbox: true };
      if (classified.bucket === "final_reminder_due") updateProps["Final Reminder Sent"] = { checkbox: true };
      if (classified.bucket === "expired") {
        updateProps["Seat Status"] = { status: { name: "Expired" } };
        expired++;
      }
      await updatePage(candidate.pageId, updateProps);

      await logWorkflowExecution({
        correlationId,
        automationCode: "MHFA-PAY-02",
        status: "completed",
        trigger: "hourly-cron",
        outputSnapshot: { registrationCode: candidate.registrationCode, bucket: classified.bucket, hoursRemaining: classified.hoursRemaining },
      });
      sent++;
    } catch (err) {
      failed++;
      console.error(`[payment-deadline-cron] unexpected failure for ${candidate.registrationCode}:`, err);
      await recordException({
        correlationId,
        workflowCode: "WF-PAY",
        exceptionType: "Missing Payment",
        severity: "High",
        errorDetail: `Unexpected error processing ${candidate.registrationCode}: ${String(err)}`,
        registrationPageId: candidate.pageId,
      }).catch((exceptionErr) => console.error("[payment-deadline-cron] also failed to record exception:", exceptionErr));
    }
  }

  return { processed: candidates.length, sent, expired, skipped, failed };
}

export const handler = schedule("0 * * * *", async () => {
  if (process.env.MHFA_PAY_02_CRON_ENABLED !== "true") {
    console.log("[payment-deadline-cron] MHFA_PAY_02_CRON_ENABLED is not set -- skipping run.");
    return { statusCode: 200 };
  }

  const summary = await runCheck();
  console.log("[payment-deadline-cron] run complete:", JSON.stringify(summary));
  return { statusCode: 200 };
});
