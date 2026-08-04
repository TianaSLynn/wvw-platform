import { z } from "zod";

/**
 * Matches the REAL live Netlify form `FORM-MHFA-014` on
 * wholisticvibeswellness.com, retrieved via the Netlify API on 2026-08-03
 * (see docs/FORM_REGISTRY.md). Backs MHFA-ATT-01 (attendance verification).
 *
 * Instructor-submitted, not learner-facing. Per spec: record evidence
 * source, update attendance status, prevent certificate eligibility when
 * incomplete, preserve audit trail. No restricted-data split needed —
 * instructor-notes is operational commentary, not a learner disclosure.
 */
export const mhfaAttendanceSchema = z.object({
  "form-id": z.string().optional(),
  "official-form-name": z.string().optional(),
  "bot-field": z.string().max(0, "spam detected"),

  "session-id": z.string().min(1, "session-id is required"),
  learner: z.string().min(1, "learner identifier is required"),
  // Netlify's form API reports this field's type (select) but not its actual
  // option values, so this deliberately doesn't hardcode a guessed enum —
  // only Tiána's live form config knows the real values (see docs/DECISION_REGISTER.md).
  "attendance-status": z.string().min(1, "attendance-status is required"),
  participation: z.string().optional(),
  "completion-status": z.string().optional(),
  "certification-eligibility": z.string().optional(),
  "instructor-notes": z.string().max(3000).optional(),
});

export type MhfaAttendance = z.infer<typeof mhfaAttendanceSchema>;

// A real "does this attendance record support certification eligibility"
// check (MHFA-CERT-01) needs the actual select-field option values from the
// live form, which Netlify's API doesn't expose — only field types. Encoding
// a guessed comparison here would silently produce wrong eligibility
// decisions if the real values differ. Deferred until those values are
// confirmed (docs/DECISION_REGISTER.md).
