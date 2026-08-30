/**
 * AUTO-03 Payment Reminder and Registration Expiration replacement
 * (MHFA-PAY-02) -- the real, write-capable version. Report-only precursor
 * (payment-deadline-check.ts / payment-deadline.ts) stays as the on-demand
 * human-review endpoint; this is what the scheduled cron
 * (payment-deadline-cron.ts) actually calls per Tiána's 2026-08-12
 * decision to auto-expire seats and send real reminder/expiration emails.
 *
 * Sources session display info from the registration's own snapshot fields
 * (CourseNameSnapshot/SessionDateTimeSnapshot/SessionTimezoneSnapshot,
 * written by MHFA-COMM-001 -- Decision 10) when present, since that's what
 * the learner was actually told at registration time. Falls back to a live
 * MHFA-01 lookup via the Session relation for registrations that predate
 * that snapshot (or never had a matched session).
 */
import { richTextEqualsFilter, queryDatabaseLegacy } from "../../integration-notion/src/client.js";
import { findSessionByPageId } from "../../integration-notion/src/session-lookup.js";
import { renderTemplate, MissingTemplateVariablesError } from "./template-render.js";
import { markdownToHtml } from "./markdown-to-html.js";
import { sendEmail } from "./client.js";

const COMMS_02_DATABASE_ID = "00f1abfa-b8b0-483b-840d-e1f91043ad4b";
const STATIC_WAVE_PAYMENT_URL = "https://link.waveapps.com/uun3sr-jm72jd";
const PUBLIC_REGISTRATION_URL = "https://wholisticvibeswellness.com/mhfa/upcoming-trainings/";

export type ReminderKind = "reminder_due" | "final_reminder_due" | "expired";

const COMMUNICATION_CODE_BY_KIND: Record<ReminderKind, string> = {
  reminder_due: "MHFA-COMM-002",
  final_reminder_due: "MHFA-COMM-003",
  expired: "MHFA-COMM-004",
};

export interface RegistrationForReminder {
  pageId: string;
  firstName: string;
  email: string;
  amountDue?: number;
  paymentDeadlineIso: string;
  registrationReference?: string;
  paymentUrl?: string;
  courseNameSnapshot?: string;
  sessionDateTimeSnapshot?: string;
  sessionTimezoneSnapshot?: string;
  sessionPageId?: string;
}

export type SendReminderResult =
  | { sent: true; kind: ReminderKind }
  | { sent: false; kind: ReminderKind; reason: "template_not_found" | "missing_variables"; detail: string };

async function getTemplate(communicationCode: string): Promise<{ subject: string; body: string } | null> {
  const result = await queryDatabaseLegacy(COMMS_02_DATABASE_ID, richTextEqualsFilter("Communication Code", communicationCode));
  const active = result.results.find((page) => (page.properties as Record<string, any>)["Test Status"]?.select?.name === "Active");
  if (!active) return null;
  const props = active.properties as Record<string, any>;
  return {
    subject: props.Subject?.rich_text?.[0]?.plain_text ?? "",
    body: props["Email Body"]?.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "",
  };
}

async function resolveCourseName(reg: RegistrationForReminder): Promise<string> {
  if (reg.courseNameSnapshot) return reg.courseNameSnapshot;
  if (reg.sessionPageId) {
    const session = await findSessionByPageId(reg.sessionPageId);
    if (session?.courseName) return session.courseName;
  }
  return "";
}

async function resolveSessionDateTime(reg: RegistrationForReminder): Promise<{ dateFormatted: string; timeWithZone: string }> {
  if (reg.sessionDateTimeSnapshot) {
    return { dateFormatted: reg.sessionDateTimeSnapshot, timeWithZone: reg.sessionTimezoneSnapshot ?? "" };
  }
  if (reg.sessionPageId) {
    const session = await findSessionByPageId(reg.sessionPageId);
    if (session) {
      return {
        dateFormatted: session.startDate ?? "",
        timeWithZone: [session.startTime, session.timeZoneAbbreviation].filter(Boolean).join(" "),
      };
    }
  }
  return { dateFormatted: "", timeWithZone: "" };
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

export async function sendPaymentReminder(reg: RegistrationForReminder, kind: ReminderKind): Promise<SendReminderResult> {
  const communicationCode = COMMUNICATION_CODE_BY_KIND[kind];
  const template = await getTemplate(communicationCode);
  if (!template) {
    return { sent: false, kind, reason: "template_not_found", detail: `No Active template found for ${communicationCode}.` };
  }

  const courseName = await resolveCourseName(reg);
  const { dateFormatted, timeWithZone } = await resolveSessionDateTime(reg);

  const variables: Record<string, string> = {
    PreferredFirstName: reg.firstName,
    CourseName: courseName,
    SessionDateFormatted: dateFormatted,
    SessionTimeWithTimezone: timeWithZone,
    AmountDueFormatted: reg.amountDue !== undefined ? `$${reg.amountDue.toFixed(2)}` : "",
    PaymentDeadlineFormatted: formatFull(reg.paymentDeadlineIso),
    PaymentDeadlineShort: formatShort(reg.paymentDeadlineIso),
    PaymentURL: reg.paymentUrl || STATIC_WAVE_PAYMENT_URL,
    RegistrationReference: reg.registrationReference ?? "",
    PublicRegistrationURL: PUBLIC_REGISTRATION_URL,
    StandardLearnerSignature: [
      "With care,",
      "",
      "Tiána Lynn",
      "Founder & Lead Instructor",
      "Wholistic Vibes Wellness | WVW Academy™",
      "Mental Health First Aid Training",
      "",
      "hello@wholisticvibeswellness.com",
      "wholisticvibeswellness.com",
    ].join("\n"),
  };

  let subject: string;
  let body: string;
  try {
    subject = renderTemplate(template.subject, variables);
    body = renderTemplate(template.body, variables);
  } catch (err) {
    if (err instanceof MissingTemplateVariablesError) {
      return { sent: false, kind, reason: "missing_variables", detail: err.message };
    }
    throw err;
  }

  await sendEmail({ to: reg.email, subject, html: markdownToHtml(body) });
  return { sent: true, kind };
}
