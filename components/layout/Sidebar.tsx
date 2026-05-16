"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User, Organization } from "@prisma/client";
import {
  LayoutDashboard, Users, ClipboardList, BookOpen,
  DollarSign, Settings, Briefcase, FolderOpen, FileText,
  GraduationCap, Award, TrendingUp, Receipt, BarChart2,
  Building2, MessageCircle, Calendar, Brain, Star,
  Scale, X, Bell, Shield, Target, Library, Layers, Mail, Umbrella,
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
    title: "Home",
    items: [
      { to: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
      { to: "/calendar",   icon: Calendar,        label: "Calendar" },
      { to: "/ai-command", icon: Brain,            label: "AI Command" },
    ],
  },
  {
    title: "Clients & Audits",
    items: [
      { to: "/clients",        icon: Users,         label: "Clients" },
      { to: "/audits",         icon: ClipboardList, label: "Audit Registry" },
      { to: "/audit-catalog",  icon: BookOpen,      label: "Audit Catalog" },
      { to: "/audit-bundles",  icon: Layers,        label: "Audit Bundles" },
      { to: "/question-bank",  icon: Library,       label: "Question Bank" },
      { to: "/evidence",       icon: FolderOpen,    label: "Evidence Vault" },
      { to: "/reports",        icon: FileText,      label: "Reports" },
      { to: "/engagements",    icon: Briefcase,     label: "Engagements" },
    ],
  },
  {
    title: "Finance & Business",
    items: [
      { to: "/invoices",   icon: Receipt,    label: "Invoices" },
      { to: "/financials", icon: DollarSign, label: "Financials" },
      { to: "/pipeline",   icon: TrendingUp, label: "Sales Pipeline" },
      { to: "/packages",   icon: Target,     label: "Packages" },
      { to: "/grants",     icon: Award,      label: "Grants" },
    ],
  },
  {
    title: "People & HR",
    items: [
      { to: "/people/hris",    icon: Users,     label: "HRIS Activity Hub" },
      { to: "/workforce",      icon: Building2, label: "Workforce / HRIS" },
      { to: "/workforce/onboarding", icon: ClipboardList, label: "Onboarding" },
      { to: "/workforce/pto",  icon: Umbrella,  label: "PTO & Time Off" },
      { to: "/people",         icon: Users,     label: "People & Culture" },
      { to: "/jobs",           icon: Briefcase, label: "Jobs & Hiring" },
      { to: "/people/time",    icon: BarChart2, label: "Time Tracking" },
    ],
  },
  {
    title: "WVW Academy",
    items: [
      { to: "/academy",             icon: GraduationCap, label: "Academy Home" },
      { to: "/academy/courses",     icon: BookOpen,      label: "Courses" },
      { to: "/academy/students",    icon: Users,         label: "Students" },
      { to: "/academy/credentials", icon: Award,         label: "Credentials" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { to: "/executive",   icon: Star,     label: "Executive Dashboard" },
      { to: "/kpis",        icon: Target,   label: "KPIs" },
      { to: "/benchmarks",  icon: BarChart2, label: "Benchmarks" },
    ],
  },
  {
    title: "Organization",
    items: [
      { to: "/community",  icon: MessageCircle, label: "Community" },
      { to: "/governance", icon: Scale,         label: "Governance" },
      { to: "/meetings",   icon: Calendar,      label: "Meetings" },
      { to: "/quality",    icon: Shield,        label: "Quality" },
    ],
  },
  {
    title: "System",
    items: [
      { to: "/notifications",         icon: Bell,      label: "Notifications" },
      { to: "/settings/team",         icon: Users,     label: "Team Members" },
      { to: "/settings/invites",      icon: Mail,      label: "Invitations" },
      { to: "/settings/organization", icon: Building2, label: "Org Settings" },
      { to: "/settings/integrations", icon: Settings,  label: "Integrations" },
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
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

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
                <div className="text-white font-bold text-sm leading-tight truncate">WVW Intelligence</div>
                <div className="text-white/35 text-[11px] leading-tight">Master Diagnostic System</div>
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
              <p className="text-white/70 text-xs font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-white/30 text-[10px] truncate capitalize">{user.role.toLowerCase().replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/5">
          <p className="text-white/20 text-[10px]">v2.0.0 — Wholistic Vibes Wellness</p>
        </div>
      </aside>
    </>
  );
}
