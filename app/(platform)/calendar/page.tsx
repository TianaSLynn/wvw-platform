"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar, Flag, ClipboardList, AlertCircle, Video, Users, Briefcase,
  UserCheck, CalendarDays, Star, Moon, ChevronLeft, ChevronRight,
  Plus, Filter, X, Clock, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | "audit_start" | "audit_end"
  | "milestone"
  | "task"
  | "meeting"
  | "interview"
  | "onboarding"
  | "invoice_due"
  | "cultural";

type UnifiedEvent = {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  type: EventType;
  link?: string;
  meta?: string; // e.g. "60 min", "CRITICAL", "$2,400"
};

// ─── Cultural calendar data ───────────────────────────────────────────────────

type CulturalEvent = {
  name: string;
  monthNum: number;
  startDay?: number;
  endDay?: number;
  endMonthNum?: number;
  isVariable?: boolean;
  category: string;
  isOffDay: boolean;
  offType?: string;
  wvwUseCase: string;
  priority: "HIGH" | "MEDIUM";
  notes?: string;
};

const CULTURAL_EVENTS: CulturalEvent[] = [
  { name: "New Year Reset Day", monthNum: 1, startDay: 1, category: "Wellness", wvwUseCase: "Reflection + Planning", priority: "HIGH", isOffDay: true, offType: "Full Company" },
  { name: "Slavery & Human Trafficking Awareness Month", monthNum: 1, startDay: 1, endDay: 31, category: "Social Justice", wvwUseCase: "Content + Education", priority: "HIGH", isOffDay: false },
  { name: "Martin Luther King Jr. Day", monthNum: 1, isVariable: true, category: "Social Justice", wvwUseCase: "Culture Programming", priority: "HIGH", isOffDay: true, offType: "Full Company" },
  { name: "Black History Month", monthNum: 2, startDay: 1, endDay: 28, category: "Culture", wvwUseCase: "Campaign + Content", priority: "HIGH", isOffDay: false, notes: "Major WVW focus" },
  { name: "Rosa Parks Day", monthNum: 2, startDay: 4, category: "Culture", wvwUseCase: "Recognition", priority: "MEDIUM", isOffDay: false },
  { name: "Black Love Day", monthNum: 2, startDay: 13, category: "Wellness", wvwUseCase: "Reflection", priority: "MEDIUM", isOffDay: true, offType: "Soft Day (No Meetings)" },
  { name: "International Women's Day", monthNum: 3, startDay: 8, category: "Gender Equity", wvwUseCase: "Leadership Content", priority: "HIGH", isOffDay: false },
  { name: "Day of Rest for Black Women", monthNum: 3, startDay: 10, category: "Wellness", wvwUseCase: "Ritual + Rest", priority: "HIGH", isOffDay: true, offType: "Full Company", notes: "NON-NEGOTIABLE REST DAY" },
  { name: "Neurodiversity Celebration Week", monthNum: 3, startDay: 15, endDay: 21, category: "Neurodivergence", wvwUseCase: "Training Opportunity", priority: "HIGH", isOffDay: false },
  { name: "Black Women's History Month", monthNum: 4, startDay: 1, endDay: 30, category: "Culture", wvwUseCase: "Content Series", priority: "HIGH", isOffDay: false, notes: "Core WVW theme" },
  { name: "Black Maternal Health Week", monthNum: 4, startDay: 11, endDay: 17, category: "Health", wvwUseCase: "Education", priority: "HIGH", isOffDay: false },
  { name: "Autism Awareness Month", monthNum: 4, startDay: 1, endDay: 30, category: "Neurodivergence", wvwUseCase: "Training", priority: "HIGH", isOffDay: false },
  { name: "Mental Health Awareness Month", monthNum: 5, startDay: 1, endDay: 31, category: "Mental Health", wvwUseCase: "Campaign", priority: "HIGH", isOffDay: false, notes: "WVW CORE MONTH" },
  { name: "World Day for Cultural Diversity", monthNum: 5, startDay: 21, category: "DEI", wvwUseCase: "Programming", priority: "MEDIUM", isOffDay: false },
  { name: "Pride Month", monthNum: 6, startDay: 1, endDay: 30, category: "LGBTQ+", wvwUseCase: "Inclusion Programming", priority: "HIGH", isOffDay: false },
  { name: "Juneteenth", monthNum: 6, startDay: 19, category: "Culture", wvwUseCase: "Major Event", priority: "HIGH", isOffDay: true, offType: "Full Company" },
  { name: "BIPOC Mental Health Awareness Month", monthNum: 7, startDay: 1, endDay: 31, category: "Mental Health", wvwUseCase: "Campaign", priority: "HIGH", isOffDay: false },
  { name: "Black Women's Equal Pay Day", monthNum: 7, isVariable: true, category: "Equity", wvwUseCase: "Advocacy Content", priority: "HIGH", isOffDay: false },
  { name: "Black Business Month", monthNum: 8, startDay: 1, endDay: 31, category: "Business", wvwUseCase: "Brand Positioning", priority: "HIGH", isOffDay: false },
  { name: "Suicide Prevention Month", monthNum: 9, startDay: 1, endDay: 30, category: "Mental Health", wvwUseCase: "Training", priority: "HIGH", isOffDay: false },
  { name: "Black Girl Day Off", monthNum: 10, startDay: 11, category: "Wellness", wvwUseCase: "Wellness Day", priority: "HIGH", isOffDay: true, offType: "Full Company", notes: "SIGNATURE WVW OFF DAY" },
  { name: "Black Entrepreneur Day", monthNum: 10, startDay: 14, category: "Business", wvwUseCase: "Visibility", priority: "HIGH", isOffDay: false },
  { name: "Black Poetry Day", monthNum: 10, startDay: 17, category: "Culture", wvwUseCase: "Creative Expression", priority: "MEDIUM", isOffDay: true, offType: "Soft Day (Creative)" },
  { name: "National Caregivers Month", monthNum: 11, startDay: 1, endDay: 30, category: "Workforce", wvwUseCase: "Recognition", priority: "MEDIUM", isOffDay: false },
  { name: "Kwanzaa", monthNum: 12, startDay: 26, endDay: 1, endMonthNum: 1, category: "Culture", wvwUseCase: "Reflection", priority: "HIGH", isOffDay: true, offType: "Optional Flexible Off" },
  { name: "End of Year Reset Week", monthNum: 12, startDay: 26, endDay: 31, category: "Wellness", wvwUseCase: "Rest + Reflection", priority: "HIGH", isOffDay: true, offType: "Company Slow/Closed" },
];

// ─── Event config ─────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<EventType, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  meeting:      { label: "Meeting",     color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/30",    icon: Video },
  interview:    { label: "Interview",   color: "text-violet-600",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  icon: Users },
  onboarding:   { label: "Onboarding", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: UserCheck },
  audit_start:  { label: "Audit",      color: "text-sky-600",     bg: "bg-sky-500/10",     border: "border-sky-500/30",     icon: ClipboardList },
  audit_end:    { label: "Audit End",  color: "text-red-600",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: AlertCircle },
  milestone:    { label: "Milestone",  color: "text-amber-600",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   icon: Flag },
  task:         { label: "Task Due",   color: "text-orange-600",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  icon: AlertCircle },
  invoice_due:  { label: "Invoice",   color: "text-rose-600",    bg: "bg-rose-500/10",    border: "border-rose-500/30",    icon: Briefcase },
  cultural:     { label: "Cultural",  color: "text-purple-600",  bg: "bg-purple-500/10",  border: "border-purple-500/30",  icon: CalendarDays },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function UnifiedCalendarPage() {
  const now = new Date();
  const [viewMode, setViewMode] = useState<"schedule" | "cultural">("schedule");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Cultural calendar state
  const [culturalMonth, setCulturalMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [showOffOnly, setShowOffOnly] = useState(false);

  // ── Fetch events from API ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/calendar/events");
        if (res.ok) {
          const { data } = await res.json();
          setEvents(
            (data.events as Array<UnifiedEvent & { date: string }>).map((e) => ({
              ...e,
              date: new Date(e.date),
            }))
          );
        }
      } catch {
        // silently fail — calendar will show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // ── Build month grid ──────────────────────────────────────────────────────
  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd   = new Date(selectedYear, selectedMonth + 1, 0);

  const monthEvents = useMemo(() => {
    return events
      .filter((e) => {
        const d = e.date;
        return d >= monthStart && d <= monthEnd && (filterType === "all" || e.type === filterType);
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, selectedMonth, selectedYear, filterType]);

  // ── Week grouping (next 60 days) ─────────────────────────────────────────
  const upcomingEvents = useMemo(() => {
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() + 60);
    return events
      .filter((e) => e.date >= now && e.date <= cutoff && (filterType === "all" || e.type === filterType))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, filterType]);

  function prevMonth() {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  }
  function nextMonth() {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  }

  // ── Build calendar grid ───────────────────────────────────────────────────
  const firstDow = monthStart.getDay(); // 0=Sun
  const daysInMonth = monthEnd.getDate();

  const eventsByDay: Record<number, UnifiedEvent[]> = {};
  for (const evt of monthEvents) {
    const d = evt.date.getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d]!.push(evt);
  }

  const today = now.getDate();
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  // ── Cultural calendar data for selected month ─────────────────────────────
  const culturalMonthEvents = CULTURAL_EVENTS.filter(
    (e) => e.monthNum === culturalMonth && (!showOffOnly || e.isOffDay)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Calendar size={18} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Calendar</h1>
            <p className="text-xs text-muted-foreground">Meetings, interviews, audits, onboarding, milestones & cultural dates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("schedule")}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors", viewMode === "schedule" ? "bg-navy-900 text-white" : "text-muted-foreground hover:bg-muted")}
            >
              Schedule
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cultural")}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors", viewMode === "cultural" ? "bg-gold text-white" : "text-muted-foreground hover:bg-muted")}
            >
              Cultural Calendar
            </button>
          </div>
        </div>
      </div>

      {/* ── SCHEDULE VIEW ─────────────────────────────────────────────────── */}
      {viewMode === "schedule" && (
        <>
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <button type="button" onClick={prevMonth} aria-label="Previous month" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-semibold min-w-[130px] text-center">
                {MONTHS[selectedMonth]} {selectedYear}
              </span>
              <button type="button" onClick={nextMonth} aria-label="Next month" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedMonth(now.getMonth()); setSelectedYear(now.getFullYear()); }}
              className="text-xs text-muted-foreground hover:text-foreground border border-border px-2.5 py-1 rounded-lg transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              <Filter size={12} className="text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as EventType | "all")}
                aria-label="Filter by event type"
                className="input-base text-xs py-1 px-2 h-auto"
              >
                <option value="all">All Events</option>
                {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([k, v]) => (
              <span key={k} className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border", v.color, v.bg, v.border)}>
                <v.icon size={9} />
                {v.label}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="section-card overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold text-muted-foreground">{d}</div>
              ))}
            </div>

            {/* Grid cells */}
            <div className="grid grid-cols-7">
              {/* Empty leading cells */}
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border/50 bg-muted/10" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = eventsByDay[day] ?? [];
                const isToday = isCurrentMonth && day === today;
                const isPast = isCurrentMonth && day < today;
                return (
                  <div
                    key={day}
                    className={cn(
                      "min-h-[80px] border-b border-r border-border/50 p-1.5 transition-colors",
                      isToday && "bg-gold/5",
                      isPast && "opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1",
                      isToday ? "bg-gold text-white" : "text-muted-foreground"
                    )}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const cfg = EVENT_CONFIG[evt.type];
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={evt.id}
                            className={cn("flex items-center gap-1 text-[10px] font-medium px-1 py-0.5 rounded truncate border", cfg.color, cfg.bg, cfg.border)}
                            title={evt.title}
                          >
                            <Icon size={8} className="flex-shrink-0" />
                            <span className="truncate">{evt.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming list */}
          <div className="section-card">
            <div className="section-card-header flex items-center gap-2">
              <Clock size={14} className="text-gold" />
              <h2 className="text-sm font-semibold gradient-text-gold">Next 60 Days</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{upcomingEvents.length}</span>
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading events…</div>
            ) : upcomingEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Calendar size={24} className="text-muted-foreground/40" /></div>
                <p className="text-sm font-medium">No upcoming events</p>
                <p className="text-xs text-muted-foreground mt-1">Schedule meetings, set milestones, and add employees to see events here</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingEvents.map((evt) => {
                  const cfg = EVENT_CONFIG[evt.type];
                  const Icon = cfg.icon;
                  const dateStr = evt.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  const timeStr = evt.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                  const showTime = evt.date.getHours() !== 0 || evt.date.getMinutes() !== 0;
                  return (
                    <div key={evt.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border", cfg.bg, cfg.border)}>
                        <Icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{evt.title}</p>
                        <p className="text-xs text-muted-foreground">{evt.subtitle}</p>
                      </div>
                      {evt.meta && (
                        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", cfg.color, cfg.bg, cfg.border)}>
                          {evt.meta}
                        </span>
                      )}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-foreground">{dateStr}</p>
                        {showTime && <p className="text-[10px] text-muted-foreground">{timeStr}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CULTURAL CALENDAR VIEW ────────────────────────────────────────── */}
      {viewMode === "cultural" && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Star size={11} className="text-gold" /> Cultural observances, wellness days & WVW signature dates</span>
            <span className="flex items-center gap-1 ml-auto"><Moon size={11} className="text-blue-500" /> {CULTURAL_EVENTS.filter(e => e.isOffDay).length} off days this year</span>
          </div>

          {/* Month selector */}
          <div className="flex flex-wrap gap-1.5">
            {MONTHS.map((m, i) => {
              const mn = i + 1;
              const count = CULTURAL_EVENTS.filter((e) => e.monthNum === mn).length;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCulturalMonth(mn)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    culturalMonth === mn ? "bg-gold text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {m.slice(0, 3)}
                  {count > 0 && (
                    <span className={cn("ml-1.5 text-[10px]", culturalMonth === mn ? "text-white/80" : "text-muted-foreground")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showOffOnly}
                onChange={(e) => setShowOffOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-gold"
              />
              Off days only
            </label>
          </div>

          <div className="section-card overflow-hidden">
            <div className="section-card-header px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{MONTHS[culturalMonth - 1]}</h2>
              <span className="text-xs text-muted-foreground">{culturalMonthEvents.length} events</span>
            </div>
            {culturalMonthEvents.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No events match your filters for this month.</div>
            ) : (
              <div className="divide-y divide-border/60">
                {culturalMonthEvents.map((evt, i) => {
                  const isWvw = evt.notes?.toLowerCase().includes("non-negotiable") ||
                    evt.notes?.toLowerCase().includes("signature wvw") ||
                    evt.notes?.toLowerCase().includes("wvw core");
                  const dateLabel = evt.isVariable ? "Date varies"
                    : !evt.startDay ? MONTHS[evt.monthNum - 1]
                    : !evt.endDay ? `${MONTHS[evt.monthNum - 1]} ${evt.startDay}`
                    : `${MONTHS[evt.monthNum - 1]} ${evt.startDay} – ${evt.endMonthNum ? MONTHS[evt.endMonthNum - 1] : MONTHS[evt.monthNum - 1]} ${evt.endDay}`;
                  return (
                    <div key={i} className={cn("px-5 py-4 flex items-start gap-4", evt.isOffDay && "bg-gold/5", isWvw && "bg-purple-500/5")}>
                      <div className="w-28 flex-shrink-0 text-xs text-muted-foreground leading-relaxed pt-0.5">{dateLabel}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className={cn("text-sm font-semibold", isWvw && "text-gold")}>{evt.name}</h3>
                          {evt.priority === "HIGH" && (
                            <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded-full border border-gold/20">HIGH</span>
                          )}
                          {evt.isOffDay && (
                            <span className="flex items-center gap-0.5 text-[10px] font-medium text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                              <Moon size={9} /> {evt.offType ?? "Off Day"}
                            </span>
                          )}
                          {isWvw && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
                              <Star size={9} /> WVW Signature
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-600">{evt.category}</span>
                          <span className="text-muted-foreground">WVW Use: <span className="text-foreground/80 font-medium">{evt.wvwUseCase}</span></span>
                        </div>
                        {evt.notes && <p className="text-[11px] text-muted-foreground mt-1 italic">{evt.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* WVW Recurring */}
          <div className="section-card overflow-hidden">
            <div className="section-card-header px-5 py-3.5 flex items-center gap-2">
              <Star size={14} className="text-gold" />
              <h2 className="text-sm font-semibold">WVW Recurring Dates</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Quarterly</span>
            </div>
            <div className="divide-y divide-border/60">
              {[
                { name: "WVW Burnout Reset Week", category: "Wellness", wvwUseCase: "Consulting Offer", isOffDay: true, offType: "Internal Reset Week", notes: "Also client-facing — quarterly" },
                { name: "WVW Culture Audit Season", category: "Business", wvwUseCase: "Sales + Delivery", isOffDay: false, notes: "Revenue driver — quarterly" },
                { name: "WVW Leadership Intensive Month", category: "Leadership", wvwUseCase: "Training", isOffDay: false, notes: "Core service — quarterly" },
              ].map((evt, i) => (
                <div key={i} className="px-5 py-4 flex items-start gap-4">
                  <div className="w-28 flex-shrink-0 text-xs text-muted-foreground pt-0.5">Quarterly</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gold">{evt.name}</h3>
                      <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded-full border border-gold/20">HIGH</span>
                      {evt.isOffDay && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                          <Moon size={9} /> {evt.offType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-600">{evt.category}</span>
                      <span className="text-muted-foreground">WVW Use: <span className="text-foreground/80 font-medium">{evt.wvwUseCase}</span></span>
                    </div>
                    {evt.notes && <p className="text-[11px] text-muted-foreground mt-1 italic">{evt.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
