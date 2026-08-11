# Decision Register

## Decision 1 — Zapier vs. the hub — RESOLVED 2026-08-03

**Resolution:** Migrate MHFA off Zapier onto the hub, via a phased, per-path cutover (ADR-001). Zapier stays live and authoritative for every path not yet individually cut over and approved.

---

## Decision 2 — MHFA-01A incident status — OPEN

The Executive Decisions doc says do not reactivate MHFA-01A until 5 bad production records are reconciled. The most recent evidence found (2026-07-30) shows 1 of those still unresolved, with a data-matching gap. Is this now closed? This should be resolved (or explicitly deferred by you) before MHFA-REG-01's replacement goes live, so bad data isn't inherited into the new system.

---

## Decision 3 — Where does the live website source code actually live? — OPEN

`wvw-website` and `wvw-academy` git repos contain no page source — only docs/config — yet 25 + 11 real forms exist live. Is there a repo I haven't been given access to, or are these sites maintained outside git? Until resolved, the hub only reads form *schemas* via the Netlify API; it does not edit site templates.

**New evidence (2026-08-03):** the 25 live Netlify forms and Notion's own governing "MHFA Form Registry" database do not reference each other at all. The registry's `MHFA-REG-01` entry points to `wholisticvibeswellness.com/mhfa/upcoming-trainings/` (a native website form, Platform="Other") and lists only one real Microsoft Form (`MHFA-GRP-01`, Group Training Inquiry, `https://forms.cloud.microsoft/r/dqebX9K046`) — none of the `FORM-MHFA-001`–`016` or `mhfa-*` Netlify forms this hub's intake handlers are built against appear in that registry. Every row in the registry is also marked `Active = No`. This means there may be **two parallel, non-communicating form-building efforts** (Netlify-native vs. Microsoft Forms), and it's unclear which one is actually meant to be canonical going forward. Full findings sent to Tiána as `WVW_MHFA_FORMS_INVENTORY.md` outside this repo. This sharpens Decision 3: it's not just "where's the site source," it's "which form set should the hub actually be built against."

---

## Decision 4 — Canonical platform: `wvw-platform` vs. `wvw-master-intelligence` — OPEN, not blocking this work

Two independently-built "unified operating system" apps exist with overlapping domain models. This doesn't block the automation hub (which is scoped narrowly to intake/routing/integrations, not client/audit/engagement management) but should be resolved separately.

---

## Decision 5 — Repo location — PROVISIONALLY RESOLVED

Used `wvw-platform/automation-hub/` as an isolated, extractable subtree (ADR-002) since repo creation is blocked by GitHub App permissions and no existing dedicated repo was found. Open to moving if you'd rather create a fresh repo for me to attach.

---

## Decision 6 — Persistence project — RESOLVED 2026-08-07

Superseded: not Supabase. Tiána directed this hub to use the existing "wvw-platform" Neon project (`frosty-hill-13583502`), confirmed live via a real Neon API key. The `supabase/migrations/` SQL (0001, 0002) is generic Postgres DDL and was applied as-is against that project's `neondb` database on 2026-08-07 -- the directory name is legacy and no longer implies Supabase specifically.

**Confirmed intentional (Tiána, 2026-08-07): `neondb` is shared with an existing, unrelated business-ops application** (Prisma-managed, PascalCase tables like `User`, `Organization`, `Invoice`, `Client`, `Project` -- likely backing the `wvw-command` Netlify site). This hub's own tables are lowercase/snake_case and confirmed non-colliding. `DATABASE_URL` is set as a secret Netlify env var (production context) on `wvw-automation-hub`. `packages/integration-postgres/` wraps `@neondatabase/serverless`; `workflow_executions` logging is wired into `intake.ts` (every real terminal outcome, not the disabled-dry-run case), gated on its own flag `PERSISTENCE_LOG_ENABLED` (off by default, additive/best-effort, never blocks the real response). Not yet wired into any of the report-only/read-only functions built after `intake.ts` -- that's a separate follow-up.

---

## Decision 7 — Email alerts — RESOLVED 2026-08-11

Tiána asked whether the hub could email/alert her on activity; it couldn't -- no email-sending capability existed anywhere in the codebase. Resolved: Resend, chosen and confirmed by Tiána. First trigger scoped to registration/inquiry alerts only (failure/exception alerts to follow as a separate, later-approved path -- same incremental pattern as every other automation here).

Tiána's first choice for the sending domain was `wholisticvibeswellness.com`, but it isn't verified in Resend (no DNS records added) -- rather than block on DNS setup, she chose to proceed on `wvwacademy.com`, which was already verified in this Resend account since 2026-05-04. Sender: `automation@wvwacademy.com`. Recipient: `hello@wholisticvibeswellness.com`. `RESEND_API_KEY` is set as a secret Netlify env var (production context) on `wvw-automation-hub`.

`packages/integration-email/` wraps the Resend HTTP API directly (no SDK dependency needed for one POST call) and wires a best-effort `sendRegistrationAlert` into `intake.ts`'s two live Notion-write-succeeded paths (MHFA-REG-01, MHFA-GRP-01). Content is built from `generalPayload` only -- the same restricted-field-free data already used for `workflow_executions` logging, never the raw submission. Gated on its own flag (`EMAIL_ALERT_REG_ENABLED`), verified with a real test send before going live, then turned on in production 2026-08-11 per Tiána's confirmation the test email arrived.

---

## Manual actions needed (not blocking hub build, blocking specific integrations)

- **Wave Pro API credentials** — no connector available in this session. Needed for any real Wave integration (OAuth client ID/secret minimum).
- **Apollo.io API credentials** — no connector available in this session.
- **Notion database IDs** — the TRAIN OS™ page tree and MHFA Program Hub are visible and searchable, but individual database IDs for TRAIN-01/06/07/12/17/18/19 etc. still need to be individually confirmed and recorded in `NOTION_MAPPING.md` before the Notion integration package writes to them (governance: never invent database IDs).
