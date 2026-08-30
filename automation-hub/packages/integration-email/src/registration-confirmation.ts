/**
 * MHFA-COMM-001 "Seat Request Received" -- the learner-facing confirmation
 * email for a new individual MHFA registration. Built against the real,
 * live MHFA-01/MHFA-02 system (not TRAIN-03/05/06 -- see
 * docs/DECISION_REGISTER.md Decision 8), per Tiána's explicit requirements
 * given 2026-08-11 and refined 2026-08-12 (real subject/opening copy,
 * MHFA-02 snapshot write-back requirement).
 *
 * This is NOT the same as sendRegistrationAlert (registration-alert.ts),
 * which emails Tiána an internal notification. This emails the learner
 * themself, using the real, live-editable COMMS-02 template.
 *
 * Required workflow per Tiána: retrieve session -> calculate deadline and
 * price -> create/update registration -> save all values to MHFA-02 ->
 * validate required fields -> send email -> log communication. This module
 * only covers "calculate" and "send" -- computePlan() is called by
 * intake.ts BEFORE the Notion write so the computed values can be saved
 * onto the registration record itself, then sendSeatRequestReceivedEmail()
 * is called after that write succeeds.
 */
import { findSessionByCode, derivePlatformOrLocation, type Mhfa01Session } from "../../integration-notion/src/session-lookup.js";
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
const PRICING_RULE_APPLIED = "Public";

const PAYMENT_WINDOW_HOURS = 48;

const COMMUNICATION_CODE = "MHFA-COMM-001";
const COMMUNICATION_VERSION = 2; // v2 = 2026-08-12 subject/opening rewrite

// Exact text approved by Tiána 2026-08-12. Do not alter without her sign-off.
const STANDARD_LEARNER_SIGNATURE = [
  "With care,",
  "",
  "Tiána Lynn",
  "Founder & Lead Instructor",
  "Wholistic Vibes Wellness | WVW Academy™",
  "Mental Health First Aid Training",
  "",
  "hello@wholisticvibeswellness.com",
  "wholisticvibeswellness.com",
].join("\n");

export interface SeatRequestReceivedInput {
  firstName: string;
  preferredName?: string;
  email: string;
  selectedSessionCode: string;
  submittedAt?: Date;
}

export interface SeatRequestPlan {
  session: Mhfa01Session;
  registrationReference: string;
  paymentDeadline: Date;
  amountDueUsd: number;
  pricingRuleApplied: string;
  paymentUrl: string;
  calculatedAt: Date;
  communicationVersion: number;
}

export type ComputePlanResult = { ok: true; plan: SeatRequestPlan } | { ok: false; reason: "session_not_found"; detail: string };

/** Step 1-2 of Tiána's required workflow: retrieve session, calculate deadline and price. No Notion write, no email send. */
export async function computeSeatRequestPlan(input: SeatRequestReceivedInput): Promise<ComputePlanResult> {
  const submittedAt = input.submittedAt ?? new Date();

  const session = await findSessionByCode(input.selectedSessionCode);
  if (!session) {
    return { ok: false, reason: "session_not_found", detail: `No MHFA-01 session found with Session Code "${input.selectedSessionCode}".` };
  }

  return {
    ok: true,
    plan: {
      session,
      registrationReference: await generateRegistrationReference(submittedAt.getUTCFullYear()),
      paymentDeadline: new Date(submittedAt.getTime() + PAYMENT_WINDOW_HOURS * 60 * 60 * 1000),
      amountDueUsd: INDIVIDUAL_REGISTRATION_PRICE_USD,
      pricingRuleApplied: PRICING_RULE_APPLIED,
      paymentUrl: STATIC_WAVE_PAYMENT_URL,
      calculatedAt: submittedAt,
      communicationVersion: COMMUNICATION_VERSION,
    },
  };
}

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

export type SendResult =
  | { sent: true }
  | { sent: false; reason: "template_not_found" | "missing_variables"; detail: string };

/** Step 5 of Tiána's required workflow: validate required fields and send. Call only after the plan has already been saved to MHFA-02. */
export async function sendSeatRequestReceivedEmail(input: SeatRequestReceivedInput, plan: SeatRequestPlan): Promise<SendResult> {
  const { session } = plan;

  let template;
  try {
    template = await getActiveTemplate(COMMUNICATION_CODE);
  } catch (err) {
    if (err instanceof TemplateNotFoundError) {
      return { sent: false, reason: "template_not_found", detail: err.message };
    }
    throw err;
  }

  const sessionTimeWithZone = [session.startTime, session.timeZoneAbbreviation].filter(Boolean).join(" ");

  const variables: Record<string, string> = {
    LearnerFirstName: input.preferredName || input.firstName,
    CourseName: session.courseName ?? "",
    SessionDateFormatted: session.startDate ? formatDate(session.startDate, session.timeZoneIana) : "",
    SessionTimeWithTimezone: sessionTimeWithZone,
    DeliveryFormat: session.deliveryFormat ?? "",
    PlatformOrLocation: derivePlatformOrLocation(session) ?? "",
    RegistrationReference: plan.registrationReference,
    PaymentDeadlineFormatted: formatDeadline(plan.paymentDeadline, session.timeZoneIana),
    AmountDueFormatted: `$${plan.amountDueUsd.toFixed(2)}`,
    PaymentURL: plan.paymentUrl,
    StandardLearnerSignature: STANDARD_LEARNER_SIGNATURE,
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

  return { sent: true };
}
