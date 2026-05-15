"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar, Flag, ClipboardList, AlertCircle, Video, Users, Briefcase,
  UserCheck, CalendarDays, Star, Moon, ChevronLeft, ChevronRight,
  Clock, Gift, TrendingUp, Umbrella, X, ExternalLink, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | "audit_start" | "audit_end"
  | "milestone"
  | "task"
  | "meeting"
  | "interview"
  | "onboarding"
  | "invoice_due"
  | "cultural"
  | "holiday"
  | "birthday"
  | "promotion"
  | "pto";

type DetailItem = { label: string; value: string };

type UnifiedEvent = {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  type: EventType;
  link?: string;
  meta?: string;
  description?: string;
  details?: DetailItem[];
  isOffDay?: boolean;
  offType?: string;
};

// ─── WVW Cultural events injected client-side for current/visible month ───────
// (These are also returned by the API, but we keep them here for the detail panel)

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
  invoice_due:  { label: "Invoice",    color: "text-rose-600",    bg: "bg-rose-500/10",    border: "border-rose-500/30",    icon: Briefcase },
  cultural:     { label: "Cultural",   color: "text-purple-600",  bg: "bg-purple-500/10",  border: "border-purple-500/30",  icon: CalendarDays },
  holiday:      { label: "Holiday",    color: "text-indigo-600",  bg: "bg-indigo-500/10",  border: "border-indigo-500/30",  icon: Star },
  birthday:     { label: "Birthday",   color: "text-pink-600",    bg: "bg-pink-500/10",    border: "border-pink-500/30",    icon: Gift },
  promotion:    { label: "Promotion",  color: "text-yellow-700",  bg: "bg-yellow-50",      border: "border-yellow-300",     icon: TrendingUp },
  pto:          { label: "PTO",        color: "text-teal-600",    bg: "bg-teal-500/10",    border: "border-teal-500/30",    icon: Umbrella },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventDetailModal({ event, onClose }: { event: UnifiedEvent; onClose: () => void }) {
  const cfg = EVENT_CONFIG[event.type];
  const Icon = cfg.icon;
  const dateStr = event.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeStr = event.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const showTime = event.date.getHours() !== 0 || event.date.getMinutes() !== 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn("px-5 py-4 border-b border-border flex items-start gap-3", cfg.bg)}>
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5", cfg.bg, cfg.border)}>
            <Icon size={16} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border", cfg.color, cfg.bg, cfg.border)}>
                {cfg.label}
              </span>
              {event.isOffDay && event.offType && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                  <Moon size={9} /> {event.offType}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-foreground leading-snug">{event.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{event.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors flex-shrink-0" aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border flex items-center gap-2 text-sm">
          <Calendar size={13} className="text-muted-foreground flex-shrink-0" />
          <span className="font-medium">{dateStr}</span>
          {showTime && <span className="text-muted-foreground">· {timeStr}</span>}
        </div>

        {(event.details?.length ?? 0) > 0 && (
          <div className="px-5 py-4 space-y-2.5">
            {event.details!.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xs text-muted-foreground w-28 flex-shrink-0 pt-0.5">{item.label}</span>
                <span className="text-xs font-medium text-foreground flex-1">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {event.description && (
          <div className="px-5 pb-4">
            <p className="text-xs text-muted-foreground italic">{event.description}</p>
          </div>
        )}

        {event.link && (
          <div className="px-5 py-3 border-t border-border bg-muted/30">
            <Link href={event.link} className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-gold transition-colors" onClick={onClose}>
              <ExternalLink size={12} /> View in platform
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Day Detail Panel (shown when clicking a date number) ────────────────────

function DayPanel({ day, month, year, events, onClose, onSelectEvent }: {
  day: number; month: number; year: number;
  events: UnifiedEvent[];
  onClose: () => void;
  onSelectEvent: (e: UnifiedEvent) => void;
}) {
  const date = new Date(year, month, day);
  const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const culturalForDay = CULTURAL_EVENTS.filter(e => e.startDay && e.monthNum === (month + 1) && day >= e.startDay && (e.endDay ? day <= e.endDay : day === e.startDay));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-fade-in-scale max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{dateStr}</p>
            <p className="text-sm font-bold">{events.length + culturalForDay.length} event{events.length + culturalForDay.length !== 1 ? "s" : ""}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Close"><X size={14} /></button>
        </div>
        <div className="overflow-y-auto divide-y divide-border">
          {culturalForDay.map((ce, i) => {
            const isWvw = ce.notes?.toLowerCase().includes("non-negotiable") || ce.notes?.toLowerCase().includes("signature wvw") || ce.notes?.toLowerCase().includes("wvw core");
            return (
              <div key={i} className={cn("px-4 py-3 flex items-start gap-3", ce.isOffDay && "bg-blue-500/5")}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/10 border border-purple-500/20 flex-shrink-0">
                  <CalendarDays size={13} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-semibold truncate", isWvw ? "text-gold" : "text-foreground")}>{ce.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded-full">{ce.category}</span>
                    {ce.isOffDay && <span className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-full"><Moon size={8} /> {ce.offType}</span>}
                    {isWvw && <span className="text-[10px] text-gold font-bold">★ WVW</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {events.map(evt => {
            const cfg = EVENT_CONFIG[evt.type];
            const Icon = cfg.icon;
            const timeStr = evt.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            const showTime = evt.date.getHours() !== 0 || evt.date.getMinutes() !== 0;
            return (
              <button key={evt.id} type="button" onClick={() => { onClose(); onSelectEvent(evt); }} className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/40 transition-colors text-left">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border", cfg.bg, cfg.border)}>
                  <Icon size={13} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{evt.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{evt.subtitle}</p>
                  {showTime && <p className="text-[10px] text-muted-foreground">{timeStr}</p>}
                </div>
              </button>
            );
          })}
          {events.length === 0 && culturalForDay.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No events this day</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Calendar ────────────────────────────────────────────────────────────

export default function UnifiedCalendarPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showOffOnly, setShowOffOnly] = useState(false);
  const [showCultural, setShowCultural] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const from = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
        const to = new Date(selectedYear, selectedMonth + 2, 0).toISOString();
        const res = await fetch(`/api/calendar/events?from=${from}&to=${to}`);
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
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [selectedMonth, selectedYear]);

  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd   = new Date(selectedYear, selectedMonth + 1, 0);

  const monthEvents = useMemo(() => {
    return events
      .filter((e) => {
        const d = e.date;
        return d >= monthStart && d <= monthEnd
          && (filterType === "all" || e.type === filterType)
          && (!showOffOnly || e.isOffDay);
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, selectedMonth, selectedYear, filterType, showOffOnly]);

  const upcomingEvents = useMemo(() => {
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() + 60);
    return events
      .filter((e) => e.date >= now && e.date <= cutoff
        && (filterType === "all" || e.type === filterType)
        && (!showOffOnly || e.isOffDay))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, filterType, showOffOnly]);

  function prevMonth() {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  }
  function nextMonth() {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  }

  const firstDow = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const eventsByDay: Record<number, UnifiedEvent[]> = {};
  for (const evt of monthEvents) {
    const d = evt.date.getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d]!.push(evt);
  }

  // Cultural events for this month (for grid markers)
  const culturalForMonth = useMemo(() => {
    if (!showCultural) return {};
    const out: Record<number, CulturalEvent[]> = {};
    for (const ce of CULTURAL_EVENTS) {
      if (ce.monthNum !== selectedMonth + 1) continue;
      if (!ce.startDay) continue;
      const startD = ce.startDay;
      const endD = ce.endDay && !ce.endMonthNum ? ce.endDay : ce.startDay;
      for (let d = startD; d <= Math.min(endD, daysInMonth); d++) {
        if (!out[d]) out[d] = [];
        out[d]!.push(ce);
      }
    }
    return out;
  }, [selectedMonth, daysInMonth, showCultural]);

  const offDaySet = useMemo(() => {
    const s = new Set<number>();
    for (const evt of monthEvents) { if (evt.isOffDay) s.add(evt.date.getDate()); }
    for (const [day, ces] of Object.entries(culturalForMonth)) {
      if (ces.some(ce => ce.isOffDay)) s.add(Number(day));
    }
    return s;
  }, [monthEvents, culturalForMonth]);

  const today = now.getDate();
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const totalOffDays = CULTURAL_EVENTS.filter(e => e.isOffDay).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {selectedDay !== null && (
        <DayPanel
          day={selectedDay} month={selectedMonth} year={selectedYear}
          events={eventsByDay[selectedDay] ?? []}
          onClose={() => setSelectedDay(null)}
          onSelectEvent={(e) => { setSelectedDay(null); setSelectedEvent(e); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Calendar size={18} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Calendar</h1>
            <p className="text-xs text-muted-foreground">All events, holidays, birthdays, cultural dates & WVW observances</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Moon size={11} className="text-blue-500" /> {totalOffDays} WVW off days/year
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button type="button" onClick={prevMonth} aria-label="Previous month" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold min-w-[130px] text-center">{MONTHS[selectedMonth]} {selectedYear}</span>
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
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showCultural} onChange={e => setShowCultural(e.target.checked)} className="w-3.5 h-3.5 rounded accent-gold" />
            <CalendarDays size={11} /> Cultural events
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showOffOnly} onChange={e => setShowOffOnly(e.target.checked)} className="w-3.5 h-3.5 rounded accent-gold" />
            <Moon size={11} /> Off days only
          </label>
          <div className="flex items-center gap-1.5">
            <Filter size={11} className="text-muted-foreground" />
            <select value={filterType} onChange={e => setFilterType(e.target.value as EventType | "all")} aria-label="Filter by event type" className="input-base text-xs py-1 px-2 h-auto">
              <option value="all">All Types</option>
              {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([k, v]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilterType(f => f === k ? "all" : k)}
            className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-opacity", v.color, v.bg, v.border, filterType !== "all" && filterType !== k && "opacity-30")}
          >
            <v.icon size={9} />
            {v.label}
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="section-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-border/50 bg-muted/10" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = eventsByDay[day] ?? [];
            const dayCultural = culturalForMonth[day] ?? [];
            const isToday = isCurrentMonth && day === today;
            const isPast = isCurrentMonth && day < today;
            const isOff = offDaySet.has(day);
            const hasWvwSignature = dayCultural.some(ce =>
              ce.notes?.toLowerCase().includes("non-negotiable") ||
              ce.notes?.toLowerCase().includes("signature wvw") ||
              ce.notes?.toLowerCase().includes("wvw core")
            );
            const allDayItems = [...dayCultural.map(ce => ({ id: `cultural-${ce.name}`, isCultural: true, ce })), ...dayEvents.map(e => ({ id: e.id, isCultural: false, evt: e }))];
            const showCount = 3;
            return (
              <div
                key={day}
                className={cn(
                  "min-h-[90px] border-b border-r border-border/50 p-1 transition-colors",
                  isToday && "bg-gold/5",
                  isPast && "opacity-60",
                  isOff && !isToday && "bg-blue-500/5",
                  hasWvwSignature && "ring-1 ring-inset ring-purple-500/20"
                )}
              >
                {/* Day number — click to open day panel */}
                <button
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className="flex items-center gap-1 mb-0.5 w-full group"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                    isToday ? "bg-gold text-white" : "text-muted-foreground group-hover:bg-muted"
                  )}>
                    {day}
                  </div>
                  {isOff && <Moon size={8} className="text-blue-400" />}
                  {hasWvwSignature && <Star size={8} className="text-gold" />}
                </button>

                <div className="space-y-0.5">
                  {/* Cultural events first (compact) */}
                  {showCultural && dayCultural.slice(0, showCount).map((ce, ci) => (
                    <button
                      key={ci}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className="w-full flex items-center gap-1 text-[10px] font-medium px-1 py-0.5 rounded truncate border text-left hover:opacity-80 transition-opacity text-purple-600 bg-purple-500/10 border-purple-500/30"
                      title={ce.name}
                    >
                      <CalendarDays size={8} className="flex-shrink-0" />
                      <span className="truncate">{ce.name}</span>
                    </button>
                  ))}

                  {/* Other events */}
                  {dayEvents.slice(0, Math.max(0, showCount - (showCultural ? Math.min(dayCultural.length, showCount) : 0))).map((evt) => {
                    const cfg = EVENT_CONFIG[evt.type];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => setSelectedEvent(evt)}
                        className={cn("w-full flex items-center gap-1 text-[10px] font-medium px-1 py-0.5 rounded truncate border text-left hover:opacity-80 transition-opacity cursor-pointer", cfg.color, cfg.bg, cfg.border)}
                        title={evt.title}
                      >
                        <Icon size={8} className="flex-shrink-0" />
                        <span className="truncate">{evt.title}</span>
                      </button>
                    );
                  })}

                  {/* +more count */}
                  {allDayItems.length > showCount && (
                    <button type="button" onClick={() => setSelectedDay(day)} className="text-[9px] text-muted-foreground px-1 hover:text-foreground transition-colors">
                      +{allDayItems.length - showCount} more
                    </button>
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
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => setSelectedEvent(evt)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border", cfg.bg, cfg.border)}>
                    <Icon size={14} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{evt.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{evt.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {evt.isOffDay && evt.offType && (
                      <span className="hidden sm:flex items-center gap-0.5 text-[10px] font-medium text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                        <Moon size={8} /> {evt.offType}
                      </span>
                    )}
                    {evt.meta && (
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", cfg.color, cfg.bg, cfg.border)}>
                        {evt.meta}
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">{dateStr}</p>
                      {showTime && <p className="text-[10px] text-muted-foreground">{timeStr}</p>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* WVW Signature Dates sidebar callout */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <Star size={14} className="text-gold" />
          <h2 className="text-sm font-semibold">WVW Recurring Quarterly Events</h2>
        </div>
        <div className="divide-y divide-border/60">
          {[
            { name: "WVW Burnout Reset Week", category: "Wellness", wvwUseCase: "Consulting Offer", isOffDay: true, offType: "Internal Reset Week", notes: "Also client-facing — quarterly" },
            { name: "WVW Culture Audit Season", category: "Business", wvwUseCase: "Sales + Delivery", isOffDay: false, notes: "Revenue driver — quarterly" },
            { name: "WVW Leadership Intensive Month", category: "Leadership", wvwUseCase: "Training", isOffDay: false, notes: "Core service — quarterly" },
          ].map((evt, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                <Star size={12} className="text-gold" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-xs font-semibold text-gold">{evt.name}</p>
                  {evt.isOffDay && (
                    <span className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                      <Moon size={8} /> {evt.offType}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{evt.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
