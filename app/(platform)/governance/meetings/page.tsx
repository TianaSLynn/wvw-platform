import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Calendar, Plus, FileText, Users, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Board Meetings" };

const MEETING_TYPES = ["Annual General", "Regular Board", "Audit Committee", "Risk Committee", "Special Session"];

const HARDCODED_MEETINGS = [
  { id: "1", title: "Q1 2026 Board Meeting", date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), type: "Regular Board", attendees: 7, status: "Upcoming", hasMinutes: false },
  { id: "2", title: "Audit Committee Q1", date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), type: "Audit Committee", attendees: 4, status: "Upcoming", hasMinutes: false },
  { id: "3", title: "Q4 2025 Board Meeting", date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), type: "Regular Board", attendees: 7, status: "Completed", hasMinutes: true },
  { id: "4", title: "Q3 2025 Board Meeting", date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), type: "Regular Board", attendees: 6, status: "Completed", hasMinutes: true },
  { id: "5", title: "Annual General Meeting 2025", date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), type: "Annual General", attendees: 12, status: "Completed", hasMinutes: true },
];

export default async function GovernanceMeetingsPage() {
  const user = await requireUser();

  const boardDocs = await db.document.findMany({
    where: { orgId: user.orgId, category: "board_minutes" },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const upcomingMeetings = HARDCODED_MEETINGS.filter(m => m.status === "Upcoming");
  const pastMeetings = HARDCODED_MEETINGS.filter(m => m.status === "Completed");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Board Meetings"
        subtitle="Schedule board meetings and manage minutes, resolutions, and attendance"
        icon={Calendar}
        iconBg="bg-navy-900/10 border-navy-900/20"
        iconColor="text-navy-900"
        breadcrumbs={[{ label: "Governance", href: "/governance" }, { label: "Board Meetings" }]}
        actions={
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Schedule Meeting
          </button>
        }
      />

      {/* Upcoming */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <Calendar size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Upcoming Meetings</h2>
        </div>
        <div className="divide-y divide-border">
          {upcomingMeetings.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-4 py-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-blue-500">{m.date.toLocaleDateString("en-US", { month: "short" })}</span>
                <span className="text-lg font-bold text-foreground leading-none">{m.date.getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{m.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-3">
                  <span>{m.type}</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {m.attendees} attendees</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost text-xs">Add Agenda</button>
                <button className="btn-primary text-xs">Prepare</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past meetings */}
      <div className="section-card">
        <div className="section-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Past Meetings</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Meeting</th>
                <th>Type</th>
                <th>Date</th>
                <th>Attendees</th>
                <th>Minutes</th>
              </tr>
            </thead>
            <tbody>
              {pastMeetings.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium text-foreground">{m.title}</td>
                  <td className="text-muted-foreground">{m.type}</td>
                  <td className="text-muted-foreground">{formatDate(m.date)}</td>
                  <td className="text-muted-foreground">{m.attendees}</td>
                  <td>
                    {m.hasMinutes ? (
                      <button className="btn-ghost text-xs flex items-center gap-1">
                        <FileText size={12} />
                        View
                      </button>
                    ) : (
                      <button className="btn-ghost text-xs">Upload</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Uploaded Board Documents */}
      {boardDocs.length > 0 && (
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <FileText size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Board Documents</h2>
          </div>
          <div className="divide-y divide-border">
            {boardDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {`${doc.createdBy.firstName} ${doc.createdBy.lastName}`} · {formatDate(doc.createdAt)}
                  </p>
                </div>
                {doc.fileUrl && (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs">View</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
