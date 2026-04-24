import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Star, TrendingUp, Users, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Quality & Growth" };

export default async function QualityPage() {
  const user = await requireUser();

  const [clientCount, totalAudits, closedFindings, totalFindings] = await Promise.all([
    db.client.count({ where: { orgId: user.orgId, isActive: true, deletedAt: null } }),
    db.audit.count({ where: { orgId: user.orgId, status: "COMPLETED" } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: "CLOSED" } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId } } }),
  ]);

  const closeRate = totalFindings > 0 ? Math.round((closedFindings / totalFindings) * 100) : 0;

  const QUICK_LINKS = [
    { href: "/quality/surveys", label: "Client Surveys", desc: "NPS & CSAT surveys", icon: Star },
    { href: "/quality/qbr", label: "QBR Reports", desc: "Quarterly business reviews", icon: BarChart3 },
    { href: "/quality/impact", label: "Impact & ROI", desc: "Audit ROI calculator", icon: TrendingUp },
    { href: "/quality/change-orders", label: "Change Orders", desc: "Scope changes", icon: Users },
    { href: "/quality/waitlist", label: "Waitlist", desc: "Client pipeline", icon: Users },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Quality & Growth"
        subtitle="Client satisfaction, service quality metrics, and growth analytics"
        icon={Star}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <div className="section-card p-5 text-center">
          <p className="text-4xl font-bold gradient-text-gold">—</p>
          <p className="text-sm font-medium text-foreground mt-1">NPS Score</p>
          <p className="text-xs text-muted-foreground">Connect surveys to track</p>
        </div>
        <div className="section-card p-5 text-center">
          <p className="text-4xl font-bold text-foreground">{clientCount}</p>
          <p className="text-sm font-medium text-foreground mt-1">Active Clients</p>
          <p className="text-xs text-muted-foreground">Currently engaged</p>
        </div>
        <div className="section-card p-5 text-center">
          <p className="text-4xl font-bold text-foreground">{totalAudits}</p>
          <p className="text-sm font-medium text-foreground mt-1">Audits Completed</p>
          <p className="text-xs text-muted-foreground">All time</p>
        </div>
        <div className="section-card p-5 text-center">
          <p className="text-4xl font-bold text-foreground">{closeRate}%</p>
          <p className="text-sm font-medium text-foreground mt-1">Finding Close Rate</p>
          <p className="text-xs text-muted-foreground">{closedFindings} of {totalFindings} closed</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="section-card p-4 flex items-center gap-3 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.desc}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
