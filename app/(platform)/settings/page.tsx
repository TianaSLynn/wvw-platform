import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Building2, Users, Zap, Bell, Shield, ChevronRight, Puzzle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ENV_CHECKS = [
  { key: "CLERK_WEBHOOK_SECRET",  label: "Clerk Webhook Secret",  desc: "Required for user sync on sign-up. Get it from Clerk Dashboard → Webhooks.",          href: "https://dashboard.clerk.com", critical: true  },
  { key: "BLOB_READ_WRITE_TOKEN", label: "Vercel Blob Token",     desc: "Required for file uploads in Evidence Vault. Get it from Vercel Dashboard → Storage.", href: "https://vercel.com/dashboard",  critical: true  },
  { key: "RESEND_API_KEY",        label: "Resend API Key",        desc: "Required for email notifications. Get it from resend.com/api-keys.",                    href: "https://resend.com/api-keys",   critical: false },
  { key: "N8N_API_KEY",           label: "n8n API Key",           desc: "Required for automation triggers. Get it from your n8n instance → Settings → API.",    href: "#",                             critical: false },
];

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

  const [org, memberCount, integrationCount] = await Promise.all([
    db.organization.findUnique({ where: { id: user.orgId }, select: { name: true, industry: true, timezone: true, currency: true } }),
    db.user.count({ where: { orgId: user.orgId, deletedAt: null } }),
    db.integration.count({ where: { orgId: user.orgId } }),
  ]);

  const sections = [
    {
      title: "Organization",
      description: "Name, branding, timezone, currency, and fiscal year",
      href: "/settings/organization",
      icon: Building2,
      meta: org?.name,
      adminOnly: true,
    },
    {
      title: "Team Members",
      description: "Manage roles and access for your team",
      href: "/settings/team",
      icon: Users,
      meta: `${memberCount} members`,
      adminOnly: false,
    },
    {
      title: "Integrations",
      description: "Connect QuickBooks, Google Workspace, Microsoft 365, and more",
      href: "/settings/integrations",
      icon: Puzzle,
      meta: `${integrationCount} connected`,
      adminOnly: true,
    },
    {
      title: "Notifications",
      description: "Configure email alerts, digest frequency, and in-app notifications",
      href: "/settings/notifications",
      icon: Bell,
      meta: null,
      adminOnly: false,
    },
    {
      title: "Automation",
      description: "Workflow rules, triggers, and automated actions",
      href: "/automation",
      icon: Zap,
      meta: null,
      adminOnly: true,
    },
    {
      title: "Security & Compliance",
      description: "API keys, session management, and audit log access",
      href: "/settings/security",
      icon: Shield,
      meta: null,
      adminOnly: true,
    },
  ];

  const missingEnv = isAdmin ? ENV_CHECKS.filter((e) => !process.env[e.key]) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your organization, team, and platform preferences</p>
      </div>

      {/* Setup checklist for admins */}
      {missingEnv.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-sm font-semibold text-amber-600">{missingEnv.length} setup {missingEnv.length === 1 ? "item" : "items"} remaining</p>
          </div>
          <div className="space-y-2">
            {ENV_CHECKS.map((e) => {
              const missing = !process.env[e.key];
              return (
                <div key={e.key} className="flex items-start gap-2.5 text-xs">
                  {missing
                    ? <AlertTriangle size={11} className={cn("mt-0.5 flex-shrink-0", e.critical ? "text-red-500" : "text-amber-500")} />
                    : <CheckCircle2 size={11} className="mt-0.5 flex-shrink-0 text-green-500" />}
                  <div>
                    <span className={cn("font-medium", missing ? "text-foreground" : "text-muted-foreground line-through")}>{e.label}</span>
                    {missing && <p className="text-muted-foreground mt-0.5">{e.desc}{" "}
                      {e.href !== "#" && <a href={e.href} target="_blank" rel="noopener noreferrer" className="text-gold underline">Open →</a>}
                    </p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {missingEnv.length === 0 && isAdmin && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
          <CheckCircle2 size={13} /> All environment variables configured — platform fully operational.
        </div>
      )}

      <div className="space-y-2">
        {sections.map(({ title, description, href, icon: Icon, meta, adminOnly }) => {
          const locked = adminOnly && !isAdmin;
          return (
            <div key={href} className={cn(locked && "opacity-50")}>
              {locked ? (
                <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Admin only</span>
                </div>
              ) : (
                <Link
                  href={href}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-gold/20 hover:bg-muted/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900/10 to-navy-700/10 border border-border flex items-center justify-center flex-shrink-0 group-hover:border-gold/20 transition-colors">
                    <Icon size={18} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
                    <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Current user info */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Your Account</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-navy-900 border border-gold/20 flex items-center justify-center">
            <span className="text-xs font-bold text-gold">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-muted-foreground">{user.email} · {user.role.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
