# Implementation Register

Status key: **Designed** (documented, no code) · **Built** (code exists) · **Dev-tested** (verified locally) · **Accepted** (passed acceptance criteria with Tiána) · **Production Approved** · **Active**

All entries below are at most **Dev-tested**. Nothing has been accepted, approved for production, or activated.

| Component | Status | Evidence |
|---|---|---|
| Repo audit across 7 repositories + live Netlify/Supabase/Notion/Microsoft Graph state | Built | `docs/CURRENT_STATE_AUDIT.md` |
| ADR-001 (Zapier → hub migration decision) | Built | `docs/ARCHITECTURE_DECISIONS.md` |
| ADR-002 (repo location) | Built | `docs/ARCHITECTURE_DECISIONS.md` |
| ADR-003 (reuse existing Notion schema) | Built | `docs/ARCHITECTURE_DECISIONS.md` |
| Zapier removal register (14 automations classified) | Built | `docs/ZAPIER_REMOVAL_REGISTER.md` |
| Form registry (25 + 11 live forms, real field lists) | Built | `docs/FORM_REGISTRY.md`, sourced from Netlify API |
| Correlation ID standard (`WVW\|DOMAIN\|CODE\|DATE\|ULID`) | Dev-tested | `packages/shared-types/src/correlation-id.ts`; generation, parsing, and validation verified directly (vitest itself is blocked in this nested-repo location — see Known Issues below; verified via direct `tsx` execution instead) |
| Canonical payload hash (dedup) | Dev-tested | `packages/shared-types/src/payload-hash.ts`; verified key-order independence and content sensitivity |
| MHFA-REG-01 validation schema, matched field-for-field against the live `mhfa-individual-registration` Netlify form | Dev-tested | `packages/validation/src/mhfa-individual-registration.schema.ts` |
| Restricted-field splitting (accommodation summary never reaches general logs) | Dev-tested | Verified: restricted field correctly separated from general payload |
| MHFA-GRP-01 validation schema, matched field-for-field against the live `mhfa-group-training-inquiry` Netlify form | Dev-tested | `packages/validation/src/mhfa-group-training-inquiry.schema.ts` |
| MHFA-ACC-01 validation schema, matched field-for-field against the live `mhfa-accommodation-request` Netlify form | Dev-tested | `packages/validation/src/mhfa-accommodation-request.schema.ts` — entire form treated as Restricted; only a sanitized pointer (`accommodation-requested: true`, no content) is eligible for general logging, verified the pointer never contains the accommodation text |
| MHFA-ATT-01 validation schema, matched field-for-field against the live `FORM-MHFA-014` Netlify form | Dev-tested | `packages/validation/src/mhfa-attendance.schema.ts` — deliberately does not guess at select-field option values Netlify's API doesn't expose (see file comment) |
| MHFA-EVAL-01 validation schema, matched field-for-field against the live `FORM-MHFA-011` Netlify form | Dev-tested | `packages/validation/src/mhfa-evaluation.schema.ts` — free-text fields split from scored fields so individual comments don't flow into general dashboards unaggregated |
| MHFA-COMP-01 validation schema, matched field-for-field against the live `FORM-MHFA-013` Netlify form | Dev-tested | `packages/validation/src/mhfa-complaint.schema.ts` — entire narrative treated as Restricted per the CEO decision doc (routes to a TRAIN-19-equivalent, never TRAIN-18/general logs); verified the general pointer never contains narrative content |
| `POST /.netlify/functions/intake` — dispatch table for MHFA-REG-01, MHFA-GRP-01, MHFA-ACC-01, MHFA-ATT-01, MHFA-EVAL-01, MHFA-COMP-01 | Dev-tested, **each path individually feature-flagged off** (`MHFA_REG_01_ENABLED`, `MHFA_GRP_01_ENABLED`, `MHFA_ACC_01_ENABLED`, `MHFA_ATT_01_ENABLED`, `MHFA_EVAL_01_ENABLED`, `MHFA_COMP_01_ENABLED`) | Verified: correct routing per form name, unsupported form → 422, regression-checked on every addition that earlier paths still work |
| Supabase core schema (`automation_events`, `workflow_executions`, `integration_mappings`, `automation_exceptions`, `communications_queue`, `dashboard_metrics`, `feature_flags`) | Designed, migration written | `supabase/migrations/0001_core_automation_tables.sql` — **not applied**, no active Supabase project (Decision 6 open) |
| Supabase MHFA domain schema (`organizations`, `contacts`, `learners`, `sessions`, `registrations`, `payments`, `form_registry`) | Designed, migration written | `supabase/migrations/0002_mhfa_domain_tables.sql` — **not applied** |
| Supabase persistence wiring for the intake function | Missing | Blocked on Decision 6 (which project, resume approval) |
| Notion integration package | Missing | Blocked on confirming exact TRAIN OS™ database IDs (Decision Register — manual actions) |
| Microsoft Graph / Outlook draft creation | Missing | Session has a working Graph connection for read/search; draft-creation code not yet built |
| Wave Pro integration | Missing | Blocked entirely — no credentials/connector available |
| Apollo.io integration | Missing | Blocked entirely — no credentials/connector available |
| MHFA-GRP-02, CERT-CORR-01, POST-01, CERT-01, FUP-01, EMP-01 handlers | Missing | Not started. MHFA-REG-01, GRP-01, ACC-01, ATT-01, EVAL-01, and COMP-01 are built; remaining paths follow Tiána's own "Zapier Implementation Priority Order" note in the CEO decision doc. GRP-02 additionally needs a Microsoft Forms + Excel roster-upload integration this hub doesn't have yet |
| Executive dashboard app | Missing | Not started |
| PAM executive intelligence | Missing | Not started |
| CI/CD (GitHub Actions) | Missing | Not started |
| Full test suite (50 minimum scenarios from spec) | Missing | 8 scenarios covered by the current test file; the other ~42 require the missing components above |

## Known issues

- `npm test` (vitest) fails when run from inside `automation-hub/` because Vite's PostCSS config resolution walks up to the parent `wvw-platform` repo root (shared `.git`) and finds its Tailwind config, which isn't installed in this subtree. This is a direct consequence of ADR-002 (nesting inside `wvw-platform` instead of a standalone repo) and is expected to resolve itself once extracted to its own repository. In the meantime, all logic in this register was verified by direct execution (`npx tsx`), not by a passing `vitest run` — that distinction matters and is not being glossed over.
