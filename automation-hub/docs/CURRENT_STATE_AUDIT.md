# WVW Automation Hub — Current State Audit

Date: 2026-08-03
Method: Direct inspection of 7 git repositories, live Netlify API (project/form records), live Supabase API (project list), live Notion workspace (TRAIN OS™), live Microsoft Graph (`get_me`). No credentials for Wave or Apollo were available in this session, so those sections are documentation-only.

---

## 1. Executive summary

WVW's MHFA automation is **not greenfield**. A substantial system already exists and is actively processing real learner data:

- 25+ live Netlify Forms across two production sites, receiving real submissions (as recent as 2026-08-02).
- A mature Notion "TRAIN OS™" workspace (MHFA Program Hub, Automation Registry, Form Registry, Exceptions Queue, Communications Center).
- Zapier was the CEO-designated sole automation orchestrator per a signed decision dated 2026-07-28. **On 2026-08-03, Tiána directed migrating MHFA off Zapier onto this hub**, superseding that decision (see ADR-001). This is a deliberate, approved change of direction — not something discovered and silently overridden.
- A live, only-partially-resolved data-integrity incident (MHFA-01A) affecting real production learner records, predating this migration and requiring separate containment regardless of which orchestrator runs going forward.
- Two paused Supabase projects and two overlapping, independently-built Next.js "platform" applications (`wvw-platform`, `wvw-master-intelligence`) that were never connected to each other or to the live MHFA system.
- The public marketing website's actual page source (the thing that renders the 25 live forms) is **not present in the `wvw-website` git repository** at HEAD — only docs and `netlify.toml` are tracked. The live site's true source is unverified.

---

## 2. Repository inventory

| Repo | Push access | What it actually is | Audit classification |
|---|---|---|---|
| `wvw-claude-buffer-studio` | yes | Standalone Threads/Bluesky/LinkedIn content generator + Buffer scheduler. Unrelated to the automation hub. | Verified and working (own domain) |
| `wvw-buffer-proxy` | read | Small Vercel/Netlify function proxy for Buffer GraphQL + image upload, backing the above. | Verified and working (own domain) |
| `wvw-website` | read | **Docs only.** `AGENTS.md`/`README.md` describe a single static `public/index.html`; `netlify.toml` has real MHFA redirect rules. But `public/` and all HTML are **absent from the repo at HEAD** on the only branch (`main`). The live site (wholisticvibeswellness.com, confirmed via Netlify API) has 25 real forms that cannot be located in this repo. | **Missing from repository — verify via platform records only** |
| `wvw-academy` | read | README stub only, no site code. Live Netlify site `wvw-academy` (wvwacademy.com) exists independently with 11 real forms. | **Missing from repository — verify via platform records only** |
| `wvw-dashboard` | read | Next.js app on Vercel + Netlify hybrid deploy, with scripts to pull GA4/LinkedIn/Meta/Twitter tokens. Social/marketing analytics dashboard, not the "executive automation health" dashboard this spec calls for. | Existing, different purpose than spec |
| `wvw-platform` | push | Substantial Next.js 15 PSA/ERP app ("WVW Intelligence"): Prisma + Postgres (Supabase/Neon), Clerk auth, Vercel Blob, `lib/ms365.ts` (Microsoft Graph), an n8n-based automation builder, audit/client/engagement/invoice modules. Most recent commit ("Integrate Zapier event triggering for job applications") shows it also has its own, separate, unrelated live Zapier usage for HR job applications — out of scope here, left untouched. Also vendors large unrelated third-party tool trees (`n8n-mcp/`, `browser-use/`, `everything-claude-code/`, `ui-ux-pro-max-skill/`) that bloat the repo. | Partially implemented; hosts this hub as an isolated subtree (see Decision 5) |
| `wvw-master-intelligence` | read | A second, independently-built unified OS ("WVW ONE"): Express + Prisma + Postgres (Railway), React/Vite frontend, Electron desktop app. Substantially overlaps `wvw-platform`'s domain model. | Designed/partially built, duplicates `wvw-platform` |

**Finding:** `wvw-platform` and `wvw-master-intelligence` are two separate, non-integrated attempts at a unified operating system. Neither is connected to the live MHFA Zapier/Notion/Netlify system. Reconciling them is still an open decision (Decision Register item 4) and out of scope for this hub build.

---

## 3. Live platform state (verified via API, not repo inspection)

### Netlify
- **wholisticvibeswellness.com** (site `04583215-c6f3-4e4f-b18d-26fdc4fada62`) — forms enabled, 25 forms live, several with submissions in the last 24 hours. See `FORM_REGISTRY.md` for the full list with fields.
- **wvw-academy** (site `37ce5afb-...`) — forms enabled, 11 forms live (separate/overlapping set).
- **wvw-command** (site `036a0a7f-...`) — forms not enabled, deployed, empty. Name matches the paused Supabase project `wvw-command-center` — likely a prior "hub" attempt that was started and shelved.
- **wvwlifedashboard** — forms not enabled.

### Supabase
- `wvw-command-center` — **INACTIVE/paused**.
- `WVW Dashboard` — **INACTIVE/paused**.
- (An unrelated third project, "Air and Aura," exists in the same org — out of scope, not touched.)
- No migrations, tables, or RLS policies could be inspected without resuming a paused project (a cost decision — see Decision Register item 6).

### Notion ("TRAIN OS™", under 🏫 WVW Academy)
- **MHFA Program Hub** — parent of 5 live databases plus a full MHFA-00 through MHFA-80 operating-system page tree.
- **MHFA Automation Registry** — 14 records (AUTO-01 through AUTO-14), all Platform = Zapier, all Status = "In progress," Tested = No, Monitoring Active = No.
- **CEO Executive Decisions | MHFA OS | 2026-07-28** — the decision this migration supersedes. Also documents the MHFA-01A incident, a hard deadline (MHFA-FUP-01 production-ready by 2026-10-09, ahead of a Wesley Shelter 90-day follow-up on 2026-10-23), and specific Notion database destinations for restricted data (TRAIN-19 complaints, TRAIN-14 accommodations, restricted M365 workbook `WVW_MHFA_Protected_Intake.xlsx`).
- **WVW OS™ Architecture Standard (Target)** — defines TRAIN-07 (immutable execution log) / TRAIN-18 (actionable exceptions) as the intended durable audit trail, and a strict test/publish gate. These record-keeping conventions are worth preserving even as the orchestrator changes — see ADR-001.

### Microsoft Graph / Outlook
- Live, authenticated connection confirmed: `hello@wholisticvibeswellness.com`, Tiána Lynn, CEO.

### Wave / Apollo
- No MCP connector for either service is available in this session. **Fully blocked pending credentials.**

---

## 4. Known live incident — MHFA-01A

- A Zap (MHFA-01A, public registration intake) created/updated 5 bad production records.
- The most recent evidence found (2026-07-30) shows 1 of the 5 still pending, with a data-matching gap (no Excel row, Zapier run ID, or source record identified).
- This predates and is independent of the migration decision — bad learner/registration data would carry into the new system if not resolved first. Flagged in the Risk Register; I have not attempted to fix or delete any Notion record (governance rule 16).

---

## 5. Gaps / cannot verify

- **Live website source code** — see repo inventory. Cannot confirm the new intake function will actually receive traffic from the real page templates without knowing where those templates live.
- **Wave** — no integration code found anywhere in the 7 repos; no credentials available.
- **Apollo** — no integration code found anywhere; no credentials available.
- **Supabase schema** — both candidate projects paused; nothing to inspect until one is resumed (approval pending).
- **Whether MHFA-01A reconciliation is now complete** — unconfirmed.
