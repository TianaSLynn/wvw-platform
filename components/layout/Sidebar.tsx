"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User, Organization } from "@prisma/client";
import {
  LayoutDashboard, Users, Briefcase, ClipboardList, BarChart2, Target,
  Shield, Lightbulb, FolderOpen, FileText, Settings, DollarSign,
  BookOpen, Zap, RefreshCw, X, Flame, Radio, Layers, CalendarDays,
  Mic, Archive, TrendingUp, Star, Receipt, Heart, Sparkles, CheckSquare,
  Repeat2, GraduationCap, FileEdit, ListOrdered, Award, Scale, Activity,
  Clock, Brain, Calendar, Wrench, Gift, MessageSquare,
  Cpu, UserCircle, Library, Bell,
  MessageCircle, Building2, Hash, Megaphone, Trophy,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type UserWithOrg = User & { org: Pick<Organization, "name" | "logoUrl"> };

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Intelligence",
    items: [
      { to: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
      { to: "/ai-command",   icon: Brain,            label: "AI Command Center" },
      { to: "/ai-engines",   icon: Cpu,              label: "AI Engine Hub" },
      { to: "/calendar",     icon: Calendar,         label: "Calendar" },
      { to: "/clients",      icon: Users,            label: "Clients" },
      { to: "/operations",   icon: Wrench,           label: "Operations" },
      { to: "/engagements",  icon: Briefcase,        label: "Engagements" },
    ],
  },
  {
    title: "Audits & Packages",
    items: [
      { to: "/audits",        icon: ClipboardList, label: "Audit Registry" },
      { to: "/audit-catalog", icon: BookOpen,      label: "Audit Catalog" },
      { to: "/packages",      icon: Layers,        label: "Package Catalog", badge: "NEW" },
      { to: "/pathways",      icon: Zap,           label: "Pathway Engine" },
    ],
  },
  {
    title: "WVW Academy",
    items: [
      { to: "/academy",             icon: GraduationCap, label: "Academy Home" },
      { to: "/academy/courses",     icon: BookOpen,      label: "Courses" },
      { to: "/academy/students",    icon: Users,         label: "Students" },
      { to: "/academy/cohorts",     icon: Hash,          label: "Cohorts" },
      { to: "/academy/practicum",   icon: Briefcase,     label: "Practicum" },
      { to: "/academy/credentials", icon: Award,         label: "Credentials" },
    ],
  },
  {
    title: "Analysis",
    items: [
      { to: "/benchmarks",      icon: BarChart2,  label: "Benchmarks" },
      { to: "/kpis",            icon: Target,     label: "KPI Library" },
      { to: "/external-signals",icon: Radio,      label: "External Signals" },
      { to: "/policies",        icon: Shield,     label: "Policies" },
      { to: "/recommendations", icon: Lightbulb,  label: "Recommendations" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { to: "/evidence", icon: FolderOpen, label: "Evidence Vault" },
      { to: "/reports",  icon: FileText,   label: "Reports" },
    ],
  },
  {
    title: "Financial",
    items: [
      { to: "/financials", icon: DollarSign, label: "Financial Intelligence" },
      { to: "/invoices",   icon: Receipt,    label: "Invoices & Payments" },
      { to: "/grants",     icon: Trophy,     label: "Grant Tracker" },
    ],
  },
  {
    title: "Executive",
    items: [
      { to: "/executive", icon: Star,       label: "Executive Dashboard" },
      { to: "/pipeline",  icon: TrendingUp, label: "Sales Pipeline" },
    ],
  },
  {
    title: "Operations",
    items: [
      { to: "/meetings", icon: CalendarDays,  label: "Meeting Center" },
      { to: "/messages", icon: MessageSquare, label: "Messages" },
      { to: "/team",     icon: UserCircle,    label: "WVW Team" },
    ],
  },
  {
    title: "Libraries",
    items: [
      { to: "/service-library", icon: Library, label: "Service Library" },
      { to: "/assets",          icon: Archive, label: "Asset Registry" },
    ],
  },
  {
    title: "Risk Intelligence",
    items: [
      { to: "/burnout-tracker",     icon: Flame,  label: "Burnout Tracker" },
      { to: "/decision-engine",     icon: Shield, label: "Decision Engine" },
      { to: "/intersectional-risk", icon: Layers, label: "Intersectional Risk" },
    ],
  },
  {
    title: "Employee Experience",
    items: [
      { to: "/employee/wellness-coach",     icon: Sparkles,      label: "Wellness Coach" },
      { to: "/employee/onboarding-hub",     icon: Gift,          label: "Onboarding Hub" },
      { to: "/employee/benefits",           icon: Heart,         label: "Benefits & Wellness" },
      { to: "/employee/psych-safety",       icon: Shield,        label: "Psych Safety" },
      { to: "/employee/manager-health",     icon: Users,         label: "Manager Health" },
      { to: "/employee/burnout-prevention", icon: Flame,         label: "Burnout Prevention" },
      { to: "/employee/recognition",        icon: Star,          label: "Recognition" },
      { to: "/employee/culture-scanner",    icon: MessageSquare, label: "Culture Scanner" },
    ],
  },
  {
    title: "People & Culture",
    items: [
      { to: "/people",             icon: Users,       label: "People Home" },
      { to: "/people/staff",       icon: Users,       label: "Staff Directory" },
      { to: "/people/performance", icon: Award,       label: "Performance" },
      { to: "/people/goals",       icon: Target,      label: "Goals & OKRs" },
      { to: "/people/time",        icon: Clock,       label: "Time Tracking" },
      { to: "/people/capacity",    icon: Activity,    label: "Capacity" },
      { to: "/people/onboarding",  icon: CheckSquare, label: "Onboarding" },
    ],
  },
  {
    title: "Workforce (HRIS)",
    items: [
      { to: "/workforce",            icon: Building2,   label: "Employee Directory" },
      { to: "/workforce/training",   icon: BookOpen,    label: "Training Records" },
      { to: "/workforce/policies",   icon: Shield,      label: "Policy Acknowledgements" },
      { to: "/workforce/onboarding", icon: CheckSquare, label: "Onboarding Workflows" },
    ],
  },
  {
    title: "Talent & Hiring",
    items: [
      { to: "/jobs",       icon: Megaphone, label: "Job Board" },
      { to: "/interviews", icon: Mic,       label: "Interviews" },
    ],
  },
  {
    title: "Community",
    items: [
      { to: "/community",               icon: MessageCircle, label: "Community Spaces" },
      { to: "/community/announcements", icon: Hash,          label: "Announcements" },
      { to: "/community/cohorts",       icon: Users,         label: "Cohorts" },
      { to: "/community/resources",     icon: FolderOpen,    label: "Resources" },
    ],
  },
  {
    title: "Governance",
    items: [
      { to: "/governance",          icon: Scale,        label: "Governance Home" },
      { to: "/governance/board",    icon: Scale,        label: "Board Members" },
      { to: "/governance/meetings", icon: CalendarDays, label: "Board Meetings" },
    ],
  },
  {
    title: "Quality & Growth",
    items: [
      { to: "/quality",               icon: Star,        label: "Quality Home" },
      { to: "/quality/surveys",       icon: CheckSquare, label: "Satisfaction Surveys" },
      { to: "/quality/qbr",           icon: BarChart2,   label: "QBR Reports" },
      { to: "/quality/impact",        icon: TrendingUp,  label: "Impact & ROI" },
      { to: "/quality/change-orders", icon: FileEdit,    label: "Change Orders" },
      { to: "/quality/waitlist",      icon: ListOrdered, label: "Waitlist" },
    ],
  },
  {
    title: "Add-On Packs",
    items: [
      { to: "/addons/client-experience",     icon: Heart,       label: "Client Experience" },
      { to: "/addons/lead-pipeline",         icon: Sparkles,    label: "Lead & Discovery" },
      { to: "/addons/readiness",             icon: CheckSquare, label: "Readiness Engine" },
      { to: "/addons/implementation-engine", icon: Layers,      label: "Strategy & Impl." },
      { to: "/addons/retainers",             icon: Repeat2,     label: "Retainer & Expansion" },
      { to: "/addons/executive-delivery",    icon: Star,        label: "Executive Delivery" },
    ],
  },
  {
    title: "System",
    items: [
      { to: "/notifications", icon: Bell,      label: "Notifications" },
      { to: "/settings",      icon: Settings,  label: "Settings" },
      { to: "/admin",         icon: Settings,  label: "Admin" },
      { to: "/sync",          icon: RefreshCw, label: "Sync Status" },
    ],
  },
];

interface SidebarProps {
  user: UserWithOrg;
  mobileOpen?: boolean;
  onClose?: () => void;
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    item.to === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.to);
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.to}
        className={cn("sidebar-link", isActive ? "sidebar-link-active" : "sidebar-link-inactive")}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon size={14} className={cn("flex-shrink-0 transition-transform duration-150", isActive && "scale-110")} aria-hidden />
        <span className="truncate flex-1">{item.label}</span>
        {item.badge && (
          <span className="text-[10px] font-bold bg-gold/20 text-gold px-1.5 py-0.5 rounded-full leading-none">
            {item.badge}
          </span>
        )}
        {isActive && (
          <span className="w-1 h-1 rounded-full bg-gold/60 flex-shrink-0 animate-pulse-gold" aria-hidden />
        )}
      </Link>
    </li>
  );
}

export default function Sidebar({ user, mobileOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-navy-900 flex flex-col shadow-nav z-40",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.org.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.org.logoUrl} alt="Logo" className="w-9 h-9 object-contain rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-navy-700 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-bold text-sm">W</span>
                </div>
              )}
              <div className="min-w-0">
                <div className="text-white font-bold text-sm leading-tight truncate">
                  WVW Intelligence
                </div>
                <div className="text-white/35 text-[11px] leading-tight">
                  Master Diagnostic System
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav>
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="mb-4">
                <p className="px-3 mb-1 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink key={item.to} item={item} />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User footer */}
        <div className="px-4 py-3 border-t border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <span className="text-gold text-xs font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/70 text-xs font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-white/30 text-[10px] truncate capitalize">
                {user.role.toLowerCase().replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="px-5 py-2 border-t border-white/5">
          <p className="text-white/20 text-[10px]">v2.0.0 — Wholistic Vibes Wellness</p>
        </div>
      </aside>
    </>
  );
}
