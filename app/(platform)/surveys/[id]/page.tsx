import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList, Settings, BarChart2, List, ExternalLink,
  Clock, CheckCircle2, XCircle, Archive, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Survey Overview" };

const STATUS_STYLE: Record<string, string> = {
  DRAFT:    "bg-gray-100 text-gray-600 border-gray-200",
  ACTIVE:   "bg-green-50 text-green-700 border-green-200",
  CLOSED:   "bg-amber-50 text-amber-700 border-amber-200",
  ARCHIVED: "bg-gray-50 text-gray-400 border-gray-100",
};

export default async function SurveyOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const survey = await db.survey.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      questions:  { orderBy: { sortOrder: "asc" }, select: { id: true, type: true, title: true, required: true } },
      _count:     { select: { submissions: true } },
      createdBy:  { select: { firstName: true, lastName: true } },
      audit:      { select: { id: true, name: true } },
    },
  });

  if (!survey) return notFound();

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/s/${survey.slug}`;
  const StatusIcon = { DRAFT: Clock, ACTIVE: CheckCircle2, CLOSED: XCircle, ARCHIVED: Archive }[survey.status] ?? Clock;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ClipboardList size={18} className="text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{survey.title}</h1>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1", STATUS_STYLE[survey.status])}>
                <StatusIcon size={10} /> {survey.status.charAt(0) + survey.status.slice(1).toLowerCase()}
              </span>
            </div>
            {survey.description && (
              <p className="text-sm text-muted-foreground">{survey.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/surveys/${id}/builder`} className="btn-ghost text-xs flex items-center gap-1.5">
            <Settings size={13} /> Edit
          </Link>
          <Link href={`/surveys/${id}/results`} className="btn-ghost text-xs flex items-center gap-1.5">
            <BarChart2 size={13} /> Results
          </Link>
          <Link href={`/surveys/${id}/responses`} className="btn-ghost text-xs flex items-center gap-1.5">
            <List size={13} /> Responses
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stagger-children grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Questions</p>
          <p className="text-3xl font-bold mt-1">{survey.questions.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Responses</p>
          <p className="text-3xl font-bold gradient-text-gold mt-1">{survey._count.submissions}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Required</p>
          <p className="text-3xl font-bold mt-1">{survey.questions.filter((q) => q.required).length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Linked Audit</p>
          {survey.audit ? (
            <Link href={`/audits/${survey.audit.id}`} className="text-sm font-semibold text-gold hover:underline mt-1 block truncate">
              {survey.audit.name}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">None</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions list */}
        <div className="lg:col-span-2 section-card">
          <div className="section-card-header flex items-center justify-between">
            <h2 className="font-semibold text-sm">Questions ({survey.questions.length})</h2>
            <Link href={`/surveys/${id}/builder`} className="text-xs text-gold hover:underline">
              Edit in Builder →
            </Link>
          </div>
          {survey.questions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No questions yet.{" "}
              <Link href={`/surveys/${id}/builder`} className="text-gold hover:underline">Open builder</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {survey.questions.map((q, i) => (
                <div key={q.id} className="flex items-start gap-3 px-6 py-3">
                  <span className="text-xs font-mono text-muted-foreground w-5 pt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{q.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground capitalize">{q.type.replace("_", " ")}</span>
                      {q.required && <span className="text-xs text-red-400">Required</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Share link */}
          {survey.status === "ACTIVE" && (
            <div className="section-card p-4 space-y-3">
              <h3 className="text-sm font-semibold">Share Link</h3>
              <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border">
                <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{publicUrl}</span>
                <Link href={`/s/${survey.slug}`} target="_blank">
                  <ExternalLink size={13} className="text-muted-foreground hover:text-gold" />
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">Copy and share with respondents</p>
            </div>
          )}

          {/* Details */}
          <div className="section-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">Details</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created by</dt>
                <dd>{survey.createdBy.firstName} {survey.createdBy.lastName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Anonymous</dt>
                <dd>{survey.isAnonymous ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Multiple submissions</dt>
                <dd>{survey.allowMultiple ? "Allowed" : "One per respondent"}</dd>
              </div>
              {survey.closeAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Closes</dt>
                  <dd>{new Date(survey.closeAt).toLocaleDateString()}</dd>
                </div>
              )}
              {survey.publishedAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Published</dt>
                  <dd>{new Date(survey.publishedAt).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
