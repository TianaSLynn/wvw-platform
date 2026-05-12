"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Users, Star, Mail, Phone, Linkedin, Globe,
  FileText, CheckCircle2, XCircle, MessageSquare, Download,
  ChevronDown, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AppStatus = "NEW" | "REVIEWING" | "INTERVIEW" | "OFFERED" | "HIRED" | "REJECTED" | "WITHDRAWN";

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  linkedIn: string | null;
  portfolio: string | null;
  resumeUrl: string | null;
  coverLetter: string | null;
  status: AppStatus;
  rating: number | null;
  notes: string | null;
  appliedAt: string;
  reviewedBy: { firstName: string; lastName: string } | null;
}

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string }> = {
  NEW:       { label: "New",        color: "text-blue-500",   bg: "bg-blue-500/10 border-blue-500/20" },
  REVIEWING: { label: "Reviewing",  color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/20" },
  INTERVIEW: { label: "Interview",  color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  OFFERED:   { label: "Offered",    color: "text-emerald-500",bg: "bg-emerald-500/10 border-emerald-500/20" },
  HIRED:     { label: "Hired",      color: "text-green-500",  bg: "bg-green-500/10 border-green-500/20" },
  REJECTED:  { label: "Rejected",   color: "text-red-500",    bg: "bg-red-500/10 border-red-500/20" },
  WITHDRAWN: { label: "Withdrawn",  color: "text-muted-foreground", bg: "bg-muted border-border" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as AppStatus[];

export default function JobApplicationsPage() {
  const { id: postingId } = useParams<{ id: string }>();
  const router = useRouter();
  const [posting, setPosting]     = useState<{ title: string; type: string; _count: { applications: number } } | null>(null);
  const [apps, setApps]           = useState<Application[]>([]);
  const [loading, setLoading]     = useState(true);
  const [active, setActive]       = useState<Application | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [saving, startSave]       = useTransition();
  const [filterStatus, setFilter] = useState<string>("ALL");
  const [bookingUrl, setBookingUrl] = useState<string>("");

  async function load() {
    setLoading(true);
    const [pRes, aRes, orgRes] = await Promise.all([
      fetch(`/api/jobs/${postingId}`),
      fetch(`/api/jobs/${postingId}/applications`),
      fetch("/api/org"),
    ]);
    if (pRes.ok) setPosting((await pRes.json()).data);
    if (aRes.ok) setApps((await aRes.json()).data);
    if (orgRes.ok) {
      const { data: org } = await orgRes.json();
      const settings = (org?.settings && typeof org.settings === "object" ? org.settings : {}) as Record<string, unknown>;
      setBookingUrl((settings.interviewBookingUrl as string) ?? "");
    }
    setLoading(false);
  }

  function scheduleInterview(app: Application) {
    if (!bookingUrl) return;
    const url = new URL(bookingUrl);
    url.searchParams.set("name", `${app.firstName} ${app.lastName}`);
    url.searchParams.set("email", app.email);
    if (posting?.title) url.searchParams.set("notes", `Interview for: ${posting.title}`);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  useEffect(() => { load(); }, [postingId]);

  function openApp(app: Application) {
    setActive(app);
    setNoteInput(app.notes ?? "");
  }

  function updateApp(applicationId: string, patch: object) {
    startSave(async () => {
      const res = await fetch(`/api/jobs/${postingId}/applications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, ...patch }),
      });
      if (res.ok) {
        const { data: updated } = await res.json();
        setApps((prev) => prev.map((a) => a.id === updated.id ? updated : a));
        if (active?.id === updated.id) setActive(updated);
      }
    });
  }

  const filtered = apps.filter((a) => filterStatus === "ALL" || a.status === filterStatus);

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<AppStatus, number>);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} aria-label="Go back" className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{posting?.title ?? "Loading…"}</h1>
          <p className="text-sm text-muted-foreground">{posting?._count.applications ?? 0} applications received</p>
        </div>
      </div>

      {/* Status pipeline */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(filterStatus === s ? "ALL" : s)}
              className={cn(
                "section-card p-3 text-center cursor-pointer transition-all hover:border-gold/30",
                filterStatus === s && "border-gold/40 bg-gold/5"
              )}
            >
              <p className={cn("text-xl font-bold", cfg.color)}>{counts[s]}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="section-card p-12 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={22} className="text-muted-foreground" /></div>
          <p className="font-medium text-sm">No applications yet</p>
          <p className="text-xs text-muted-foreground">Share the posting link to start receiving applicants</p>
        </div>
      ) : (
        <div className="section-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Rating</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const sc = STATUS_CONFIG[app.status];
                return (
                  <tr key={app.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openApp(app)}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-navy-900/10 border border-border flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-gold">
                            {app.firstName[0]}{app.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{app.firstName} {app.lastName}</p>
                          {app.coverLetter && <p className="text-[10px] text-muted-foreground">Has cover letter</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <a href={`mailto:${app.email}`} aria-label={`Email ${app.firstName}`} onClick={(e) => e.stopPropagation()} className="text-gold hover:underline text-xs">
                          <Mail size={12} />
                        </a>
                        {app.linkedIn && (
                          <a href={app.linkedIn} aria-label={`${app.firstName}'s LinkedIn`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500">
                            <Linkedin size={12} />
                          </a>
                        )}
                        {app.portfolio && (
                          <a href={app.portfolio} aria-label={`${app.firstName}'s portfolio`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground">
                            <Globe size={12} />
                          </a>
                        )}
                        {app.resumeUrl && (
                          <a href={app.resumeUrl} aria-label={`${app.firstName}'s resume`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground">
                            <FileText size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <select
                          value={app.status}
                          aria-label="Application status"
                          onChange={(e) => updateApp(app.id, { status: e.target.value })}
                          className={cn("text-[11px] font-semibold px-2 py-1 rounded-lg border appearance-none pr-6 cursor-pointer bg-transparent", sc.bg, sc.color)}
                        >
                          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                        </select>
                        <ChevronDown size={10} className={cn("absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none", sc.color)} />
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map((n) => (
                          <button key={n} type="button" aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`} onClick={() => updateApp(app.id, { rating: app.rating === n ? null : n })}
                            className={cn("transition-colors", n <= (app.rating ?? 0) ? "text-gold" : "text-muted-foreground/30 hover:text-gold/50")}>
                            <Star size={12} fill={n <= (app.rating ?? 0) ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {bookingUrl && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); scheduleInterview(app); }}
                            aria-label="Schedule interview"
                            className="btn-ghost text-xs px-2 py-1 flex items-center gap-1 text-gold hover:bg-gold/10">
                            <CalendarDays size={11} /> Schedule
                          </button>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); openApp(app); }}
                          className="btn-ghost text-xs px-2 py-1">View</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Application detail drawer */}
      {active && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg h-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold">{active.firstName} {active.lastName}</h2>
                <p className="text-xs text-muted-foreground">{active.email}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setActive(null)} className="btn-ghost p-2 rounded-xl text-sm">✕</button>
            </div>
            <div className="p-5 space-y-5">
              {/* Status + rating */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <select
                    value={active.status}
                    aria-label="Application status"
                    onChange={(e) => updateApp(active.id, { status: e.target.value })}
                    className="input-base w-full text-sm pr-8 appearance-none"
                  >
                    {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} type="button" aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`} onClick={() => updateApp(active.id, { rating: active.rating === n ? null : n })}
                      className={cn("transition-colors", n <= (active.rating ?? 0) ? "text-gold" : "text-muted-foreground/30")}>
                      <Star size={16} fill={n <= (active.rating ?? 0) ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1.5">
                {active.phone && (
                  <a href={`tel:${active.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Phone size={13} /> {active.phone}
                  </a>
                )}
                <a href={`mailto:${active.email}`} className="flex items-center gap-2 text-sm text-gold hover:underline">
                  <Mail size={13} /> {active.email}
                </a>
                {active.linkedIn && (
                  <a href={active.linkedIn} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                    <Linkedin size={13} /> LinkedIn Profile
                  </a>
                )}
                {active.portfolio && (
                  <a href={active.portfolio} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Globe size={13} /> Portfolio / Website
                  </a>
                )}
                {active.resumeUrl && (
                  <a href={active.resumeUrl} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Download size={13} /> Download Resume
                  </a>
                )}
              </div>

              {/* Cover letter */}
              {active.coverLetter && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cover Letter</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/40 rounded-xl p-4">
                    {active.coverLetter}
                  </p>
                </div>
              )}

              {/* Internal notes */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MessageSquare size={11} /> Internal Notes
                </p>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={4}
                  placeholder="Add notes for your team about this applicant..."
                  className="input-base w-full text-sm resize-none"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateApp(active.id, { notes: noteInput })}
                  className="btn-primary text-xs px-4 py-1.5 mt-2"
                >
                  {saving ? "Saving…" : "Save Notes"}
                </button>
              </div>

              {/* Quick actions */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {bookingUrl && (
                  <button type="button" onClick={() => scheduleInterview(active)}
                    className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5">
                    <CalendarDays size={13} /> Schedule Interview
                  </button>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => updateApp(active.id, { status: "HIRED" })}
                    className="flex-1 btn-gold text-xs py-2 flex items-center justify-center gap-1">
                    <CheckCircle2 size={12} /> Hire
                  </button>
                  <button type="button" onClick={() => updateApp(active.id, { status: "REJECTED" })}
                    className="flex-1 btn-ghost text-xs py-2 flex items-center justify-center gap-1 text-red-500 hover:bg-red-500/10 border border-red-500/20">
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
