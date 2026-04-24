import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarDays, Focus, Zap, Clock, CheckCircle2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Work Week Planner" };

const WEEK_STRUCTURE = [
  { day: "Mon", theme: "Strategy Day",     type: "deep-work",  desc: "Deep work, planning, complex analysis",                icon: "🧠", protected: true  },
  { day: "Tue", theme: "Client Day",       type: "meetings",   desc: "Client calls, reviews, presentations",                icon: "👥", protected: false },
  { day: "Wed", theme: "Execution Day",    type: "deep-work",  desc: "Deep work, audit fieldwork, documentation",           icon: "⚡", protected: true  },
  { day: "Thu", theme: "Collaboration",    type: "meetings",   desc: "Team meetings, internal reviews, training",           icon: "🤝", protected: false },
  { day: "Fri", theme: "Wrap & Reflect",   type: "admin",      desc: "Admin, planning for next week, learning",             icon: "✅", protected: false },
];

const FOCUS_BLOCKS = [
  { block: "Morning Deep Work",    time: "8:30 – 11:00", desc: "Highest cognitive work — no meetings, no interruptions", icon: Focus },
  { block: "Mid-Day Comms",        time: "11:00 – 12:00", desc: "Email, Slack, and non-urgent communications",          icon: Zap },
  { block: "Afternoon Meetings",   time: "1:00 – 4:00",  desc: "Calls, reviews, and collaborative sessions",            icon: Clock },
  { block: "Wrap & Plan",          time: "4:00 – 5:00",  desc: "Process notes, update tasks, prepare tomorrow",         icon: CheckCircle2 },
];

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { start: mon, end: sun };
}

export default async function WorkWeekPage() {
  const user = await requireUser();
  const { start, end } = getWeekBounds();

  const meetings = await db.meeting.findMany({
    where: {
      orgId: user.orgId,
      scheduledAt: { gte: start, lte: end },
    },
    include: {
      client: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 20,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Work Week Planner"
        subtitle="Structure your week for sustained high performance and focus"
        icon={CalendarDays}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
      />

      {/* Weekly structure */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <CalendarDays size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recommended Weekly Structure</h2>
        </div>
        <div className="grid grid-cols-5 divide-x divide-border">
          {WEEK_STRUCTURE.map((day) => (
            <div key={day.day} className={`p-3 text-center ${day.protected ? "bg-blue-500/5" : ""}`}>
              <p className="text-xs font-bold text-muted-foreground">{day.day}</p>
              <p className="text-xl my-1">{day.icon}</p>
              <p className="text-xs font-semibold text-foreground leading-tight">{day.theme}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-tight hidden sm:block">{day.desc}</p>
              {day.protected && (
                <span className="text-xs bg-blue-500/10 text-blue-500 px-1 py-0.5 rounded mt-1 inline-block">Focus</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Focus Blocks */}
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <Focus size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Daily Focus Block Template</h2>
          </div>
          <div className="divide-y divide-border">
            {FOCUS_BLOCKS.map((block) => {
              const Icon = block.icon;
              return (
                <div key={block.block} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{block.block}</p>
                    <p className="text-xs text-muted-foreground">{block.time}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{block.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* This week's meetings */}
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <Calendar size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">This Week&apos;s Meetings</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{meetings.length}</span>
          </div>
          {meetings.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar size={22} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No meetings scheduled this week</p>
              <p className="text-xs text-muted-foreground mt-1">Schedule meetings from the Interviews or Meetings page</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {meetings.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.scheduledAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {m.client && ` · ${m.client.name}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{m.duration}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
