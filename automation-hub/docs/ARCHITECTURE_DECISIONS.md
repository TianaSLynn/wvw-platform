# Architecture Decision Records

## ADR-001 — Migrate MHFA automation from Zapier to the WVW Automation Hub (Netlify Functions + Supabase Edge Functions)

**Date:** 2026-08-03
**Status:** Accepted
**Decision authority:** Tiána Lynn (via direct instruction), superseding the 2026-07-28 CEO Executive Decision that had fixed Zapier as MHFA's sole orchestrator.

**Context:** MHFA automation (AUTO-01 through AUTO-14) currently runs live on Zapier, processing real learner registrations, payments, and communications against 25+ live Netlify forms and a mature Notion "TRAIN OS™" data model. All 14 automations are recorded as "In progress" / untested in Tiána's own Automation Registry, and one (MHFA-01A) has an unresolved production data-integrity incident.

**Decision:** Rebuild MHFA automation on Netlify Functions (intake) + Supabase Edge Functions (routing/orchestration), per the architecture in this assignment, as the new system of record for automation execution state.

**Cutover approach — phased, not silent:**
1. Build and test each replacement path (starting with MHFA-REG-01, individual registration) against real form schemas, without touching the live Zapier automations.
2. Keep the existing Zapier automations running until each specific replacement has passed acceptance testing and Tiána has explicitly approved cutting that specific path over.
3. Never run both the new hub and the old Zap against the same form submission for the same path — that would create duplicate learner/registration/payment records, which governance rule 19 forbids. Cutover per-path means: the day a path goes live on the hub, the corresponding Zap for that exact trigger is disabled by Tiána (not by this system).
4. Notion remains the executive/operational workspace regardless of orchestrator. Existing database structure (TRAIN-01 Learners, TRAIN-07 execution log, TRAIN-18 exceptions, etc.) should be reused rather than replaced, per governance rule 19 ("do not create duplicate technical entities") — the hub's Notion integration package should write into these existing databases once their exact database IDs are confirmed (see `docs/CREDENTIALS_AND_MANUAL_ACTIONS.md`), not new ones.
5. The MHFA-01A bad-record incident is independent of the orchestrator and must be resolved (or explicitly deferred by Tiána) before AUTO-01's replacement (MHFA-REG-01) goes live, so bad data isn't inherited.

**Consequences:** Until cutover is explicitly approved per path, this hub has zero effect on production. All Netlify Functions / Supabase Edge Functions built here start feature-flagged off. This satisfies governance rules 14/15/30 (no production changes/activation without approval, new features default inactive).

---

## ADR-002 — Hub code lives in `wvw-platform` as an isolated subtree, pending a dedicated repo

**Date:** 2026-08-03
**Status:** Accepted (provisional)

**Context:** The target architecture calls for a distinct `wvw-automation-hub` repository. Repo creation failed (GitHub App integration returned 403 — no repo-creation permission in this session). No existing repo named for this purpose exists (`wvw-command` was checked and is an unrelated, mostly-empty Netlify site with no matching GitHub repo).

**Decision:** House the hub at `wvw-platform/automation-hub/` as a fully self-contained subtree (own `package.json`, `netlify/`, `supabase/`, `docs/`) rather than blocking further work on repo creation. No shared code, dependencies, or routes with the rest of `wvw-platform`.

**Consequences:** Extractable later via `git subtree split -P automation-hub` into a dedicated repo with full history, once one exists, at zero cost to what's built here. Flagged to Tiána as provisional in the Decision Register — if she'd rather I use a different existing repo or create a fresh one herself for me to attach, this can move without rework of the code itself, only the repo shell.

---

## ADR-003 — Reuse existing Notion "TRAIN OS™" schema; do not create parallel databases

**Date:** 2026-08-03
**Status:** Accepted

**Context:** A mature Notion database structure already exists (TRAIN-01 Learners, TRAIN-06 payment status, TRAIN-07 execution log, TRAIN-12 automation/form registry, TRAIN-17 reconciliation runs, TRAIN-18 exceptions, TRAIN-19 complaints, COMMS-02/06). This assignment's spec independently describes an equivalent set of concepts (`automation_events`, `automation_exceptions`, `communication_templates`, etc.) without knowing the existing IDs.

**Decision:** The hub's Supabase tables are the durable technical system of record (per this assignment's own architecture rules); the hub's Notion integration package writes *into* the existing TRAIN OS™ databases as the executive/operational view, once exact database IDs are retrieved and confirmed — never inventing new ones (governance rule: "Do not invent database IDs. Retrieve or request them."). A `NOTION_MAPPING.md` will record the confirmed IDs as they're retrieved.

**Consequences:** No new Notion databases are created by this hub unless Tiána explicitly authorizes a specific gap the existing schema can't cover.
