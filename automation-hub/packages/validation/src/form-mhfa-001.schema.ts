import { z } from "zod";

/**
 * Matches the REAL live Netlify form `FORM-MHFA-001` on
 * wholisticvibeswellness.com, retrieved via the Netlify Forms API on
 * 2026-08-04. This is the numbered form that actually has real submissions
 * (1 as of 2026-08-04) — unlike `mhfa-individual-registration` (the named
 * form the original MHFA-REG-01 schema was built against), which has zero.
 * See docs/IMPLEMENTATION_REGISTER.md for the open finding this resolves.
 *
 * Field names deliberately differ from `mhfa-individual-registration.schema.ts`
 * (e.g. `session-choice` not `selected-session`, a different acknowledgment
 * set) — do not merge the two schemas, they track genuinely different forms.
 */
export const formMhfa001Schema = z.object({
  "bot-field": z.string().max(0, "spam detected"),
  "session-id": z.string().optional(),
  "session-date": z.string().optional(),
  "session-time": z.string().optional(),
  "session-format": z.string().optional(),
  "session-price": z.string().optional(),

  "session-choice": z.string().min(1, "a session must be selected"),
  "first-name": z.string().min(1).max(200),
  "last-name": z.string().min(1).max(200),
  "preferred-name": z.string().max(200).optional(),
  email: z.string().email(),
  "mhfa-connect-email": z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  "time-zone": z.string().optional(),
  organization: z.string().max(300).optional(),
  "communication-language": z.string().optional(),

  "payment-route": z.string().optional(),
  "billing-contact-email": z.string().email().optional().or(z.literal("")),

  "accommodation-needed": z.string().optional(),
  "technical-support": z.string().optional(),

  "acknowledge-payment": z.coerce.boolean(),
  "acknowledge-minimum": z.coerce.boolean(),
  "acknowledge-teams": z.coerce.boolean(),
  "acknowledge-prework": z.coerce.boolean(),
  "acknowledge-attendance": z.coerce.boolean(),
  "acknowledge-postwork": z.coerce.boolean(),
  "acknowledge-policies": z.coerce.boolean(),
  "operational-email-consent": z.coerce.boolean(),
  "newsletter-consent": z.coerce.boolean().optional(),
});

export type FormMhfa001 = z.infer<typeof formMhfa001Schema>;

const REQUIRED_ACKNOWLEDGMENTS: Array<keyof FormMhfa001> = [
  "acknowledge-payment",
  "acknowledge-minimum",
  "acknowledge-teams",
  "acknowledge-prework",
  "acknowledge-attendance",
  "acknowledge-postwork",
  "acknowledge-policies",
  "operational-email-consent",
];

export function assertRequiredAcknowledgments(data: FormMhfa001): string[] {
  return REQUIRED_ACKNOWLEDGMENTS.filter((field) => data[field] !== true);
}

// No free-text narrative field exists on this form (accommodation-needed is
// a select, not a text box) — nothing to split out as Restricted.
