# Form Registry

Source: live Netlify API (`netlify-project-services-reader get-forms-for-project`), 2026-08-03. This is real platform data, not inferred from any repo (the repos contain no page source for these sites — see `CURRENT_STATE_AUDIT.md`).

## Site: wholisticvibeswellness.com (`04583215-c6f3-4e4f-b18d-26fdc4fada62`)

| Form name | Created | Last submission | Submissions | Notable hidden/routing fields | Likely automation code |
|---|---|---|---|---|---|
| `mhfa-individual-registration` | 2026-07-21 | — | 0 | `session-route` (hidden) | MHFA-REG-01 |
| `mhfa-group-training-inquiry` | 2026-07-20 | — | 0 | `program` (hidden) | MHFA-GRP-01 |
| `academy-application` | 2026-07-20 | — | 0 | `subject` (hidden) | Academy intake |
| `mhfa-accommodation-request` | 2026-07-21 | — | 0 | `responsible-department` (hidden) | MHFA-ACC-01 (Restricted) |
| `mhfa-payment-assistance` | 2026-07-21 | — | 0 | `program` (hidden) | MHFA payment support |
| `mhfa-change-refund-request` | 2026-07-21 | — | 0 | `subject`, `program` (hidden) | Registration change/refund |
| `mhfa-graduate-support` | 2026-07-27 | 2026-08-02 | 0* | `workflow-code`, `form-id`, `subject` (hidden) | MHFA-FUP-01 support path |
| `academy-interest-list` | 2026-07-27 | 2026-08-02 | 0* | `workflow-code`, `form-id`, `subject` (hidden) | Academy nurture |
| `consultation-request` | 2026-07-20 | 2026-08-02 | 0* | `workflow-code`, `form-id`, `subject` (hidden) | Sales/consulting intake |
| `general-contact` | 2026-07-20 | 2026-08-02 | 0* | `workflow-code`, `form-id`, `subject` (hidden) | General contact |
| `speaking-inquiry` | 2026-07-20 | — | 0 | `workflow-code`, `form-id`, `subject` (hidden) | Speaking intake |
| `discovery-call` | 2026-06-26 | 2026-07-17 | 0* | `subject` (hidden) | Discovery-call CTA |
| `FORM-MHFA-001` | 2026-07-21 | 2026-08-02 | 1 | `session-id/date/time/format/price` (hidden), `official-form-name` | MHFA-REG-01 (numbered variant — see note below) |
| `FORM-MHFA-002` | 2026-07-21 | 2026-08-02 | 1 | `record-type`, `official-form-name` (hidden) | MHFA-GRP-01 |
| `FORM-MHFA-003` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | Sponsorship/billing intake |
| `FORM-MHFA-004` | 2026-07-21 | 2026-08-02 | 1 | `official-form-name` (hidden) | Learner barrier/support request |
| `FORM-MHFA-005` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | Session change/policy request |
| `FORM-MHFA-006` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | Cancellation/refund |
| `FORM-MHFA-007` | 2026-07-21 | — | 0 | `record-type`, `official-form-name` (hidden) | Waitlist/interest |
| `FORM-MHFA-008` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | MHFA-CERT-CORR-01 (built) |
| `FORM-MHFA-009` | 2026-07-21 | — | 0 | `official-form-name` (hidden), `screenshot` (file) | Technical support |
| `FORM-MHFA-010` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | MHFA-POST-01 pre-work support (built) |
| `FORM-MHFA-011` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | MHFA-EVAL-01 (built) |
| `FORM-MHFA-012` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | Issue report |
| `FORM-MHFA-013` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | MHFA-COMP-01 (Restricted, built) |
| `FORM-MHFA-014` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | MHFA-ATT-01 (built) |
| `FORM-MHFA-015` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | Session closeout summary |
| `FORM-MHFA-016` | 2026-07-21 | — | 0 | `official-form-name` (hidden) | MHFA-POST-01 payment reconciliation |

\* "0 submissions" with a recent `last_submission_at` is as returned by the API — likely a count-vs-timestamp sync quirk, not evidence of no activity. Treat `last_submission_at` as the reliable signal.

**Open question:** there appear to be two parallel form sets for the same purposes — the human-named forms (`mhfa-individual-registration`, etc.) and the numbered `FORM-MHFA-0xx` set. Both are live. This needs clarifying with Tiána (or via her Notion Form Registry, TRAIN-12 / MHFA-40) as to which is canonical before the hub picks one to build against — building the intake function against the wrong one would miss real submissions.

## Site: wvw-academy (wvwacademy.com, `37ce5afb-5e17-4d98-8f6e-59a06298d619`)

| Form name | Created | Last submission | Notes |
|---|---|---|---|
| `chw-interest-list` | 2026-07-22 | — | Community Health Worker program interest |
| `academy-updates` | 2026-07-22 | — | Newsletter opt-in |
| `partnership-inquiry` | 2026-07-22 | — | |
| `speaking-inquiry` | 2026-07-22 | — | Duplicate purpose vs. main-site form |
| `general-contact` | 2026-07-22 | — | Duplicate purpose vs. main-site form |
| `adult-mhfa-registration` | 2026-07-22 | — | Duplicate purpose vs. `mhfa-individual-registration` / `FORM-MHFA-001` |
| `organizational-training-inquiry` | 2026-07-22 | — | Duplicate purpose vs. `mhfa-group-training-inquiry` |
| `burnout-results-optin` | 2026-06-18 | 2026-07-29 | Feeds the WVW burnout-risk audit tool |
| `contact` | 2026-06-18 | 2026-07-01 | |
| `employer-partner` | 2026-06-18 | 2026-07-07 | |
| `mhfa-interest` | 2026-06-18 | — | |

**Finding:** the Academy site independently re-implements several forms that also exist on the main site (registration, group training inquiry, general contact, speaking inquiry) rather than sharing a single canonical form. Both need to funnel into the same hub intake path with a `source_site` field to avoid duplicate learner/organization records — this is built into the validation schema (see `packages/validation`).
