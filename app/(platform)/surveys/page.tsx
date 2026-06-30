import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ClipboardList, Plus, Eye, BarChart2, Clock, CheckCircle2, XCircle, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Surveys" };

const STATUS_STYLE: Record<string, string> = {
  DRAFT:    "bg-gray-100 text-gray-600 border-gray-200",
  ACTIVE:   "bg-green-50 text-green-700 border-green-200",
  CLOSED:   "bg-amber-50 text-amber-700 border-amber-200",
  ARCHIVED: "bg-gray-50 text-gray-400 border-gray-100",
};
const STATUS_ICON: Record<string, React.ElementType> = {
  DRAFT:    Clock,
  ACTIVE:   CheckCircle2,
  CLOSED:   XCircle,
  ARCHIVED: Archive,
};

export default async function SurveysPage() {
  const user = await requireUser();

  const surveys = await db.survey.findMany({
    where: { orgId: user.orgId },
    include: {
      _count: { select: { questions: true, submissions: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      audit: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const totalResponses = surveys.reduce((s, sv) => s + sv._count.submissions, 0);
  const activeCount    = surveys.filter((sv) => sv.status === "ACTIVE").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Surveys</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build, publish, and analyze surveys linked to your audits
          </p>
        </div>
        <Link href="/surveys/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> New Survey
        </Link>
      </div>

      {/* Stats */}
      <div className="stagger-children grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Surveys</p>
          <p className="text-3xl font-bold gradient-text-gold mt-1">{surveys.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{activeCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Responses</p>
          <p className="text-3xl font-bold mt-1">{totalResponses}</p>
        </div>
      </div>

      {/* Survey list */}
      {surveys.length === 0 ? (
        <div className="section-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardList size={24} className="text-muted-foreground" />
            </div>
            <p className="font-semibold">No surveys yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm text-center">
              Create your first survey to gather structured feedback from clients and stakeholders.
            </p>
            <Link href="/surveys/new" className="btn-primary text-xs flex items-center gap-1.5">
              <Plus size={13} /> Create Survey
            </Link>
          </div>
        </div>
      ) : (
        <div className="section-card">
          <div className="section-card-header flex items-center justify-between">
            <h2 className="font-semibold text-sm">All Surveys ({surveys.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {surveys.map((sv) => {
              const Icon = STATUS_ICON[sv.status] ?? Clock;
              return (
                <div key={sv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={16} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link href={`/surveys/${sv.id}`} className="font-semibold text-sm hover:text-gold transition-colors truncate">
                        {sv.title}
                      </Link>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 flex-shrink-0", STATUS_STYLE[sv.status])}>
                        <Icon size={10} /> {sv.status.charAt(0) + sv.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{sv._count.questions} question{sv._count.questions !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{sv._count.submissions} response{sv._count.submissions !== 1 ? "s" : ""}</span>
                      {sv.audit && <><span>·</span><span className="truncate">{sv.audit.name}</span></>}
                      <span>·</span>
                      <span>by {sv.createdBy.firstName} {sv.createdBy.lastName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/surveys/${sv.id}/builder`} className="btn-ghost text-xs px-3 py-1.5">
                      Edit
                    </Link>
                    <Link href={`/surveys/${sv.id}/results`} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1">
                      <BarChart2 size={12} /> Results
                    </Link>
                    {sv.status === "ACTIVE" && (
                      <Link href={`/s/${sv.slug}`} target="_blank" className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1">
                        <Eye size={12} /> Preview
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
