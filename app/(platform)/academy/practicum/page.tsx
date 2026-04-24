import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { GraduationCap, Briefcase, CheckCircle2, Clock, AlertCircle, Plus } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Practicum" };

const PRACTICUM_TRACKS = [
  { title: "Audit Shadow", desc: "Observe a live audit from planning through reporting alongside a senior auditor.", hours: 40, badge: "Audit Observer" },
  { title: "Finding Lead", desc: "Lead finding documentation, evidence collection, and client interviews on a real engagement.", hours: 60, badge: "Field Auditor" },
  { title: "Engagement Manager", desc: "Manage a client engagement end-to-end under partner supervision.", hours: 80, badge: "Engagement Lead" },
];

const ASSIGNMENTS = [
  { student: "Devon Brooks", track: "Audit Shadow", audit: "SOC 2 Type II — Meridian Financial", mentor: "Marcus Webb", status: "IN_PROGRESS", pct: 65, startDate: new Date("2026-02-01"), endDate: new Date("2026-04-30") },
  { student: "Priya Sharma", track: "Finding Lead", audit: "HIPAA Security Rule — Apex Healthcare", mentor: "Aisha Patel", status: "IN_PROGRESS", pct: 42, startDate: new Date("2026-01-15"), endDate: new Date("2026-03-31") },
  { student: "Tyler Nguyen", track: "Engagement Manager", audit: "Annual Governance Review — Brightview", mentor: "Tiána Lynn", status: "COMPLETED", pct: 100, startDate: new Date("2025-11-01"), endDate: new Date("2025-12-31") },
  { student: "Camille Laurent", track: "Audit Shadow", audit: "Operational Risk — Summit Logistics", mentor: "Marcus Webb", status: "COMPLETED", pct: 100, startDate: new Date("2025-10-01"), endDate: new Date("2025-11-30") },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  IN_PROGRESS: { label: "In Progress", color: "text-blue-500",   bg: "bg-blue-500/10",  icon: Clock },
  COMPLETED:   { label: "Completed",   color: "text-green-500",  bg: "bg-green-500/10", icon: CheckCircle2 },
  PENDING:     { label: "Not Started", color: "text-amber-500",  bg: "bg-amber-500/10", icon: AlertCircle },
};

export default async function PracticumPage() {
  const user = await requireUser();

  const activeAudits = await db.audit.findMany({
    where: { orgId: user.orgId, status: { in: ["FIELDWORK", "REVIEW", "REPORTING"] } },
    select: { id: true, name: true, client: { select: { name: true } } },
    take: 6,
  });

  const inProgress = ASSIGNMENTS.filter((a) => a.status === "IN_PROGRESS").length;
  const completed  = ASSIGNMENTS.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Practicum"
        subtitle="Hands-on audit experience pairing students with live engagements and senior mentors"
        icon={GraduationCap}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
        breadcrumbs={[{ label: "Academy", href: "/academy" }, { label: "Practicum" }]}
        actions={<button className="btn-primary flex items-center gap-2"><Plus size={16} /> Assign Student</button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Active Assignments", value: inProgress, color: "text-blue-500",   bg: "bg-blue-500/10" },
          { label: "Completed",          value: completed,  color: "text-green-500",  bg: "bg-green-500/10" },
          { label: "Available Audits",   value: activeAudits.length, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Practicum Tracks",   value: PRACTICUM_TRACKS.length, color: "text-gold", bg: "bg-gold/10" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="section-card p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg)}>
              <GraduationCap size={18} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Practicum Tracks */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Practicum Tracks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRACTICUM_TRACKS.map((track) => (
            <div key={track.title} className="section-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={15} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-foreground">{track.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{track.desc}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{track.hours} hrs required</span>
                <span className="bg-gold/10 text-amber-700 border border-gold/20 px-2 py-0.5 rounded-full font-medium">{track.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Assignments */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <GraduationCap size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Assignments</h2>
        </div>
        <div className="divide-y divide-border">
          {ASSIGNMENTS.map((a) => {
            const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.PENDING!;
            const StatusIcon = cfg.icon;
            return (
              <div key={a.student + a.audit} className="px-4 py-3 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-navy-900 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gold">{a.student.split(" ").map(p => p[0]).join("")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.student}</p>
                  <p className="text-xs text-muted-foreground">{a.audit} · Mentor: {a.mentor}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
                      <div className={cn("h-full rounded-full", a.pct === 100 ? "bg-green-500" : "bg-purple-500")} style={{ width: `${a.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{a.pct}%</span>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1", cfg.bg, cfg.color)}>
                    <StatusIcon size={10} /> {cfg.label}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1">{a.track}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Audits for Assignment */}
      {activeAudits.length > 0 && (
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <Briefcase size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Available Live Audits</h2>
            <span className="text-xs text-muted-foreground ml-auto">Assign students to these active engagements</span>
          </div>
          <div className="divide-y divide-border">
            {activeAudits.map((audit) => (
              <div key={audit.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{audit.name}</p>
                  <p className="text-xs text-muted-foreground">{audit.client.name}</p>
                </div>
                <button className="btn-ghost text-xs">Assign Student</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
