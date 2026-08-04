import { z } from "zod";

/**
 * Matches the REAL live Netlify form `mhfa-individual-registration` on
 * wholisticvibeswellness.com, retrieved via the Netlify API on 2026-08-03
 * (see docs/FORM_REGISTRY.md). Field names are intentionally identical to
 * the live form's field names — do not rename without updating the form.
 *
 * `accommodation-summary` is treated as Restricted per governance and is
 * split out by the intake handler before anything is written to
 * automation_events.payload or any general-purpose log.
 */
export const mhfaIndividualRegistrationSchema = z.object({
  "bot-field": z.string().max(0, "spam detected"),
  "session-route": z.string().optional(),

  "first-name": z.string().min(1).max(200),
  "last-name": z.string().min(1).max(200),
  "preferred-name": z.string().max(200).optional(),
  email: z.string().email(),
  "mhfa-connect-email": z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),

  organization: z.string().max(300).optional(),
  "job-title": z.string().max(200).optional(),
  "organization-type": z.string().optional(),

  "number-of-participants": z.coerce.number().int().nonnegative().optional(),
  "preferred-dates": z.string().max(300).optional(),
  city: z.string().max(200).optional(),
  state: z.string().max(100).optional(),
  "time-zone": z.string().optional(),
  "selected-session": z.string().min(1, "a session must be selected"),
  "course-type": z.string().optional(),
  "delivery-format": z.string().optional(),
  "referral-source": z.string().optional(),

  "payment-type": z.string().min(1),
  "billing-organization": z.string().max(300).optional(),
  "billing-contact-name": z.string().max(200).optional(),
  "billing-contact-email": z.string().email().optional().or(z.literal("")),
  "purchase-order-number": z.string().max(100).optional(),
  "funding-source": z.string().optional(),
  "budget-range": z.string().optional(),
  "invoice-po-needed": z.string().optional(),
  "payment-assistance": z.string().optional(),

  "accommodation-needed": z.string().optional(),
  "technical-support": z.string().optional(),
  "accommodation-summary": z.string().max(5000).optional(), // RESTRICTED — split before persistence

  "acknowledge-seat-pending": z.coerce.boolean(),
  "acknowledge-tuition": z.coerce.boolean(),
  "acknowledge-prework": z.coerce.boolean(),
  "acknowledge-attendance": z.coerce.boolean(),
  "acknowledge-policies": z.coerce.boolean(),
  "operational-email-consent": z.coerce.boolean(),
  "marketing-consent": z.coerce.boolean().optional(),
});

export type MhfaIndividualRegistration = z.infer<typeof mhfaIndividualRegistrationSchema>;

const REQUIRED_ACKNOWLEDGMENTS: Array<keyof MhfaIndividualRegistration> = [
  "acknowledge-seat-pending",
  "acknowledge-tuition",
  "acknowledge-prework",
  "acknowledge-attendance",
  "acknowledge-policies",
  "operational-email-consent",
];

export function assertRequiredAcknowledgments(data: MhfaIndividualRegistration): string[] {
  return REQUIRED_ACKNOWLEDGMENTS.filter((field) => data[field] !== true);
}

/** Fields treated as Restricted (governance): never logged, never in general payloads. */
export const RESTRICTED_FIELDS: Array<keyof MhfaIndividualRegistration> = ["accommodation-summary"];

export function splitRestrictedFields(data: MhfaIndividualRegistration) {
  const restricted: Record<string, unknown> = {};
  const general: Record<string, unknown> = { ...data };
  for (const field of RESTRICTED_FIELDS) {
    if (general[field] !== undefined) {
      restricted[field] = general[field];
      delete general[field];
    }
  }
  return { general, restricted };
}
