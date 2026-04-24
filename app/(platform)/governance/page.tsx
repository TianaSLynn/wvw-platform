import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Scale, Users, Calendar, CheckCircle2, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Governance" };

const UPCOMING_MEETINGS = [
  { title: "Q1 Board Meeting", date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), type: "Regular", attendees: 7 },
  { title: "Audit Committee Meeting", date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), type: "Committee", attendees: 4 },
  { title: "Annual Strategy Review", date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), type: "Annual", attendees: 12 },
];

const KEY_RESOLUTIONS = [
  { title: "Annual Budget Approval FY2026", date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: "Passed", vote: "7-0" },
  { title: "New Client Engagement Policy", date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), status: "Passed", vote: "6-1" },
  { title: "Risk Appetite Statement Update", date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), status: "Passed", vote: "7-0" },
];

export default async function GovernancePage() {
  const user = await requireUser();

  const [boardMembers, totalAudits, openFindings] = await Promise.all([
    db.user.findMany({
      where: { orgId: user.orgId, role: { in: ["PARTNER", "ADMIN", "SUPER_ADMIN"] } },
      select: { id: true, firstName: true, lastName: true, role: true },
    }),
    db.audit.count({ where: { orgId: user.orgId } }),
    db.auditFinding.count({
      where: { audit: { orgId: user.orgId }, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Governance"
        subtitle="Board oversight, meeting management, and organizational governance"
        icon={Scale}
        iconBg="bg-navy-900/10 border-navy-900/20"
        iconColor="text-navy-900"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 stagger-children">
        <div className="section-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{boardMembers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Board Members</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{UPCOMING_MEETINGS.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Upcoming Meetings</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{totalAudits}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Audits</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{openFindings}</p>
          <p className="text-xs text-muted-foreground mt-1">Open Findings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Meetings */}
        <div className="section-card">
          <div className="section-card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Upcoming Meetings</h2>
            </div>
            <Link href="/governance/meetings" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {UPCOMING_MEETINGS.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-11 h-11 rounded-xl bg-muted flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">{m.date.toLocaleDateString("en-US", { month: "short" })}</span>
                  <span className="text-lg font-bold text-foreground leading-none">{m.date.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.type} · {m.attendees} attendees</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Resolutions */}
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <CheckCircle2 size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recent Resolutions</h2>
          </div>
          <div className="divide-y divide-border">
            {KEY_RESOLUTIONS.map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.date)} · Vote: {r.vote}</p>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500">{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/governance/board" className="section-card p-4 flex items-center gap-3 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Users size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Board Directory</p>
            <p className="text-xs text-muted-foreground">{boardMembers.length} members</p>
          </div>
          <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
        <Link href="/governance/meetings" className="section-card p-4 flex items-center gap-3 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Calendar size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Board Meetings</p>
            <p className="text-xs text-muted-foreground">Schedule & minutes</p>
          </div>
          <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
        <Link href="/policies" className="section-card p-4 flex items-center gap-3 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <FileText size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Policies</p>
            <p className="text-xs text-muted-foreground">Governance policies</p>
          </div>
          <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      </div>
    </div>
  );
}
