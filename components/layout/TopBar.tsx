"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { dark } from "@clerk/themes";

const UserButton = dynamic(
  () => import("@clerk/nextjs").then((m) => m.UserButton),
  { ssr: false, loading: () => <div className="w-7 h-7 rounded-full bg-muted animate-pulse" /> }
);
import { Menu, Search, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@prisma/client";
import Link from "next/link";

interface TopBarProps {
  user: User;
  onMenuClick: () => void;
  unreadCount?: number;
}

// Map path segments to readable page titles
function usePageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return "Dashboard";

  const map: Record<string, string> = {
    dashboard: "Dashboard",
    clients: "Clients",
    engagements: "Engagements",
    audits: "Audit Registry",
    "audit-catalog": "Audit Catalog",
    benchmarks: "Benchmarks",
    kpis: "KPI Library",
    policies: "Policies",
    evidence: "Evidence Vault",
    recommendations: "Recommendations",
    reports: "Reports",
    admin: "Admin",
    financials: "Financial Intelligence",
    invoices: "Invoices & Payments",
    boards: "Boards Monitor",
    pathways: "Pathway Engine",
    implementation: "Implementation Center",
    sync: "Sync Status",
    "burnout-tracker": "Burnout Tracker",
    "decision-engine": "Decision Engine",
    "external-signals": "External Signals",
    "intersectional-risk": "Intersectional Risk",
    meetings: "Meeting Center",
    team: "WVW Team",
    interviews: "Interview Center",
    "service-library": "Service Library",
    assets: "Asset Registry",
    executive: "Executive Dashboard",
    pipeline: "Sales Pipeline",
    "ai-command": "AI Command Center",
    "ai-engines": "AI Engine Hub",
    calendar: "Calendar",
    operations: "Operations",
    people: "People & Culture",
    academy: "WVW Academy",
    governance: "Governance",
    quality: "Quality & Growth",
    employee: "Employee Experience",
    addons: "Add-On Packs",
  };

  const first = segments[0] ?? "";
  const second = segments[1] ?? "";

  if (first === "employee" && second) {
    const sub: Record<string, string> = {
      "wellness-coach": "Wellness Coach",
      "onboarding-hub": "Onboarding Hub",
      benefits: "Benefits & Wellness",
      store: "Swag Store",
      "psych-safety": "Psych Safety",
      "manager-health": "Manager Health",
      "burnout-prevention": "Burnout Prevention",
      "work-week": "Work Week Planner",
      recognition: "Recognition Tracker",
      "culture-scanner": "Culture Scanner",
    };
    return sub[second] ?? "Employee Experience";
  }

  return map[first] ?? segments.map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).join(" › ");
}

const PAGE_ACTIONS: Record<string, { label: string; href: string }> = {
  "/clients":     { label: "New Client",      href: "/clients/new" },
  "/audits":      { label: "New Audit",       href: "/audits/new" },
  "/engagements": { label: "New Engagement",  href: "/engagements/new" },
  "/invoices":    { label: "New Invoice",     href: "/invoices/new" },
  "/people/time": { label: "Log Time",        href: "/people/time" },
};

export default function TopBar({ user, onMenuClick, unreadCount = 0 }: TopBarProps) {
  const pathname = usePathname();
  const title = usePageTitle(pathname);
  const action = PAGE_ACTIONS[pathname];

  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-20 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Global search trigger */}
        <button
          className={cn(
            "flex items-center gap-2 px-3 h-8 rounded-lg text-xs text-muted-foreground",
            "bg-muted hover:bg-muted/80 transition-colors border border-border",
            "hidden sm:flex"
          )}
          aria-label="Search"
        >
          <Search size={13} />
          <span>Search…</span>
          <kbd className="ml-2 text-[10px] px-1 py-0.5 rounded bg-background border border-border font-mono">⌘K</kbd>
        </button>

        {/* Mobile search */}
        <button
          className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Search"
        >
          <Search size={16} />
        </button>

        {/* Quick create */}
        {action && (
          <Link
            href={action.href}
            className={cn(
              "hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium",
              "bg-navy-900 text-white hover:bg-navy-800 transition-colors"
            )}
          >
            <Plus size={13} />
            {action.label}
          </Link>
        )}

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            unreadCount > 9
              ? <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-gold text-navy-900 text-[9px] font-bold flex items-center justify-center leading-none" aria-hidden>9+</span>
              : <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold animate-pulse-gold" aria-hidden />
          )}
        </Link>

        {/* User button (Clerk) */}
        <UserButton
          appearance={{
            baseTheme: dark,
            elements: {
              avatarBox: "w-7 h-7",
            },
          }}
          afterSignOutUrl="/sign-in"
        />
      </div>
    </header>
  );
}
