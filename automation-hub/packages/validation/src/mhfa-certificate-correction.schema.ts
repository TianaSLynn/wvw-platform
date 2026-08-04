import { z } from "zod";

/**
 * Matches the REAL live Netlify form `FORM-MHFA-008` on
 * wholisticvibeswellness.com, retrieved via the Netlify API on 2026-08-03
 * (see docs/FORM_REGISTRY.md). Backs MHFA-CERT-CORR-01 (certificate
 * correction request).
 *
 * Per spec: validate learner, validate course, create correction case,
 * create draft response, track resolution. Operational correction data
 * (name spelling, etc.) — not treated as Restricted like accommodation or
 * complaint content, but still routed through a tracked case rather than
 * applied automatically, since certificate data is authoritative.
 */
export const mhfaCertificateCorrectionSchema = z.object({
  subject: z.string().optional(),
  "workflow-code": z.string().optional(),
  "form-id": z.string().optional(),
  "official-form-name": z.string().optional(),
  "bot-field": z.string().max(0, "spam detected"),

  "current-learner-name": z.string().min(1, "current-learner-name is required"),
  email: z.string().email(),
  session: z.string().optional(),
  "information-to-correct": z.string().min(1, "information-to-correct is required"),
  "correct-information": z.string().min(1).max(2000),
});

export type MhfaCertificateCorrection = z.infer<typeof mhfaCertificateCorrectionSchema>;
