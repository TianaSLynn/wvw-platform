import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Video, Clock, Users, FileText, Calendar, CheckCircle2, MapPin, ExternalLink } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { ScheduleMeetingButton, CompleteMeetingButton } from "./MeetingsActions";

export const metadata: Metadata = { title: "Meeting Center" };

const MEETING_TYPE_LABELS: Record<string, string> = {
  KICKOFF:   "Kickoff Meeting",
  STATUS:    "Status Update",
  FINDINGS:  "Findings Walkthrough",
  EXIT:      "Exit Conference",
  INTERVIEW: "Management Interview",
  INTERNAL:  "Internal Meeting",
  GENERAL:   "General",
};

export default async function MeetingsPage() {
  const user = await requireUser();
  const now = new Date();

  const [upcomingMeetings, pastMeetings, clients, audits, recentDocs] = await Promise.all([
    db.meeting.findMany({
      where: { orgId: user.orgId, scheduledAt: { gte: now }, status: { not: "CANCELLED" } },
      include: {
        client: { select: { id: true, name: true } },
        audit:  { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    }),
    db.meeting.findMany({
      where: { orgId: user.orgId, scheduledAt: { lt: now } },
      include: {
        client: { select: { id: true, name: true } },
        audit:  { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 10,
    }),
    db.client.findMany({
      where: { orgId: user.orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.audit.findMany({
      where: { orgId: user.orgId, status: { in: ["PLANNING", "FIELDWORK", "REVIEW"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.document.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Meeting Center"
        subtitle="Schedule, manage, and track all client and internal meetings"
        icon={Video}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
        actions={<ScheduleMeetingButton clients={clients} audits={audits} />}
      />

      {/* Upcoming Meetings */}
      <div className="section-card">
        <div className="section-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Upcoming Meetings</h2>
          </div>
          <span className="text-xs text-muted-foreground">{upcomingMeetings.length} scheduled</span>
        </div>

        {upcomingMeetings.length === 0 ? (
          <div className="p-10 text-center">
            <Calendar size={28} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming meetings</p>
            <p className="text-xs text-muted-foreground mt-1">Schedule your first meeting using the button above</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {upcomingMeetings.map((meeting) => {
              const d = meeting.scheduledAt;
              return (
                <div key={meeting.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-blue-500 uppercase">
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="text-lg font-bold text-foreground leading-none">{d.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{meeting.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {MEETING_TYPE_LABELS[meeting.type] ?? meeting.type}
                      </span>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · {meeting.duration} min
                      </span>
                      {meeting.client && (
                        <>
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs text-muted-foreground">{meeting.client.name}</span>
                        </>
                      )}
                    </div>
                    {(meeting.location || meeting.meetingUrl) && (
                      <div className="flex items-center gap-2 mt-0.5">
                        {meeting.location && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin size={9} /> {meeting.location}
                          </span>
                        )}
                        {meeting.meetingUrl && (
                          <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-blue-500 flex items-center gap-1 hover:underline">
                            <ExternalLink size={9} /> Join
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium flex-shrink-0",
                    meeting.status === "SCHEDULED"  ? "bg-green-500/10 text-green-500" :
                    meeting.status === "TENTATIVE"  ? "bg-amber-500/10 text-amber-500" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {meeting.status.charAt(0) + meeting.status.slice(1).toLowerCase()}
                  </span>
                  <CompleteMeetingButton meetingId={meeting.id} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Past Meetings */}
        <div className="section-card">
          <div className="section-card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Past Meetings</h2>
            </div>
            <span className="text-xs text-muted-foreground">{pastMeetings.length} total</span>
          </div>

          {pastMeetings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-muted-foreground">No past meetings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pastMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Calendar size={13} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{meeting.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {MEETING_TYPE_LABELS[meeting.type] ?? meeting.type} · {formatDate(meeting.scheduledAt)}
                      {meeting.client ? ` · ${meeting.client.name}` : ""}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium flex-shrink-0",
                    meeting.status === "COMPLETED"  ? "bg-green-500/10 text-green-500" :
                    meeting.status === "CANCELLED"  ? "bg-red-500/10 text-red-500" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {meeting.status.charAt(0) + meeting.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Meeting Notes */}
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <FileText size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recent Meeting Notes</h2>
          </div>
          {recentDocs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={24} className="text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No meeting notes yet</p>
              <p className="text-xs text-muted-foreground mt-1">Meeting notes will appear here once uploaded</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
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
  );
}
