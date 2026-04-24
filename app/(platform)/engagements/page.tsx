import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, Briefcase, CalendarDays, DollarSign } from "lucide-react";

export const metadata: Metadata = { title: "Engagements" };

const STATUS_VARIANT: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  DISCOVERY:  "default",
  PLANNING:   "default",
  ACTIVE:     "success",
  ON_HOLD:    "warning",
  COMPLETED:  "secondary",
  CANCELLED:  "destructive",
};

export default async function EngagementsPage() {
  const user = await requireUser();

  const projects = await db.project.findMany({
    where: { orgId: user.orgId, deletedAt: null },
    include: {
      client: { select: { name: true, logoUrl: true } },
      members: { take: 4, include: { user: { select: { firstName: true, lastName: true } } } },
      _count: { select: { tasks: true, timeEntries: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Engagements"
        subtitle={`${projects.filter((p) => p.status === "ACTIVE").length} active · ${projects.length} total`}
        actions={
          <Link
            href="/engagements/new"
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium bg-navy-900 text-white hover:bg-navy-800 transition-colors"
          >
            <Plus size={14} />
            New Engagement
          </Link>
        }
      />

      {projects.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Briefcase size={32} className="text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No engagements yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first engagement to track project work</p>
          <Link
            href="/engagements/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-navy-900 text-white hover:bg-navy-800 transition-colors"
          >
            <Plus size={14} /> New Engagement
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/engagements/${project.id}`}
              className="bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover hover:border-gold/30 transition-all duration-200 group block"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-gold transition-colors truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{project.client.name}</span>
                    {project.code && (
                      <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                        {project.code}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[project.status] ?? "secondary"} size="sm">
                  {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
                </Badge>
              </div>

              {/* Progress bar */}
              {project.completionPct > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{project.completionPct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full transition-all duration-500"
                      style={{ width: `${project.completionPct}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {project.startDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={11} />
                      {formatDate(project.startDate, "MMM d")}
                      {project.targetEndDate && ` – ${formatDate(project.targetEndDate, "MMM d, yyyy")}`}
                    </span>
                  )}
                  <span>{project._count.tasks} tasks</span>
                </div>
                <div className="flex items-center gap-3">
                  {project.budget && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign size={11} />
                      {formatCurrency(project.budget, "USD", true)}
                    </span>
                  )}
                  <div className="flex -space-x-1.5">
                    {project.members.slice(0, 4).map((m) => (
                      <div
                        key={m.userId}
                        className="w-6 h-6 rounded-full bg-navy-900 border-2 border-card flex items-center justify-center"
                        title={`${m.user.firstName} ${m.user.lastName}`}
                      >
                        <span className="text-[9px] font-bold text-white">
                          {m.user.firstName[0]}{m.user.lastName[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
