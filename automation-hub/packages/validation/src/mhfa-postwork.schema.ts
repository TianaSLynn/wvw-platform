import { z } from "zod";

/**
 * Matches two REAL live Netlify forms backing MHFA-POST-01 (post-work
 * reconciliation), retrieved via the Netlify API on 2026-08-03 (see
 * docs/FORM_REGISTRY.md):
 * - FORM-MHFA-010: pre-work/post-work support request
 * - FORM-MHFA-016: payment/invoice reconciliation request
 *
 * Per spec: update post-work status, schedule reminders, support
 * platform-access exceptions, prevent certificate eligibility until
 * complete. Certificate eligibility itself (MHFA-CERT-01) is a separate,
 * derived workflow this hub doesn't implement yet — it needs persisted
 * attendance + pre-work + post-work state, which requires the Supabase
 * connection this hub doesn't have (docs/DECISION_REGISTER.md, Decision 6).
 */
export const mhfaPreworkSupportSchema = z.object({
  "form-id": z.string().optional(),
  "official-form-name": z.string().optional(),
  "bot-field": z.string().max(0, "spam detected"),

  learner: z.string().min(1, "learner is required"),
  email: z.string().email(),
  session: z.string().optional(),
  "prework-status": z.string().optional(),
  "support-needed": z.string().max(2000).optional(),
});
export type MhfaPreworkSupport = z.infer<typeof mhfaPreworkSupportSchema>;

export const mhfaPaymentReconciliationSchema = z.object({
  "form-id": z.string().optional(),
  "official-form-name": z.string().optional(),
  "bot-field": z.string().max(0, "spam detected"),

  "registration-id": z.string().min(1, "registration-id is required"),
  learner: z.string().min(1, "learner is required"),
  "payment-or-invoice-reference": z.string().optional(),
  amount: z.coerce.number().optional(),
  "reconciliation-type": z.string().min(1, "reconciliation-type is required"),
  "resolution-status": z.string().optional(),
  "resolution-notes": z.string().max(2000).optional(),
});
export type MhfaPaymentReconciliation = z.infer<typeof mhfaPaymentReconciliationSchema>;
