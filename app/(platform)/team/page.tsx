import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { Users, Mail, Phone, Plus, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "WVW Team" };

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", PARTNER: "Partner",
  MANAGER: "Manager", CONSULTANT: "Consultant", AUDITOR: "Auditor",
  CLIENT_ADMIN: "Client Admin", CLIENT_USER: "Client User",
};
const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
  PARTNER: "bg-gold/10 text-gold border-gold/20",
  MANAGER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  CONSULTANT: "bg-green-500/10 text-green-500 border-green-500/20",
  AUDITOR: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export default async function TeamPage() {
  const user = await requireUser();

  const members = await db.user.findMany({
    where: { orgId: user.orgId, deletedAt: null },
    include: {
      _count: { select: { auditAssignments: true, timeEntries: true } },
    },
    orderBy: [{ role: "asc" }, { firstName: "asc" }],
  });

  const byDept = members.reduce<Record<string, typeof members>>((acc, m) => {
    const dept = m.department ?? "General";
    acc[dept] = [...(acc[dept] ?? []), m];
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="WVW Team"
        subtitle={`${members.length} team members`}
        icon={Users}
        iconColor="text-gold"
        iconBg="bg-gold/10 border-gold/20"
        actions={
          <Link href="/settings/team" className="btn-primary">
            <Plus size={14} /> Invite Member
          </Link>
        }
      />

      {members.length === 0 ? (
        <div className="section-card">
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={24} className="text-muted-foreground" /></div>
            <p className="font-semibold">No team members yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Invite your team to get started</p>
            <Link href="/settings/team" className="btn-gold text-xs px-3 py-2"><Plus size={13} /> Invite Member</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byDept).map(([dept, people]) => (
            <div key={dept}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">{dept}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
                {people.map((m) => {
                  const initials = `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
                  return (
                    <div key={m.id} className="stat-card group hover:border-gold/20 hover:-translate-y-0.5">
                      <div className="flex items-start gap-3 mb-3">
                        {m.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.avatarUrl} alt={initials} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-border" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-gold font-bold">{initials}</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{m.firstName} {m.lastName}</p>
                          {m.title && <p className="text-xs text-muted-foreground truncate">{m.title}</p>}
                          <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border mt-1", ROLE_COLOR[m.role] ?? "bg-muted text-muted-foreground border-border")}>
                            {ROLE_LABELS[m.role] ?? m.role}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2 truncate">
                          <Mail size={11} className="flex-shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                        {m.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={11} className="flex-shrink-0" />
                            <span>{m.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Shield size={11} /> {m._count.auditAssignments} audits</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {m._count.timeEntries} logs</span>
                        <span className={cn("ml-auto w-2 h-2 rounded-full", m.status === "ACTIVE" ? "bg-green-500" : "bg-slate-400")} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
