import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Kanban, Users, CheckSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Boards Monitor" };

export default async function BoardsPage() {
  const user = await requireUser();

  const projects = await db.project.findMany({
    where: { orgId: user.orgId, status: "ACTIVE", deletedAt: null },
    include: {
      tasks: {
        where: { status: { not: "DONE" } },
        select: { status: true, priority: true },
      },
      _count: { select: { tasks: true, members: true } },
      members: {
        include: {
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
        take: 4,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Boards Monitor"
        subtitle="Task board status across all active projects"
        icon={Kanban}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
      />

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Kanban size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground">No active projects</p>
          <p className="text-xs text-muted-foreground mt-1">Active projects with task boards will appear here</p>
          <Link href="/engagements" className="btn-primary mt-4 text-xs">Go to Engagements</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
          {projects.map((project) => {
            const allTasks = project._count.tasks;
            const doneTasks = project.tasks.filter(t => t.status === "DONE").length;
            const inProgressTasks = project.tasks.filter(t => t.status === "IN_PROGRESS").length;
            const inReviewTasks = project.tasks.filter(t => t.status === "IN_REVIEW").length;
            const todoTasks = project.tasks.filter(t => t.status === "TODO").length;
            const completionPct = allTasks > 0 ? Math.round((doneTasks / allTasks) * 100) : 0;

            const criticalTasks = project.tasks.filter(t => t.priority === "CRITICAL").length;

            return (
              <div key={project.id} className="section-card p-5 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/engagements/${project.id}`} className="font-semibold text-foreground hover:text-gold transition-colors text-sm block truncate">
                      {project.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{project._count.members} member{project._count.members !== 1 ? "s" : ""} · {allTasks} tasks</p>
                  </div>
                  {criticalTasks > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 flex-shrink-0 ml-2">
                      {criticalTasks} critical
                    </span>
                  )}
                </div>

                {/* Task status bars */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{completionPct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 mb-4">
                  {[
                    { label: "Todo", count: todoTasks, color: "bg-muted text-muted-foreground" },
                    { label: "In Progress", count: inProgressTasks, color: "bg-blue-500/10 text-blue-500" },
                    { label: "Review", count: inReviewTasks, color: "bg-amber-500/10 text-amber-500" },
                    { label: "Done", count: doneTasks, color: "bg-green-500/10 text-green-500" },
                  ].map((col) => (
                    <div key={col.label} className={cn("rounded-lg p-2 text-center", col.color)}>
                      <p className="text-lg font-bold">{col.count}</p>
                      <p className="text-xs leading-tight">{col.label}</p>
                    </div>
                  ))}
                </div>

                {/* Team avatars */}
                {project.members.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {project.members.map((m) => (
                        <div
                          key={m.userId}
                          className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center flex-shrink-0"
                          title={`${m.user.firstName} ${m.user.lastName}`}
                        >
                          {m.user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">
                              {m.user.firstName[0]}{m.user.lastName[0]}
                            </span>
                          )}
                        </div>
                      ))}
                      {project._count.members > 4 && (
                        <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">+{project._count.members - 4}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">Team</span>
                  </div>
                )}

                <Link
                  href={`/engagements/${project.id}`}
                  className="btn-ghost w-full text-xs flex items-center justify-center gap-1"
                >
                  <CheckSquare size={13} />
                  View Board
                  <ArrowRight size={13} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
