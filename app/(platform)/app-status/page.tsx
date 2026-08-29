import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AppStatusClient, { type AppStatusData, type StatusItem, type CategoryScore } from "./AppStatusClient";

export const metadata: Metadata = { title: "App Status" };
export const revalidate = 60; // ISR: re-check every 60s

// ─── Env var checker ─────────────────────────────────────────────────────────

function envSet(key: string): boolean {
  const val = process.env[key];
  return !!val && val.trim() !== "";
}

// ─── Score + grade ────────────────────────────────────────────────────────────

function computeGrade(score: number): { grade: string; gradeColor: string } {
  if (score >= 93) return { grade: "A+", gradeColor: "text-green-400" };
  if (score >= 90) return { grade: "A",  gradeColor: "text-green-400" };
  if (score >= 87) return { grade: "A-", gradeColor: "text-green-400" };
  if (score >= 83) return { grade: "B+", gradeColor: "text-gold" };
  if (score >= 80) return { grade: "B",  gradeColor: "text-gold" };
  if (score >= 77) return { grade: "B-", gradeColor: "text-gold" };
  if (score >= 73) return { grade: "C+", gradeColor: "text-amber-400" };
  if (score >= 70) return { grade: "C",  gradeColor: "text-amber-400" };
  if (score >= 60) return { grade: "D",  gradeColor: "text-orange-400" };
  return { grade: "F", gradeColor: "text-red-400" };
}

// ─── Build checklist ──────────────────────────────────────────────────────────

function buildItems(): StatusItem[] {
  const netlify = process.env.NETLIFY === "true";
  const blob    = envSet("BLOB_READ_WRITE_TOKEN");
  const durableStorage = netlify || blob;
  const resend  = envSet("RESEND_API_KEY");
  const n8n     = envSet("N8N_API_KEY");
  const webhook = envSet("CLERK_WEBHOOK_SIGNING_SECRET");
  const openai  = envSet("OPENAI_API_KEY");
  const clerkPublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const clerkSecret = process.env.CLERK_SECRET_KEY ?? "";
  const clerkProduction = clerkPublishable.startsWith("pk_live_") && clerkSecret.startsWith("sk_live_");
  const db_url  = envSet("DATABASE_URL");
  const directUrl = envSet("DIRECT_URL");
  const encryption = envSet("ENCRYPTION_KEY");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const prodUrl = appUrl.startsWith("https://") && !appUrl.includes("localhost");

  return [
    // ── Features ──────────────────────────────────────────────────────────────
    { label: "Landing / marketing page",            done: true,  critical: false, category: "features" },
    { label: "Sign-in / sign-up (Clerk auth)",      done: true,  critical: false, category: "features" },
    { label: "Role-based dashboard (3 views)",      done: true,  critical: false, category: "features" },
    { label: "Clients — list & detail",             done: true,  critical: false, category: "features" },
    { label: "Clients — create & edit forms",        done: true,  critical: false, category: "features" },
    { label: "Audit Registry — list & detail",      done: true,  critical: false, category: "features" },
    { label: "Audit Catalog — list, create & edit", done: true,  critical: false, category: "features" },
    { label: "Audit Bundles",                       done: true,  critical: false, category: "features" },
    { label: "Question Bank",                       done: true,  critical: false, category: "features" },
    { label: "Evidence Vault (upload + capture)",   done: true,  critical: false, category: "features" },
    { label: "Audit Report generation",             done: true,  critical: false, category: "features" },
    { label: "New Audit Finding form",              done: true,  critical: false, category: "features" },
    { label: "Invoices — list, detail & new form",  done: true,  critical: false, category: "features" },
    { label: "Financials dashboard",                done: true,  critical: false, category: "features" },
    { label: "Sales Pipeline",                      done: true,  critical: false, category: "features" },
    { label: "Packages / Products",                 done: true,  critical: false, category: "features" },
    { label: "Grants discovery",                    done: true,  critical: false, category: "features" },
    { label: "Engagements — list, create & detail", done: true,  critical: false, category: "features" },
    { label: "Academy — courses, cohorts, creds",   done: true,  critical: false, category: "features" },
    { label: "Academy — course content builder",    done: true,  critical: false, category: "features" },
    { label: "Workforce / HRIS",                    done: true,  critical: false, category: "features" },
    { label: "PTO & Time Off management",           done: true,  critical: false, category: "features" },
    { label: "Staff onboarding workflows",          done: true,  critical: false, category: "features" },
    { label: "People / Staff roster & directory",   done: true,  critical: false, category: "features" },
    { label: "Jobs & Hiring board",                 done: true,  critical: false, category: "features" },
    { label: "KPIs & Analytics",                    done: true,  critical: false, category: "features" },
    { label: "Calendar",                            done: true,  critical: false, category: "features" },
    { label: "Messages / Inbox",                    done: true,  critical: false, category: "features" },
    { label: "Notifications center",               done: true,  critical: false, category: "features" },
    { label: "Community spaces",                    done: true,  critical: false, category: "features" },
    { label: "AI Command center",                   done: true,  critical: false, category: "features" },
    { label: "Automation builder (n8n)",            done: true,  critical: false, category: "features" },
    { label: "Executive dashboard",                 done: true,  critical: false, category: "features" },
    { label: "Reports",                             done: true,  critical: false, category: "features" },
    { label: "Service Library",                     done: true,  critical: false, category: "features" },
    { label: "Client Portal (token-based)",         done: true,  critical: false, category: "features" },
    { label: "Survey / Assessment system",          done: true,  critical: false, category: "features" },

    // ── Settings ─────────────────────────────────────────────────────────────
    { label: "Settings — Organization profile",    done: true,  critical: false, category: "features" },
    { label: "Settings — Team & invites",          done: true,  critical: false, category: "features" },
    { label: "Settings — Security",               done: true,  critical: false, category: "features" },
    { label: "Settings — Integrations",           done: true,  critical: false, category: "features" },

    // ── Infrastructure ────────────────────────────────────────────────────────
    { label: "PostgreSQL database (Neon)",          done: db_url && directUrl, critical: true, category: "infrastructure" },
    { label: "Production authentication (Clerk)",   done: clerkProduction, critical: true, category: "infrastructure", note: "Production requires matching pk_live_ and sk_live_ Clerk keys" },
    { label: "AI API (OpenAI)",                     done: openai,    critical: true,  category: "infrastructure" },
    { label: "Durable Evidence Vault storage",      done: durableStorage, critical: true, category: "infrastructure", note: "Netlify Blobs is automatic on Netlify; other hosts require BLOB_READ_WRITE_TOKEN" },
    { label: "Email service (Resend API key)",      done: resend,    critical: true,  category: "infrastructure", note: "Add RESEND_API_KEY — required for invites, notifications" },
    { label: "Clerk webhook signing secret",        done: webhook,   critical: true,  category: "infrastructure", note: "Add CLERK_WEBHOOK_SIGNING_SECRET from the Clerk webhook endpoint" },
    { label: "Invitation token encryption",         done: encryption, critical: true, category: "infrastructure", note: "ENCRYPTION_KEY signs secure participant invitation tokens" },
    { label: "Workflow automation (n8n API key)",   done: n8n,       critical: false, category: "infrastructure", note: "n8n is optional; add N8N_API_KEY when ready" },
    { label: "Netlify production project connected",done: netlify,   critical: true,  category: "infrastructure" },

    // ── Legal / Compliance ────────────────────────────────────────────────────
    { label: "Privacy Policy page (/privacy)",     done: true,  critical: false, category: "legal" },
    { label: "Terms of Service page (/terms)",    done: true,  critical: false, category: "legal" },
    { label: "Footer legal links",                done: true,  critical: false, category: "legal" },
    { label: "Cookie / GDPR consent banner",      done: true,  critical: false, category: "legal" },

    // ── Code Quality ──────────────────────────────────────────────────────────
    { label: "TypeScript strict mode clean",       done: true,  critical: false, category: "quality" },
    { label: "Design system consistent (navy/gold)",done: true,  critical: false, category: "quality" },
    { label: "Role-based access control",          done: true,  critical: false, category: "quality" },
    { label: "API response helpers standardized",  done: true,  critical: false, category: "quality" },
    { label: "Database schema normalized",         done: true,  critical: false, category: "quality" },
    { label: "Activity logging wired",             done: true,  critical: false, category: "quality" },
    { label: "Error boundary (error.tsx)",         done: true,  critical: false, category: "quality" },
    { label: "Loading states (loading.tsx)",       done: true,  critical: false, category: "quality" },

    // ── Production readiness ──────────────────────────────────────────────────
    { label: "Production URL configured",          done: prodUrl, critical: true, category: "production", note: "Set NEXT_PUBLIC_APP_URL to the HTTPS production origin" },
    { label: "Critical Netlify environment set",   done: db_url && directUrl && resend && openai && webhook && encryption && clerkProduction, critical: true, category: "production", note: "Production auth, webhook, database, email, AI, and encryption must all pass" },
    { label: "Custom domain",                      done: false, critical: false, category: "production", note: "Connect the final WVW Intelligence production domain in Netlify when selected" },
    { label: "Error monitoring (Sentry or equiv)", done: false, critical: false, category: "production", note: "Recommended before public launch" },
    { label: "Mac desktop app (.app) working",     done: true,  critical: false, category: "production" },
    { label: "Org onboarding / welcome flow",      done: true,  critical: false, category: "production" },
  ];
}

// ─── Category aggregation ─────────────────────────────────────────────────────

function buildCategories(items: StatusItem[]): CategoryScore[] {
  const cats = [
    { key: "features",       name: "Core Features",       weight: 40, color: "text-blue-400" },
    { key: "infrastructure", name: "Infrastructure",      weight: 20, color: "text-purple-400" },
    { key: "legal",          name: "Legal & Compliance",  weight: 15, color: "text-amber-400" },
    { key: "quality",        name: "Code Quality",        weight: 15, color: "text-green-400" },
    { key: "production",     name: "Production Readiness",weight: 10, color: "text-gold" },
  ] as const;

  return cats.map(({ key, name, weight, color }) => {
    const subset = items.filter((i) => i.category === key);
    return {
      name, weight, color,
      done:  subset.filter((i) => i.done).length,
      total: subset.length,
      icon:  key,
    };
  });
}

function computeOverallScore(categories: CategoryScore[]): number {
  const raw = categories.reduce((sum, cat) => {
    const pct = cat.total > 0 ? cat.done / cat.total : 0;
    return sum + pct * cat.weight;
  }, 0);
  return Math.round(raw);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AppStatusPage() {
  const user = await requireUser();
  if (!["SUPER_ADMIN", "ADMIN", "PARTNER"].includes(user.role)) {
    redirect("/dashboard");
  }

  // Live DB stats
  const [clients, audits, users, orgs] = await Promise.all([
    db.client.count({ where: { orgId: user.orgId, isActive: true, deletedAt: null } }),
    db.audit.count({ where: { orgId: user.orgId } }),
    db.user.count({ where: { orgId: user.orgId } }),
    db.organization.count(),
  ]);

  const items      = buildItems();
  const categories = buildCategories(items);
  const score      = computeOverallScore(categories);
  const { grade, gradeColor } = computeGrade(score);

  // Days to launch: rough estimate based on remaining work
  const blocking    = items.filter((i) => !i.done && i.critical).length;
  const nonBlocking = items.filter((i) => !i.done && !i.critical).length;
  const daysToLaunch = Math.max(7, blocking * 1.5 + nonBlocking * 0.4);

  const data: AppStatusData = {
    items,
    categories,
    overallScore: score,
    grade,
    gradeColor,
    dbStats: { clients, audits, users, orgs },
    lastChecked: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    daysToLaunch: Math.round(daysToLaunch),
  };

  return <AppStatusClient data={data} />;
}
