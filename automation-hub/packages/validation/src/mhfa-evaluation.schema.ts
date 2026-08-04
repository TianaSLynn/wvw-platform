import { z } from "zod";

/**
 * Matches the REAL live Netlify form `FORM-MHFA-011` on
 * wholisticvibeswellness.com, retrieved via the Netlify API on 2026-08-03
 * (see docs/FORM_REGISTRY.md). Backs MHFA-EVAL-01 (individual evaluation).
 *
 * Per spec: preserve anonymity configuration where applicable, produce
 * aggregate metrics, avoid exposing sensitive free-text responses
 * unnecessarily. `improvement-suggestions` and `future-training-interest`
 * are free text and are split out of the general payload — not because
 * they're Restricted in the governance sense (they're not accommodation/
 * complaint-grade), but because individual evaluation comments shouldn't
 * flow into general dashboards unaggregated.
 */
export const mhfaEvaluationSchema = z.object({
  "form-id": z.string().optional(),
  "bot-field": z.string().max(0, "spam detected"),

  session: z.string().min(1, "session is required"),
  instructor: z.string().optional(),
  "course-usefulness": z.string().optional(),
  "instructor-effectiveness": z.string().optional(),
  "confidence-gained": z.string().optional(),
  accessibility: z.string().optional(),
  "technology-experience": z.string().optional(),
  satisfaction: z.string().optional(),
  "improvement-suggestions": z.string().max(3000).optional(),
  "future-training-interest": z.string().max(3000).optional(),
  "testimonial-permission": z.coerce.boolean().optional(),
});

export type MhfaEvaluation = z.infer<typeof mhfaEvaluationSchema>;

const FREE_TEXT_FIELDS: Array<keyof MhfaEvaluation> = ["improvement-suggestions", "future-training-interest"];

export function splitEvaluationFreeText(data: MhfaEvaluation) {
  const freeText: Record<string, unknown> = {};
  const scores: Record<string, unknown> = { ...data };
  for (const field of FREE_TEXT_FIELDS) {
    if (scores[field] !== undefined) {
      freeText[field] = scores[field];
      delete scores[field];
    }
  }
  return { scores, freeText };
}
