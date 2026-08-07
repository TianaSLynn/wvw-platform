# Zapier Removal Register

**Important context change:** this assignment originally called for removing all Zapier dependencies outright. On 2026-08-03, the actual state was found to be a live, CEO-designated Zapier-based MHFA automation system (14 automations, real learner data). Tiána's direction, once informed, was to migrate MHFA off Zapier — but as a **phased cutover**, not an immediate removal (ADR-001). This register reflects that: nothing here is removed yet. Each row's "Target state" is the plan, not a completed action.

| Reference | Location | Classification | Target state |
|---|---|---|---|
| AUTO-01 Public Registration Intake | Zapier (live) / Notion Automation Registry | Active | Replacement (MHFA-REG-01) built + dev-tested on the hub, feature-flagged off. Not yet cut over — Zap stays authoritative until Tiána approves and disables it (audit trail preserved, not deleted). |
| AUTO-02 Payment Confirmation | Zapier (live) | Active | Replace after AUTO-01; depends on Wave integration existing first. |
| AUTO-03 Payment Reminder / Expiration | Zapier (live) | Active | Report-only replacement (MHFA-PAY-02) built + dev-tested, feature-flagged off. Full replacement blocked on two real gaps: MHFA-02 is missing the `24hr Reminder Sent`/`Final Reminder Sent` fields the real build sheet requires, and this hub has no email-send integration yet. Not cut over — Zap stays authoritative. |
| AUTO-04 Group Inquiry Intake | Zapier (live) | Active | Replacement (MHFA-GRP-01) built + dev-tested on the hub, feature-flagged off. Not yet cut over. |
| AUTO-05 Group Roster Import | Zapier (live) / Power Automate (per its own build sheet — inconsistent with its Platform field) | Active | **Blocked, not built.** Needs a real SharePoint site/library, workbook table name, and roster column list from Tiána — none discoverable without her, and the live build sheet's own Platform is ambiguous (Zapier per registry field vs. Power Automate per the build sheet itself). |
| AUTO-06 MHFA Connect Enrollment Readiness | Zapier (live) / MHFA-CONNECT-01 (hub) | **Active on the hub** (`MHFA_CONNECT_01_ENABLED=true`, 2026-08-07, Tiána approved) | Writes an internal MHFA-05 task only — no external MHFA Connect API call, matching the real build sheet's "no direct MHFA Connect API assumed." Verified live with a real test-and-cleanup. Zap for this automation not yet confirmed disabled by Tiána — same dual-processing risk noted for AUTO-01 applies here until she disables/archives it. |
| AUTO-07 Pre-Work Reminder | Zapier (live) | Active | Later phase. |
| AUTO-08 Session Reminder Cadence | Zapier (live) | Active | Later phase. |
| AUTO-09 Attendance and Closeout | Zapier (live) | Active | Attendance portion (MHFA-ATT-01) built + dev-tested on the hub, feature-flagged off. Closeout (session-level reconciliation) not yet built. Not yet cut over. |
| AUTO-10 Certification Follow-Up | Zapier (live) | Active | Later phase. |
| AUTO-11 Accommodation Alert | Zapier (live) | Active | Replacement (MHFA-ACC-01) built + dev-tested on the hub, feature-flagged off. Restricted-data path — entire form treated as Restricted; only a sanitized pointer is eligible for general logging. Not yet cut over. |
| AUTO-12 Executive Dashboard Refresh | Zapier (live) | Active | Superseded by the hub's own dashboard metrics pipeline; replace last, only once source systems (above) are reliable — matches Tiána's own "Zapier Implementation Priority Order" note (dashboard refresh listed last for the same reason). |
| AUTO-13 Exception Alert and Retry | Zapier (live) | Active | Hub has native exception handling (`automation_exceptions` table) from day one; still needs a defined cutover for the Zapier-side version. |
| AUTO-14 Data Reconciliation | Zapier (live) | Active | Later phase; also relevant to closing out MHFA-01A. |
| `wvw-platform` job-application Zapier trigger (most recent commit) | `wvw-platform` git history | Active, **out of scope** | Not part of MHFA; not touched by this hub. |
| Historical Power Automate deployment manual (Notion) | Notion | Historical/deprecated (already labeled as such by its own doc) | No action needed — already correctly archived. |
| "WVW OS™ Architecture Standard (Target)" — "Zapier is the only business-process automation orchestrator" | Notion, dated 2026-07-28 | **Superseded** by ADR-001 (2026-08-03) | Should be updated by Tiána (or on her authorization) to reflect the new orchestrator, once the hub has real production paths live — not before, to avoid the document lying about current state. |

## Governing statement (to apply once cutover is materially underway, not yet)

> WVW's MHFA automation is migrating from Zapier to the proprietary WVW Automation Hub (Netlify + Supabase, structured execution logs, exception handling, and PAM-supported executive intelligence), via a phased, Tiána-approved cutover per automation path. Zapier remains live and authoritative for any path not yet cut over. Historical Zapier references remain in Notion as accurate historical record, not to be silently rewritten.
