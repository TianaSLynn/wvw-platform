# Decision Register

## Decision 1 — Zapier vs. the hub — RESOLVED 2026-08-03

**Resolution:** Migrate MHFA off Zapier onto the hub, via a phased, per-path cutover (ADR-001). Zapier stays live and authoritative for every path not yet individually cut over and approved.

---

## Decision 2 — MHFA-01A incident status — OPEN

The Executive Decisions doc says do not reactivate MHFA-01A until 5 bad production records are reconciled. The most recent evidence found (2026-07-30) shows 1 of those still unresolved, with a data-matching gap. Is this now closed? This should be resolved (or explicitly deferred by you) before MHFA-REG-01's replacement goes live, so bad data isn't inherited into the new system.

---

## Decision 3 — Where does the live website source code actually live? — OPEN

`wvw-website` and `wvw-academy` git repos contain no page source — only docs/config — yet 25 + 11 real forms exist live. Is there a repo I haven't been given access to, or are these sites maintained outside git? Until resolved, the hub only reads form *schemas* via the Netlify API; it does not edit site templates.

---

## Decision 4 — Canonical platform: `wvw-platform` vs. `wvw-master-intelligence` — OPEN, not blocking this work

Two independently-built "unified operating system" apps exist with overlapping domain models. This doesn't block the automation hub (which is scoped narrowly to intake/routing/integrations, not client/audit/engagement management) but should be resolved separately.

---

## Decision 5 — Repo location — PROVISIONALLY RESOLVED

Used `wvw-platform/automation-hub/` as an isolated, extractable subtree (ADR-002) since repo creation is blocked by GitHub App permissions and no existing dedicated repo was found. Open to moving if you'd rather create a fresh repo for me to attach.

---

## Decision 6 — Resuming paused Supabase projects — OPEN

`wvw-command-center` and `WVW Dashboard` are both paused; resuming either may affect billing. Schema migrations are drafted (`supabase/migrations/`) but **not applied** pending this approval. Which project (or a new one) should the hub use?

---

## Manual actions needed (not blocking hub build, blocking specific integrations)

- **Wave Pro API credentials** — no connector available in this session. Needed for any real Wave integration (OAuth client ID/secret minimum).
- **Apollo.io API credentials** — no connector available in this session.
- **Notion database IDs** — the TRAIN OS™ page tree and MHFA Program Hub are visible and searchable, but individual database IDs for TRAIN-01/06/07/12/17/18/19 etc. still need to be individually confirmed and recorded in `NOTION_MAPPING.md` before the Notion integration package writes to them (governance: never invent database IDs).
