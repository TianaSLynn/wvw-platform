# WVW Automation Hub

Proprietary automation and executive-intelligence infrastructure connecting the WVW website, WVW Academy, Supabase, Notion, Microsoft Graph/Outlook, Wave Pro, Apollo.io, and the WVW Executive Dashboard (PAM).

**Location note:** this lives as a subtree inside `wvw-platform` because no dedicated repository could be created for it (the GitHub App backing this session does not have repo-creation permission — see `docs/CREDENTIALS_AND_MANUAL_ACTIONS.md`). It is deliberately self-contained (its own `package.json`, `netlify/`, `supabase/`) so it can be split into its own repository later via `git subtree split` without disruption. It does not share code, dependencies, or routes with the rest of `wvw-platform`.

## Status

This is an early, actively-developed slice of the full spec, not a finished system. See `docs/IMPLEMENTATION_REGISTER.md` for what's built vs. designed vs. missing, and `docs/DECISION_REGISTER.md` for what's still waiting on Tiána.

**Nothing in this directory is connected to production.** No Supabase project is active (both candidates are paused), no Netlify function here is deployed, and no automation described here has been activated. Everything defaults to inactive per governance rule 30.

## Key decision already made

Per Tiána's direction on 2026-08-03, MHFA automation is being migrated off Zapier onto this hub (Netlify Functions + Supabase Edge Functions), superseding the 2026-07-28 CEO decision that had fixed Zapier as the sole orchestrator. This is being planned as a **phased cutover**, not a rip-and-replace — the live Zapier automations (AUTO-01–14) keep running real learner traffic until each replacement path is built, tested, and explicitly approved to go live. See `docs/ARCHITECTURE_DECISIONS.md` ADR-001.

## Structure

```
automation-hub/
  docs/            governance, audit, and registry documents
  supabase/
    migrations/    schema (NOT yet applied to any project)
  packages/
    shared-types/  correlation ID + shared TS types
    validation/    zod schemas matching the real live Netlify form fields
  netlify/
    functions/     intake gateway
  tests/
```
