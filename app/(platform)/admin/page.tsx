import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Shield, Users, Building2, Activity, Plug, UserPlus, Clock } from "lucide-react";
import Link from "next/link";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Panel" };

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-green-500 bg-green-500/10",
  INACTIVE: "text-muted-foreground bg-muted",
  ERROR: "text-red-500 bg-red-500/10",
  PENDING: "text-amber-500 bg-amber-500/10",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  PARTNER: "Partner",
  MANAGER: "Manager",
  CONSULTANT: "Consultant",
  AUDITOR: "Auditor",
  CLIENT_ADMIN: "Client Admin",
  CLIENT_USER: "Client User",
};

export default async function AdminPage() {
  const user = await requireUser();

  const [org, users, integrations, recentActivity, auditCount] = await Promise.all([
    db.organization.findUnique({ where: { id: user.orgId } }),
    db.user.findMany({ where: { orgId: user.orgId }, select: { role: true, firstName: true, lastName: true, email: true, createdAt: true } }),
    db.integration.findMany({ where: { orgId: user.orgId }, orderBy: { updatedAt: "desc" } }),
    db.activityLog.findMany({
      where: { orgId: user.orgId },
      orderBy: { timestamp: "desc" },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    db.audit.count({ where: { orgId: user.orgId } }),
  ]);

  // Group users by role
  const roleGroups: Record<string, number> = {};
  for (const u of users) {
    roleGroups[u.role] = (roleGroups[u.role] ?? 0) + 1;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Admin Panel"
        subtitle="Organization settings, user management, and system overview"
        icon={Shield}
        iconBg="bg-red-500/10 border-red-500/20"
        iconColor="text-red-500"
        actions={
          <Link href="/settings/team" className="btn-primary flex items-center gap-2">
            <UserPlus size={16} />
            Invite User
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Org Info */}
        <div className="section-card p-5 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={15} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold">Organization</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-semibold text-foreground">{org?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Slug</p>
              <p className="text-sm font-mono text-foreground">{org?.slug ?? "—"}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Members</p>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Audits</p>
                <p className="text-2xl font-bold text-foreground">{auditCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Breakdown */}
        <div className="section-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold">Users by Role</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(roleGroups).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-foreground">{ROLE_LABELS[role] ?? role}</span>
                <span className="text-lg font-bold text-foreground">{count}</span>
              </div>
            ))}
            {Object.keys(roleGroups).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2">No users found</p>
            )}
          </div>
          <Link href="/settings/team" className="btn-ghost text-xs mt-4 inline-flex items-center gap-1">
            Manage Team →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Integrations */}
        <div className="section-card">
          <div className="section-card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plug size={15} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold">Integrations</h3>
            </div>
            <Link href="/settings/integrations" className="text-xs text-muted-foreground hover:text-foreground">Manage →</Link>
          </div>
          <div className="divide-y divide-border">
            {integrations.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No integrations configured</div>
            ) : (
              integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.slug}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", STATUS_COLORS[integration.status] ?? "text-muted-foreground bg-muted")}>
                    {integration.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <Activity size={15} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No recent activity</div>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <Clock size={13} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground truncate">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"} · {formatDate(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
