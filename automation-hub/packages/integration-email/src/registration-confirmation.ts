/**
 * MHFA-COMM-001 "Seat Request Received" -- the learner-facing confirmation
 * email for a new individual MHFA registration. Built against the real,
 * live MHFA-01/MHFA-02 system (not TRAIN-03/05/06 -- see
 * docs/DECISION_REGISTER.md Decision 8), per Tiána's explicit requirements
 * given 2026-08-11.
 *
 * This is NOT the same as sendRegistrationAlert (registration-alert.ts),
 * which emails Tiána an internal notification. This emails the learner
 * themself, using the real, live-editable COMMS-02 template.
 *
 * Deliberately does not fail the caller's registration write on any
 * failure here -- the Notion registration record is the thing that must
 * succeed; this email is a best-effort follow-on, same pattern as
 * logWorkflowExecution and sendRegistrationAlert.
 */
import { findSessionByCode } from "../../integration-notion/src/session-lookup.js";
import { generateRegistrationReference } from "../../integration-notion/src/registration-reference.js";
import { getActiveTemplate, TemplateNotFoundError } from "../../integration-notion/src/comms-templates.js";
import { renderTemplate, MissingTemplateVariablesError } from "./template-render.js";
import { markdownToHtml } from "./markdown-to-html.js";
import { sendEmail } from "./client.js";

// Confirmed 2026-08-11 (Decision 7 follow-up): Tiána chose to keep the
// existing static Wave payment link rather than build automated
// per-registration invoice creation, which remains blocked on a Wave
// account/API-token issue outside this hub's control (see
// docs/DECISION_REGISTER.md Decision 9). Upgrade to a real per-registration
// invoice URL once that's resolved -- tracked as a follow-up.
const STATIC_WAVE_PAYMENT_URL = "https://link.waveapps.com/uun3sr-jm72jd";

// Matches the live public registration form's own stated price
// ("Course fee: $225") -- not invented, just finally wired through.
const INDIVIDUAL_REGISTRATION_PRICE_USD = 225;

const PAYMENT_WINDOW_HOURS = 48;

const COMMUNICATION_CODE = "MHFA-COMM-001";

export interface SeatRequestReceivedInput {
  firstName: string;
  preferredName?: string;
  email: string;
  selectedSessionCode: string;
  submittedAt?: Date;
}

export type SeatRequestReceivedResult =
  | { sent: true; registrationReference: string; sessionPageId: string }
  | { sent: false; reason: "session_not_found" | "template_not_found" | "missing_variables"; detail: string };

function formatDate(iso: string, timeZone: string | undefined): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timeZone ?? "UTC",
  });
}

function formatDeadline(date: Date, timeZone: string | undefined): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: timeZone ?? "UTC",
  });
}

export async function sendSeatRequestReceivedEmail(input: SeatRequestReceivedInput): Promise<SeatRequestReceivedResult> {
  const submittedAt = input.submittedAt ?? new Date();

  const session = await findSessionByCode(input.selectedSessionCode);
  if (!session) {
    return { sent: false, reason: "session_not_found", detail: `No MHFA-01 session found with Session Code "${input.selectedSessionCode}".` };
  }

  let template;
  try {
    template = await getActiveTemplate(COMMUNICATION_CODE);
  } catch (err) {
    if (err instanceof TemplateNotFoundError) {
      return { sent: false, reason: "template_not_found", detail: err.message };
    }
    throw err;
  }

  const registrationReference = await generateRegistrationReference(submittedAt.getUTCFullYear());
  const paymentDeadline = new Date(submittedAt.getTime() + PAYMENT_WINDOW_HOURS * 60 * 60 * 1000);
  const amountDueFormatted = `$${INDIVIDUAL_REGISTRATION_PRICE_USD.toFixed(2)}`;

  const sessionTimeWithZone = [session.startTime, session.timeZoneAbbreviation].filter(Boolean).join(" ");

  const variables: Record<string, string> = {
    PreferredFirstName: input.preferredName || input.firstName,
    CourseName: session.courseName ?? "",
    SessionDateFormatted: session.startDate ? formatDate(session.startDate, session.timeZoneIana) : "",
    SessionTimeWithTimezone: sessionTimeWithZone,
    DeliveryFormat: session.deliveryFormat ?? "",
    RegistrationReference: registrationReference,
    PaymentDeadlineFormatted: formatDeadline(paymentDeadline, session.timeZoneIana),
    AmountDueFormatted: amountDueFormatted,
    PaymentURL: STATIC_WAVE_PAYMENT_URL,
  };

  let renderedBody: string;
  let renderedSubject: string;
  try {
    renderedBody = renderTemplate(template.body, variables);
    renderedSubject = renderTemplate(template.subject, variables);
  } catch (err) {
    if (err instanceof MissingTemplateVariablesError) {
      return { sent: false, reason: "missing_variables", detail: err.message };
    }
    throw err;
  }

  await sendEmail({
    to: input.email,
    subject: renderedSubject,
    html: markdownToHtml(renderedBody),
  });

  return { sent: true, registrationReference, sessionPageId: session.pageId };
}
