"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, AlertCircle, Clock, RefreshCw,
  TrendingUp, Shield, Zap, Code2, Globe, Scale,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatusItem {
  label: string;
  done: boolean;
  critical: boolean;
  category: "features" | "infrastructure" | "legal" | "quality" | "production";
  note?: string;
}

export interface CategoryScore {
  name: string;
  icon: string;
  done: number;
  total: number;
  weight: number;
  color: string;
}

export interface AppStatusData {
  items: StatusItem[];
  categories: CategoryScore[];
  overallScore: number;
  grade: string;
  gradeColor: string;
  dbStats: { clients: number; audits: number; users: number; orgs: number };
  lastChecked: string;
  daysToLaunch: number;
}

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string }> = {
  features:       { icon: Zap,     color: "text-blue-400" },
  infrastructure: { icon: Shield,  color: "text-purple-400" },
  legal:          { icon: Scale,   color: "text-amber-400" },
  quality:        { icon: Code2,   color: "text-green-400" },
  production:     { icon: Globe,   color: "text-gold" },
};

function GradeRing({ score, grade, gradeColor }: { score: number; grade: string; gradeColor: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/5" />
        <circle
          cx="72" cy="72" r={r} fill="none"
          stroke="url(#gradeGrad)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.23,1,0.32,1)" }}
        />
        <defs>
          <linearGradient id="gradeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C9A84C" />
            <stop offset="100%" stopColor="#6B8F71" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center relative">
        <p className={cn("text-4xl font-black tracking-tight", gradeColor)}>{grade}</p>
        <p className="text-xs text-white/40 font-semibold mt-0.5">{score}/100</p>
      </div>
    </div>
  );
}

function CategoryBar({ cat }: { cat: CategoryScore }) {
  const pct = Math.round((cat.done / cat.total) * 100);
  const meta = CATEGORY_META[cat.color] ?? CATEGORY_META["features"]!;
  const Icon = meta.icon;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={13} className={cat.color} />
          <span className="text-xs font-medium text-white/70">{cat.name}</span>
        </div>
        <span className="text-xs font-bold text-white/50">{cat.done}/{cat.total}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: pct >= 80 ? "#6B8F71" : pct >= 60 ? "#C9A84C" : pct >= 40 ? "#d97706" : "#ef4444",
          }}
        />
      </div>
      <p className="text-[10px] text-white/30 text-right">{pct}%</p>
    </div>
  );
}

function StatusRow({ item }: { item: StatusItem }) {
  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-2.5 rounded-lg transition-colors",
      item.done ? "opacity-80" : "bg-white/2",
    )}>
      <div className="mt-0.5 flex-shrink-0">
        {item.done ? (
          <CheckCircle2 size={14} className="text-green-500" />
        ) : item.critical ? (
          <XCircle size={14} className="text-red-500" />
        ) : (
          <AlertCircle size={14} className="text-amber-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-medium", item.done ? "text-white/50 line-through" : item.critical ? "text-red-300" : "text-white/80")}>
          {item.label}
        </p>
        {item.note && !item.done && (
          <p className="text-[10px] text-white/30 mt-0.5">{item.note}</p>
        )}
      </div>
      {item.critical && !item.done && (
        <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
          BLOCKING
        </span>
      )}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function AppStatusClient({ data }: { data: AppStatusData }) {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => router.refresh(), 60_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [router]);

  const done  = data.items.filter((i) => i.done).length;
  const total = data.items.length;
  const pct   = Math.round((done / total) * 100);

  const byCategory = (cat: StatusItem["category"]) => data.items.filter((i) => i.category === cat);
  const pending = data.items.filter((i) => !i.done);
  const critical = pending.filter((i) => i.critical);
  const nonCritical = pending.filter((i) => !i.critical);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-scale">

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            App <span className="gradient-text-gold">Status Board</span>
          </h1>
          <p className="text-xs text-white/40 mt-1">
            WVW Intelligence Platform · auto-refreshes every 60s
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <RefreshCw size={11} className="animate-spin-slow" />
          Last checked {data.lastChecked}
        </div>
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {/* Grade ring */}
        <div className="section-card bg-navy-900/80 border-white/8 p-6 flex flex-col items-center justify-center gap-3">
          <GradeRing score={data.overallScore} grade={data.grade} gradeColor={data.gradeColor} />
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Overall Grade</p>
        </div>

        {/* Progress */}
        <div className="section-card bg-navy-900/80 border-white/8 p-6 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Completion</p>
          <div>
            <p className="text-5xl font-black text-white tabular-nums">{pct}<span className="text-2xl text-white/30">%</span></p>
            <p className="text-xs text-white/40 mt-1">{done} of {total} items done</p>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-3">
            <div className="h-full rounded-full bg-gradient-to-r from-gold to-sage transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Days to launch */}
        <div className="section-card bg-navy-900/80 border-white/8 p-6 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Est. Days to Launch</p>
          <div>
            <p className="text-5xl font-black gradient-text-gold tabular-nums">{data.daysToLaunch}</p>
            <p className="text-xs text-white/40 mt-1">with active development</p>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <Clock size={11} className="text-gold/60" />
            <p className="text-[10px] text-white/30">Estimated: ~2–3 weeks total</p>
          </div>
        </div>

        {/* DB live stats */}
        <div className="section-card bg-navy-900/80 border-white/8 p-6 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Live DB Snapshot</p>
          <div className="space-y-2 mt-2">
            {[
              { label: "Clients",  val: data.dbStats.clients },
              { label: "Audits",   val: data.dbStats.audits },
              { label: "Users",    val: data.dbStats.users },
              { label: "Orgs",     val: data.dbStats.orgs },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] text-white/40">{label}</span>
                <span className="text-sm font-bold text-white/80 tabular-nums">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body: categories + checklist */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: category bars + timeline */}
        <div className="space-y-5">

          {/* Category breakdown */}
          <div className="section-card bg-navy-900/80 border-white/8">
            <div className="section-card-header border-white/8">
              <div className="flex items-center gap-2">
                <TrendingUp size={13} className="text-gold" />
                <h2 className="text-sm font-semibold text-white">Progress by Category</h2>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {data.categories.map((cat) => (
                <CategoryBar key={cat.name} cat={cat} />
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="section-card bg-navy-900/80 border-white/8">
            <div className="section-card-header border-white/8">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-gold" />
                <h2 className="text-sm font-semibold text-white">Launch Timeline</h2>
              </div>
            </div>
            <div className="p-4">
              <ol className="space-y-3">
                {TIMELINE.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border text-[9px] font-bold",
                      step.done
                        ? "bg-green-500/20 border-green-500/40 text-green-400"
                        : step.active
                        ? "bg-gold/20 border-gold/40 text-gold"
                        : "bg-white/5 border-white/10 text-white/20"
                    )}>
                      {step.done ? "✓" : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-xs font-semibold",
                        step.done ? "text-white/30 line-through" : step.active ? "text-gold" : "text-white/50"
                      )}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-white/25 mt-0.5">{step.eta}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Right: checklists */}
        <div className="xl:col-span-2 space-y-5">

          {/* Blocking items */}
          {critical.length > 0 && (
            <div className="section-card bg-red-950/30 border-red-500/20">
              <div className="section-card-header border-red-500/15">
                <div className="flex items-center gap-2">
                  <XCircle size={13} className="text-red-400" />
                  <h2 className="text-sm font-semibold text-red-300">Blocking — Must Fix Before Launch</h2>
                </div>
                <span className="text-xs font-bold text-red-400">{critical.length} items</span>
              </div>
              <div className="py-2">
                {critical.map((item, i) => <StatusRow key={i} item={item} />)}
              </div>
            </div>
          )}

          {/* Remaining work */}
          {nonCritical.length > 0 && (
            <div className="section-card bg-navy-900/80 border-white/8">
              <div className="section-card-header border-white/8">
                <div className="flex items-center gap-2">
                  <AlertCircle size={13} className="text-amber-400" />
                  <h2 className="text-sm font-semibold text-white">Remaining Work</h2>
                </div>
                <span className="text-xs font-bold text-amber-400">{nonCritical.length} items</span>
              </div>
              <div className="py-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                {nonCritical.map((item, i) => <StatusRow key={i} item={item} />)}
              </div>
            </div>
          )}

          {/* Completed */}
          <div className="section-card bg-navy-900/80 border-white/8">
            <div className="section-card-header border-white/8">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-green-500" />
                <h2 className="text-sm font-semibold text-white">Completed</h2>
              </div>
              <span className="text-xs font-bold text-green-500">{done} items</span>
            </div>
            <div className="py-2 grid grid-cols-1 md:grid-cols-2 gap-1 max-h-80 overflow-y-auto">
              {data.items.filter((i) => i.done).map((item, i) => <StatusRow key={i} item={item} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Static timeline data ─────────────────────────────────────────────────────

const TIMELINE = [
  { label: "Idea validation & planning",        eta: "Completed",               done: true,  active: false },
  { label: "UI/UX design & branding",           eta: "Completed",               done: true,  active: false },
  { label: "Core feature development",          eta: "~80% complete",           done: false, active: true },
  { label: "Fix TypeScript errors + stubs",     eta: "Est. 1–2 days",           done: false, active: true },
  { label: "Wire remaining env vars + email",   eta: "Est. 1–2 days",           done: false, active: false },
  { label: "Add Privacy Policy & Terms pages",  eta: "Est. < 1 day",            done: false, active: false },
  { label: "End-to-end QA & beta testing",      eta: "Est. 3–5 days",           done: false, active: false },
  { label: "Production domain + Vercel config", eta: "Est. 1 day",              done: false, active: false },
  { label: "Soft launch (invite-only)",         eta: "Est. ~10 days from now",  done: false, active: false },
  { label: "Public launch",                     eta: "Est. ~14–21 days from now",done: false, active: false },
];
