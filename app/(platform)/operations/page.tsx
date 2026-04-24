import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Settings2, FolderKanban, AlertTriangle, Users, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Operations" };

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "text-green-500 bg-green-500/10",
  PLANNING: "text-blue-500 bg-blue-500/10",
  ON_HOLD: "text-amber-500 bg-amber-500/10",
  COMPLETED: "text-muted-foreground bg-muted",
  CANCELLED: "text-red-500 bg-red-500/10",
};

export default async function OperationsPage() {
  const user = await requireUser();

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeProjects, tasksDueThisWeek, overdueItems, teamMembers, projects, timeEntries] = await Promise.all([
    db.project.count({ where: { orgId: user.orgId, status: "ACTIVE", deletedAt: null } }),
    db.milestone.count({
      where: {
        project: { orgId: user.orgId },
        isCompleted: false,
        dueDate: { gte: startOfWeek, lte: endOfWeek },
      },
    }),
    db.milestone.count({
      where: {
        project: { orgId: user.orgId },
        isCompleted: false,
        dueDate: { lt: now },
      },
    }),
    db.user.count({ where: { orgId: user.orgId, status: "ACTIVE", deletedAt: null } }),
    db.project.findMany({
      where: { orgId: user.orgId, status: "ACTIVE", deletedAt: null },
      include: {
        client: { select: { name: true } },
        _count: { select: { members: true, tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.timeEntry.aggregate({
      where: {
        project: { orgId: user.orgId },
        date: { gte: firstOfMonth },
        status: { in: ["SUBMITTED", "APPROVED"] },
      },
      _sum: { hours: true },
    }),
  ]);

  const totalHoursThisMonth = timeEntries._sum.hours ?? 0;
  const targetHours = teamMembers * 160; // ~160h/month per person
  const utilization = targetHours > 0 ? Math.round((totalHoursThisMonth / targetHours) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Operations"
        subtitle="Operational health, project status, and team utilization at a glance"
        icon={Settings2}
        iconBg="bg-sage/20 border-sage/30"
        iconColor="text-sage"
        actions={
          <Link href="/engagements" className="btn-primary flex items-center gap-2">
            View Engagements
            <ArrowRight size={16} />
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Active Projects" value={activeProjects} icon={FolderKanban} iconColor="text-blue-500" />
        <StatCard label="Tasks Due This Week" value={tasksDueThisWeek} icon={Clock} iconColor="text-amber-500" />
        <StatCard label="Team Members" value={teamMembers} icon={Users} iconColor="text-green-500" />
        <StatCard label="Avg Utilization" value={`${utilization}%`} icon={Settings2} iconColor={utilization >= 70 ? "text-green-500" : "text-amber-500"} />
      </div>

      {overdueItems > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold text-red-500">{overdueItems} overdue milestone{overdueItems !== 1 ? "s" : ""}</span>
            {" "}require attention
          </p>
          <Link href="/engagements" className="ml-auto text-xs text-red-500 hover:underline">View →</Link>
        </div>
      )}

      <div className="section-card">
        <div className="section-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Active Projects</h2>
          </div>
          <Link href="/engagements" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FolderKanban size={24} className="text-muted-foreground/40" /></div>
            <p className="text-sm text-muted-foreground">No active projects</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Team</th>
                  <th>Tasks</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link href={`/engagements/${project.id}`} className="font-medium text-foreground hover:text-gold transition-colors">
                        {project.name}
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{project.client?.name ?? "—"}</td>
                    <td>
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", STATUS_STYLES[project.status] ?? "bg-muted text-muted-foreground")}>
                        {project.status}
                      </span>
                    </td>
                    <td className="text-foreground">{project.budget ? formatCurrency(project.budget) : "—"}</td>
                    <td className="text-foreground">{project._count.members}</td>
                    <td className="text-foreground">{project._count.tasks}</td>
                    <td className="text-muted-foreground">{formatDate(project.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
