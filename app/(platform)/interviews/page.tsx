import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { MessageSquare, Plus, FileText, Clock, Users, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import InterviewScheduleForm from "./InterviewScheduleForm";

export const metadata: Metadata = { title: "Interview Center" };

const INTERVIEW_TEMPLATES = [
  { name: "SOC 2 Management Walkthrough",   description: "Trust Services Criteria, risk assessment, and management review processes",    questions: 28, duration: "90 min" },
  { name: "IT Systems & Controls",          description: "Access management, change management, backup procedures, incident response",     questions: 35, duration: "120 min" },
  { name: "Process Owner Walkthrough",      description: "Deep dive into specific business process controls and documentation",           questions: 22, duration: "60 min" },
  { name: "HR & People Controls",           description: "Onboarding, background checks, access provisioning, and offboarding",          questions: 18, duration: "45 min" },
  { name: "Financial Controls Interview",   description: "Revenue recognition, AP/AR, reconciliation, and period-end close procedures",  questions: 30, duration: "90 min" },
  { name: "Vendor Management Review",       description: "Third-party risk management, contracts, and ongoing monitoring procedures",    questions: 15, duration: "45 min" },
];

export default async function InterviewsPage() {
  const user = await requireUser();

  const [scheduledInterviews, recentDocs, audits] = await Promise.all([
    db.meeting.findMany({
      where: {
        orgId: user.orgId,
        type: "INTERVIEW",
        scheduledAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    }),
    db.document.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        client: { select: { name: true } },
      },
    }),
    db.audit.findMany({
      where: { orgId: user.orgId, status: { in: ["FIELDWORK", "PLANNING", "REVIEW"] } },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 15,
    }),
  ]);

  const interviewNotes = recentDocs.filter(
    (d) => d.category === "interview" || d.title.toLowerCase().includes("interview")
  );

  const upcomingInterviews = scheduledInterviews.filter(
    (m) => m.scheduledAt && new Date(m.scheduledAt) >= new Date()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Interview Center"
        subtitle="Schedule, conduct, and document audit interviews and walkthroughs"
        icon={MessageSquare}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule form (client component) */}
        <div className="lg:col-span-1">
          <InterviewScheduleForm audits={audits} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Upcoming scheduled interviews */}
          {upcomingInterviews.length > 0 && (
            <div className="section-card">
              <div className="section-card-header flex items-center gap-2">
                <Calendar size={15} className="text-blue-500" />
                <h2 className="text-sm font-semibold">Upcoming Interviews</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{upcomingInterviews.length}</span>
              </div>
              <div className="divide-y divide-border">
                {upcomingInterviews.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock size={13} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {m.scheduledAt && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(m.scheduledAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {m.client && <span>{m.client.name}</span>}
                        {m.location && <span>{m.location}</span>}
                      </div>
                    </div>
                    {m.duration && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">{m.duration} min</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Templates */}
          <div className="section-card">
            <div className="section-card-header flex items-center gap-2">
              <FileText size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Interview Templates</h2>
            </div>
            <div className="divide-y divide-border">
              {INTERVIEW_TEMPLATES.map((tpl) => (
                <div key={tpl.name} className="flex items-start gap-3 px-4 py-3">
                  <MessageSquare size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">{tpl.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><FileText size={11} /> {tpl.questions} questions</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {tpl.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Notes */}
          <div className="section-card">
            <div className="section-card-header flex items-center gap-2">
              <Users size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Interview Notes</h2>
            </div>
            {interviewNotes.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No interview notes yet</p>
                <p className="text-xs text-muted-foreground mt-1">Upload notes from the Evidence page to see them here</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {interviewNotes.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    <FileText size={14} className="text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.client?.name && `${doc.client.name} · `}
                        {`${doc.createdBy.firstName} ${doc.createdBy.lastName}`} · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
