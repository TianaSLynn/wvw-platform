# WVW Intelligence Platform — Claude Code Guidelines

## Project Overview
WVW Intelligence is a Next.js 15 PSA/ERP/Audit management platform for WVW Consulting. It manages clients, engagements, audits, findings, evidence, invoices, team, and reporting.

**Tech Stack:**
- Next.js 15 App Router + React Server Components
- TypeScript (strict)
- Prisma ORM + PostgreSQL (Supabase/Neon)
- Tailwind CSS + shadcn/ui components
- Clerk authentication
- Vercel Blob (file storage)
- Recharts (charts)
- n8n (workflow automation)

## Critical Schema Facts
These trip up AI assistants — always verify before writing Prisma queries:

- `Audit` has **NO** `deletedAt` field — never filter by it
- `ActivityLog` uses `timestamp` not `createdAt` — use `timestamp` everywhere
- `findingNumber` is `String?` not `Int` — treat as nullable string
- `UserRole` enum values: `SUPER_ADMIN | ADMIN | PARTNER | MANAGER | CONSULTANT | AUDITOR | CLIENT_ADMIN | CLIENT_USER`
- `IntegrationStatus` enum: `ACTIVE | INACTIVE | ERROR | PENDING` — no `DISABLED`
- `Invoice` has `paidAmt()` helper function — no direct `paidAmount` field
- Prisma JSON fields (`config`, `settings`) require `Prisma.InputJsonValue` cast

## Design System
The app uses a navy/gold brand palette with Emil Kowalski animation principles.

**CSS classes to use:**
- `section-card` — card container with border and shadow
- `section-card-header` — card header with bottom border
- `stat-card` — KPI metric card with hover lift
- `data-table` — styled table with proper header/row styles
- `btn-primary` — navy bg button
- `btn-gold` — gold bg button  
- `btn-ghost` — ghost/subtle button
- `input-base` — standard form input
- `empty-state` — centered empty state container
- `empty-state-icon` — icon container for empty states
- `badge` — pill badge
- `status-pill` — status badge with dot indicator
- `stagger-children` — parent that staggers child fade-in animations
- `animate-fade-in` — single element fade in
- `animate-fade-in-scale` — fade in with slight scale (page entry)
- `gradient-text-gold` — gold gradient text for hero numbers

**Animation rules:**
- Always wrap with `@media (prefers-reduced-motion)` check
- Use `var(--ease-out)` for most transitions: `cubic-bezier(0.23, 1, 0.32, 1)`
- Button press: `scale(0.97)` — already wired globally, no extra code needed
- Stagger: use `.stagger-children` on grid containers

**Colors:**
- `navy-900` = `#0F1C3F` (sidebar background)
- `gold` / `gold-500` = `#C9A84C` (brand accent)
- `sage` = `#6B8F71` (secondary accent)

## File Structure
```
app/
  (platform)/          # Authenticated platform routes
    dashboard/
    clients/
    audits/
    evidence/
    ...
  (portal)/            # Client portal (token-based, no auth)
  api/                 # API route handlers
components/
  layout/              # AppShell, Sidebar, TopBar
  ui/                  # Shared UI: StatCard, PageHeader, Badge, etc.
lib/
  auth.ts              # getCurrentUser(), requireUser()
  db.ts                # Prisma client singleton
  api-response.ts      # ok(), badRequest(), unauthorized(), serverError()
  utils.ts             # cn(), formatCurrency(), formatDate()
```

## Common Patterns

### API Routes
```ts
import { ok, unauthorized, serverError, badRequest } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  // ...
  return ok(data);
}
```

### Server Components with Auth
```ts
export default async function Page() {
  const user = await requireUser(); // throws redirect if not authenticated
  // user.orgId is always set
}
```

### Page Layout Pattern
```tsx
<div className="max-w-7xl mx-auto space-y-6">
  <PageHeader title="..." subtitle="..." icon={Icon} iconColor="text-gold" iconBg="bg-gold/10 border-gold/20" actions={...} />
  <section className="stagger-children grid grid-cols-1 md:grid-cols-3 gap-4">
    <StatCard ... />
  </section>
  <div className="section-card">
    <div className="section-card-header">...</div>
    <table className="data-table">...</table>
  </div>
</div>
```

## n8n Integration
- API routes: `GET /api/automations/n8n` (list workflows), `POST /api/automations/n8n/trigger`
- UI: `/automation` page with `AutomationBuilder.tsx` client component
- Env vars: `N8N_API_URL`, `N8N_API_KEY`, `NEXT_PUBLIC_N8N_URL`

## Automation
The platform has a full automation builder at `/automation`. It supports:
- Rule-based triggers (audit completed, finding opened, invoice overdue, etc.)
- Conditions (always, weekend-only, business-hours, etc.)
- Actions including n8n workflow triggers and webhook calls

## Do NOT
- Add `deletedAt: null` to `Audit` queries (field doesn't exist)
- Use `createdAt` on `ActivityLog` (use `timestamp`)
- Use `IntegrationStatus.DISABLED` (use `INACTIVE`)
- Mock tests that should hit real DB
- Add speculative features not requested
- Create files unless necessary
- Use `title` prop on Lucide icons (use `aria-label`)
