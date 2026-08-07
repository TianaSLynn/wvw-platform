import { z } from "zod";

/**
 * Matches the REAL live Netlify form `FORM-MHFA-002` on
 * wholisticvibeswellness.com, retrieved via the Netlify Forms API on
 * 2026-08-04. This is the numbered form that actually has real submissions
 * (1 as of 2026-08-04) — unlike `mhfa-group-training-inquiry` (the named
 * form the original MHFA-GRP-01 schema was built against), which has zero.
 * See docs/IMPLEMENTATION_REGISTER.md for the open finding this resolves.
 */
export const formMhfa002Schema = z.object({
  "bot-field": z.string().max(0, "spam detected"),
  "record-type": z.string().optional(),

  organization: z.string().min(1).max(300),
  "contact-name": z.string().min(1).max(200),
  "work-email": z.string().email(),
  phone: z.string().max(30).optional(),
  "organization-type": z.string().optional(),
  "estimated-learner-count": z.coerce.number().int().nonnegative().optional(),
  "preferred-date": z.string().optional(),
  "alternative-date": z.string().optional(),
  "delivery-preference": z.string().optional(),
  "in-person-location": z.string().max(300).optional(),
  "purchase-order-or-invoicing-needs": z.string().optional(),
  "decision-timeline": z.string().optional(),
  "funding-deadline": z.string().optional(),
  "referral-source": z.string().optional(),
  "additional-context": z.string().max(5000).optional(),

  "follow-up-consent": z.coerce.boolean(),
  "acknowledge-not-a-booking": z.coerce.boolean(),
});

export type FormMhfa002 = z.infer<typeof formMhfa002Schema>;

const REQUIRED_ACKNOWLEDGMENTS: Array<keyof FormMhfa002> = ["follow-up-consent", "acknowledge-not-a-booking"];

export function assertRequiredAcknowledgments(data: FormMhfa002): string[] {
  return REQUIRED_ACKNOWLEDGMENTS.filter((field) => data[field] !== true);
}
