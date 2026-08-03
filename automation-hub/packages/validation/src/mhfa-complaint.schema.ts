import { z } from "zod";

/**
 * Matches the REAL live Netlify form `FORM-MHFA-013` on
 * wholisticvibeswellness.com, retrieved via the Netlify API on 2026-08-03
 * (see docs/FORM_REGISTRY.md). Backs MHFA-COMP-01 (complaint / appeal).
 *
 * Per governance and the CEO Executive Decisions doc (2026-07-28): narrative
 * is Restricted and belongs in a protected destination — TRAIN-19 |
 * Complaints & Appeals, NOT the general TRAIN-18 Exceptions Queue (TRAIN-18
 * may only get a linked pointer if there's also an operational exception,
 * e.g. a failed acknowledgment email — never the complaint content itself).
 * This intake handler never produces automated conclusions about the
 * complaint, only routes it.
 */
export const mhfaComplaintSchema = z.object({
  subject: z.string().optional(),
  "workflow-code": z.string().optional(),
  "form-id": z.string().optional(),
  "bot-field": z.string().max(0, "spam detected"),

  name: z.string().min(1, "name is required"),
  email: z.string().email(),
  session: z.string().optional(),
  "concern-type": z.string().min(1, "concern-type is required"),
  "concern-or-incident": z.string().min(1).max(5000), // RESTRICTED
  "requested-response": z.string().max(3000).optional(), // RESTRICTED
});

export type MhfaComplaint = z.infer<typeof mhfaComplaintSchema>;

export const COMPLAINT_RESTRICTED_FIELDS: Array<keyof MhfaComplaint> = ["concern-or-incident", "requested-response"];

/** General-purpose pointer only: existence + routing metadata, never the narrative. */
export function toGeneralComplaintPointer(data: MhfaComplaint) {
  return {
    name: data.name,
    email: data.email,
    session: data.session,
    "concern-type": data["concern-type"],
    "complaint-open": true,
    "case-status": "new",
  };
}

export function toRestrictedComplaintRecord(data: MhfaComplaint) {
  return {
    name: data.name,
    email: data.email,
    session: data.session,
    "concern-type": data["concern-type"],
    "concern-or-incident": data["concern-or-incident"],
    "requested-response": data["requested-response"],
  };
}
