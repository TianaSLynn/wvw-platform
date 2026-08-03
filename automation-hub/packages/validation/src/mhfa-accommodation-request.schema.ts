import { z } from "zod";

/**
 * Matches the REAL live Netlify form `mhfa-accommodation-request` on
 * wholisticvibeswellness.com, retrieved via the Netlify API on 2026-08-03
 * (see docs/FORM_REGISTRY.md). Backs MHFA-ACC-01.
 *
 * Per governance, this entire form is treated as Restricted: `accommodation-needs`
 * is never logged or stored in a general-purpose table. Only `learner-name` and
 * `email` (needed to match a learner record) plus routing metadata are general.
 * The intake handler must write the restricted portion only to the approved
 * secure destination (M365 protected workbook / TRAIN-14-equivalent), never to
 * automation_events.payload or any structured log.
 */
export const mhfaAccommodationRequestSchema = z.object({
  "bot-field": z.string().max(0, "spam detected"),
  "responsible-department": z.string().optional(),

  "learner-name": z.string().min(1).max(200),
  email: z.string().email(),
  "session-id-or-date": z.string().max(200).optional(),
  "preferred-contact-method": z.string().optional(),
  "accommodation-needs": z.string().min(1).max(5000), // RESTRICTED — required, this is the whole point of the form
});

export type MhfaAccommodationRequest = z.infer<typeof mhfaAccommodationRequestSchema>;

export const ACCOMMODATION_RESTRICTED_FIELDS: Array<keyof MhfaAccommodationRequest> = ["accommodation-needs"];

/**
 * Returns only what's safe for a general-purpose automation_events record:
 * "an accommodation request exists for this learner/session," never the content.
 */
export function toGeneralAccommodationPointer(data: MhfaAccommodationRequest) {
  return {
    "learner-name": data["learner-name"],
    email: data.email,
    "session-id-or-date": data["session-id-or-date"],
    "accommodation-requested": true,
    "accommodation-status": "new",
  };
}

export function toRestrictedAccommodationRecord(data: MhfaAccommodationRequest) {
  return {
    "learner-name": data["learner-name"],
    email: data.email,
    "preferred-contact-method": data["preferred-contact-method"],
    "accommodation-needs": data["accommodation-needs"],
  };
}
