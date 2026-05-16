"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Umbrella, Plus, X, CheckCircle, XCircle, Clock,
  CalendarDays, Settings, Users, RefreshCw, Loader2, Sliders,
  ChevronDown, AlertCircle, Check, Pencil, Save, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type PtoType = {
  id: string; name: string; code: string; color: string; icon?: string | null;
  description?: string | null; defaultDays: number; maxCarryover?: number | null;
  requiresApproval: boolean; isPaid: boolean; isActive: boolean; sortOrder: number;
};

type Balance = {
  ptoTypeId: string;
  ptoType: { id: string; name: string; code: string; color: string; icon?: string | null };
  year: number; allocated: number; used: number; pending: number; carryover: number; remaining: number;
  balanceId: string | null;
};

type PtoRequest = {
  id: string; userId: string; status: string;
  startDate: string; endDate: string; days: number; note?: string | null;
  ptoType: { id: string; name: string; code: string; color: string; icon?: string | null };
  user: { id: string; firstName: string; lastName: string; title?: string | null; department?: string | null };
  reviewedBy?: { firstName: string; lastName: string } | null;
  reviewNote?: string | null; reviewedAt?: string | null;
  createdAt: string;
};

type UserBalance = {
  user: { id: string; firstName: string; lastName: string; title?: string | null; department?: string | null };
  balances: Balance[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Check }> = {
  PENDING:   { label: "Pending",   color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/20",   icon: Clock },
  APPROVED:  { label: "Approved",  color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
  DENIED:    { label: "Denied",    color: "text-red-600",     bg: "bg-red-500/10 border-red-500/20",        icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "text-slate-500",   bg: "bg-slate-500/10 border-slate-500/20",    icon: XCircle },
};

const DEFAULT_STATUS = STATUS_CONFIG["PENDING"]!;

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function BalanceBar({ used, pending, allocated, carryover }: { used: number; pending: number; allocated: number; carryover: number }) {
  const total = allocated + carryover;
  if (total === 0) return null;
  const usedPct    = Math.min((used    / total) * 100, 100);
  const pendingPct = Math.min((pending / total) * 100, 100 - usedPct);
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
      <div className="h-full bg-red-400 transition-all"    style={{ width: `${usedPct}%` }} />
      <div className="h-full bg-amber-400 transition-all" style={{ width: `${pendingPct}%` }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PtoPage() {
  // Current user role fetched with balance (we'll infer from response shape)
  const [tab, setTab]         = useState<"my" | "team" | "types" | "balances">("my");
  const [year, setYear]       = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // My PTO
  const [myBalances, setMyBalances]   = useState<Balance[]>([]);
  const [myRequests, setMyRequests]   = useState<PtoRequest[]>([]);
  const [ptoTypes, setPtoTypes]       = useState<PtoType[]>([]);

  // Team / admin
  const [allRequests, setAllRequests] = useState<PtoRequest[]>([]);
  const [allBalances, setAllBalances] = useState<UserBalance[]>([]);

  // New request form
  const [requesting, setRequesting]   = useState(false);
  const [reqForm, setReqForm]         = useState({ ptoTypeId: "", startDate: "", endDate: "", note: "" });
  const [reqError, setReqError]       = useState("");
  const [submitting, setSubmitting]   = useState(false);

  // Type management
  const [editingType, setEditingType] = useState<PtoType | null>(null);
  const [savingType, setSavingType]   = useState(false);
  const [typeError, setTypeError]     = useState("");
  const [seeding, setSeeding]         = useState(false);

  // Balance adjustment
  const [adjusting, setAdjusting]     = useState<{ userId: string; ptoTypeId: string; userName: string; typeName: string; current: number } | null>(null);
  const [adjustDays, setAdjustDays]   = useState("");
  const [adjustNote, setAdjustNote]   = useState<"allocated" | "carryover">("allocated");
  const [savingAdj, setSavingAdj]     = useState(false);

  // Action feedback
  const [actionId, setActionId]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, myBalRes, myReqRes] = await Promise.all([
        fetch("/api/workforce/pto/types"),
        fetch(`/api/workforce/pto/balance?year=${year}`),
        fetch("/api/workforce/pto/requests"),
      ]);
      if (typesRes.ok)  setPtoTypes((await typesRes.json()).data ?? []);
      if (myBalRes.ok)  setMyBalances((await myBalRes.json()).data ?? []);
      if (myReqRes.ok) {
        const data = (await myReqRes.json()).data ?? [];
        // Admin sees all, regular user sees own
        if (Array.isArray(data) && data.length > 0 && data[0]?.user) {
          setMyRequests(data.filter((r: PtoRequest) => true)); // filled below after admin check
          setAllRequests(data);
        } else {
          setMyRequests(data);
        }
      }

      // Try to load admin data
      const adminBalRes = await fetch(`/api/workforce/pto/balance?userId=all&year=${year}`);
      if (adminBalRes.ok) {
        const d = (await adminBalRes.json()).data;
        if (Array.isArray(d) && d.length > 0 && d[0]?.user) {
          setAllBalances(d);
          setIsSuperAdmin(true);
        }
      }
    } finally { setLoading(false); }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  // Separate my requests from all when admin
  const displayMyRequests = isSuperAdmin
    ? allRequests.filter((r) => {
        // We don't have current user's id here easily, show pending for "my" view
        return true; // show all for super admin "my" tab
      })
    : myRequests;

  const pendingRequests = allRequests.filter((r) => r.status === "PENDING");

  async function submitRequest() {
    if (!reqForm.ptoTypeId || !reqForm.startDate || !reqForm.endDate) {
      setReqError("Fill in all required fields"); return;
    }
    setSubmitting(true); setReqError("");
    try {
      const res = await fetch("/api/workforce/pto/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqForm),
      });
      if (res.ok) {
        setRequesting(false);
        setReqForm({ ptoTypeId: "", startDate: "", endDate: "", note: "" });
        await load();
      } else {
        const d = await res.json().catch(() => ({}));
        setReqError((d as { error?: string }).error ?? "Failed to submit request");
      }
    } finally { setSubmitting(false); }
  }

  async function actionRequest(id: string, action: "approve" | "deny" | "cancel", reviewNote?: string) {
    setActionId(id);
    try {
      await fetch(`/api/workforce/pto/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote }),
      });
      await load();
    } finally { setActionId(null); }
  }

  async function saveType() {
    if (!editingType) return;
    setSavingType(true); setTypeError("");
    try {
      const method = editingType.id === "new" ? "POST" : "PUT";
      const res = await fetch("/api/workforce/pto/types", {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingType),
      });
      if (res.ok) { setEditingType(null); await load(); }
      else {
        const d = await res.json().catch(() => ({}));
        setTypeError((d as { error?: string }).error ?? "Save failed");
      }
    } finally { setSavingType(false); }
  }

  async function seedDefaults() {
    setSeeding(true);
    try {
      const res = await fetch("/api/workforce/pto/types", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedDefaults: true }),
      });
      if (res.ok) await load();
    } finally { setSeeding(false); }
  }

  async function saveBalance() {
    if (!adjusting) return;
    setSavingAdj(true);
    try {
      await fetch("/api/workforce/pto/balance", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adjusting.userId, ptoTypeId: adjusting.ptoTypeId, year,
          [adjustNote]: parseFloat(adjustDays),
        }),
      });
      setAdjusting(null); setAdjustDays("");
      await load();
    } finally { setSavingAdj(false); }
  }

  const totalRemaining  = myBalances.reduce((n, b) => n + b.remaining, 0);
  const totalAllocated  = myBalances.reduce((n, b) => n + b.allocated + b.carryover, 0);
  const totalUsed       = myBalances.reduce((n, b) => n + b.used, 0);
  const pendingDays     = myBalances.reduce((n, b) => n + b.pending, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <Link href="/workforce" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Workforce
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Umbrella size={18} className="text-sky-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">PTO & Time Off</h1>
              <p className="text-xs text-muted-foreground">Request time off, track balances, and manage team PTO</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Select year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="input-base text-sm py-1.5"
            >
              {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" aria-label="Refresh">
              <RefreshCw size={14} className="text-muted-foreground" />
            </button>
            <button type="button" onClick={() => setRequesting(true)} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <Plus size={14} /> Request PTO
            </button>
          </div>
        </div>
      </div>

      {/* Top-level balance summary */}
      {!loading && myBalances.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Remaining",  value: totalRemaining,  color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Total Allocated",  value: totalAllocated,  color: "text-blue-600",    bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "Used This Year",   value: totalUsed,       color: "text-slate-600",   bg: "bg-muted border-border" },
            { label: "Pending Approval", value: pendingDays,     color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/20" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn("section-card p-4 border", bg)}>
              <p className={cn("text-2xl font-bold", color)}>{value}<span className="text-sm font-normal ml-1">days</span></p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: "my",       label: "My PTO",          icon: Umbrella },
          ...(isSuperAdmin || allRequests.some((r) => r.status === "PENDING") ? [
            { key: "team", label: `Team Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}`, icon: Users },
          ] : []),
          ...(isSuperAdmin ? [
            { key: "balances", label: "Team Balances", icon: Sliders },
            { key: "types",    label: "PTO Types",     icon: Settings },
          ] : []),
        ] as Array<{ key: string; label: string; icon: typeof Umbrella }>).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as typeof tab)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              tab === key
                ? "border-gold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="section-card p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Loading PTO data…
        </div>
      ) : (
        <>
          {/* ── My PTO Tab ─────────────────────────────────────────────────── */}
          {tab === "my" && (
            <div className="space-y-5">
              {/* Balance cards */}
              {myBalances.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Umbrella size={28} className="text-muted-foreground/40" /></div>
                  <p className="text-sm font-medium">No PTO types configured</p>
                  {isSuperAdmin && (
                    <button type="button" onClick={seedDefaults} disabled={seeding} className="btn-primary mt-4 text-sm px-4 py-2 flex items-center gap-1.5 mx-auto">
                      {seeding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Seed WVW Default Types
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myBalances.map((b) => {
                    const pct = b.allocated + b.carryover > 0
                      ? Math.round(((b.used + b.pending) / (b.allocated + b.carryover)) * 100)
                      : 0;
                    return (
                      <div key={b.ptoTypeId} className="section-card p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {b.ptoType.icon && <span className="text-lg">{b.ptoType.icon}</span>}
                            <div>
                              <p className="text-sm font-semibold">{b.ptoType.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{b.ptoType.code}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold" style={{ color: b.ptoType.color }}>{b.remaining}</p>
                            <p className="text-[10px] text-muted-foreground">of {b.allocated + b.carryover} days</p>
                          </div>
                        </div>
                        <BalanceBar used={b.used} pending={b.pending} allocated={b.allocated} carryover={b.carryover} />
                        <div className="grid grid-cols-3 gap-1 text-center">
                          {[
                            { label: "Used",    val: b.used,      c: "text-red-500" },
                            { label: "Pending", val: b.pending,   c: "text-amber-500" },
                            { label: "Left",    val: b.remaining, c: "text-emerald-600 font-semibold" },
                          ].map(({ label, val, c }) => (
                            <div key={label} className="bg-muted/50 rounded-lg py-1">
                              <p className={cn("text-xs font-medium", c)}>{val}d</p>
                              <p className="text-[9px] text-muted-foreground">{label}</p>
                            </div>
                          ))}
                        </div>
                        {b.carryover > 0 && (
                          <p className="text-[10px] text-blue-600 text-center">+{b.carryover}d carried over from {year - 1}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setReqForm((f) => ({ ...f, ptoTypeId: b.ptoTypeId }));
                            setRequesting(true);
                          }}
                          className="w-full py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          Request {b.ptoType.name}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* My request history */}
              <div className="section-card overflow-hidden">
                <div className="section-card-header flex items-center justify-between">
                  <h3 className="text-sm font-semibold">My Request History</h3>
                </div>
                {myRequests.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No requests yet this year</div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {myRequests.map((r) => {
                      const cfg = STATUS_CONFIG[r.status] ?? DEFAULT_STATUS;
                      const Icon = cfg.icon;
                      return (
                        <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                          <span className="text-lg">{r.ptoType.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{r.ptoType.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDate(r.startDate)}{r.days > 1 ? ` – ${fmtDate(r.endDate)}` : ""} · {r.days} day{r.days !== 1 ? "s" : ""}
                            </p>
                            {r.note && <p className="text-[11px] text-muted-foreground italic mt-0.5">{r.note}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {r.status === "PENDING" && (
                              <button
                                type="button"
                                disabled={actionId === r.id}
                                onClick={() => actionRequest(r.id, "cancel")}
                                className="text-[10px] text-red-500 hover:underline"
                              >
                                Cancel
                              </button>
                            )}
                            <span className={cn("flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full border", cfg.color, cfg.bg)}>
                              <Icon size={9} /> {cfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Team Requests Tab ──────────────────────────────────────────── */}
          {tab === "team" && (
            <div className="section-card overflow-hidden">
              <div className="section-card-header flex items-center gap-3">
                <h3 className="text-sm font-semibold">All PTO Requests</h3>
                {pendingRequests.length > 0 && (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {pendingRequests.length} pending
                  </span>
                )}
              </div>
              {allRequests.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No requests found</div>
              ) : (
                <div className="divide-y divide-border/60">
                  {allRequests.map((r) => {
                    const cfg = STATUS_CONFIG[r.status] ?? DEFAULT_STATUS;
                    const StatusIcon = cfg.icon;
                    const isActioning = actionId === r.id;
                    return (
                      <div key={r.id} className={cn("flex items-start gap-3 px-4 py-3 transition-colors", r.status === "PENDING" && "bg-amber-500/5")}>
                        <span className="text-lg mt-0.5">{r.ptoType.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{r.user.firstName} {r.user.lastName}</p>
                            {r.user.title && <p className="text-[10px] text-muted-foreground">{r.user.title}</p>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {r.ptoType.name} · {fmtDate(r.startDate)}{r.days > 1 ? ` – ${fmtDate(r.endDate)}` : ""} · {r.days} day{r.days !== 1 ? "s" : ""}
                          </p>
                          {r.note && <p className="text-[11px] text-muted-foreground italic mt-0.5">&ldquo;{r.note}&rdquo;</p>}
                          {r.reviewNote && <p className="text-[11px] text-blue-600 mt-0.5">Note: {r.reviewNote}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {r.status === "PENDING" && isSuperAdmin && (
                            <>
                              <button
                                type="button" disabled={isActioning}
                                onClick={() => actionRequest(r.id, "approve")}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                              >
                                {isActioning ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Approve
                              </button>
                              <button
                                type="button" disabled={isActioning}
                                onClick={() => actionRequest(r.id, "deny")}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              >
                                <X size={10} /> Deny
                              </button>
                            </>
                          )}
                          <span className={cn("flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full border", cfg.color, cfg.bg)}>
                            <StatusIcon size={9} /> {cfg.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Team Balances Tab (SUPER_ADMIN) ───────────────────────────── */}
          {tab === "balances" && isSuperAdmin && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs text-blue-700">
                <Info size={13} /> You are the only one who can adjust employee PTO allocations.
              </div>
              {allBalances.map(({ user, balances }) => (
                <div key={user.id} className="section-card overflow-hidden">
                  <div className="section-card-header flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                      {user.title && <p className="text-[10px] text-muted-foreground">{user.title}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground">{balances.reduce((n, b) => n + b.remaining, 0)} days remaining total</p>
                  </div>
                  <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {balances.map((b) => (
                      <button
                        key={b.ptoTypeId}
                        type="button"
                        onClick={() => {
                          setAdjusting({ userId: user.id, ptoTypeId: b.ptoTypeId, userName: `${user.firstName} ${user.lastName}`, typeName: b.ptoType.name, current: b.allocated });
                          setAdjustDays(String(b.allocated));
                          setAdjustNote("allocated");
                        }}
                        className="p-2.5 rounded-lg border border-border hover:border-gold/40 hover:bg-gold/5 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{b.ptoType.icon}</span>
                          <Pencil size={9} className="text-muted-foreground/40 group-hover:text-gold transition-colors" />
                        </div>
                        <p className="text-xs font-medium truncate">{b.ptoType.name}</p>
                        <p className="text-[10px] text-muted-foreground">{b.remaining}/{b.allocated + b.carryover}d left</p>
                        <BalanceBar used={b.used} pending={b.pending} allocated={b.allocated} carryover={b.carryover} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PTO Types Tab (SUPER_ADMIN) ───────────────────────────────── */}
          {tab === "types" && isSuperAdmin && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={seedDefaults} disabled={seeding}
                  className="btn-ghost flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border rounded-lg">
                  {seeding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Seed WVW Defaults
                </button>
                <button type="button"
                  onClick={() => setEditingType({ id: "new", name: "", code: "", color: "#6B8F71", icon: "", defaultDays: 0, requiresApproval: true, isPaid: true, isActive: true, sortOrder: ptoTypes.length })}
                  className="btn-primary flex items-center gap-1.5 text-sm px-3 py-1.5">
                  <Plus size={12} /> New PTO Type
                </button>
              </div>

              {ptoTypes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Umbrella size={28} className="text-muted-foreground/40" /></div>
                  <p className="text-sm font-medium">No PTO types yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Seed WVW defaults or create custom types</p>
                </div>
              ) : (
                <div className="section-card overflow-hidden">
                  <div className="section-card-header">
                    <h3 className="text-sm font-semibold">PTO Types ({ptoTypes.length})</h3>
                  </div>
                  <div className="divide-y divide-border/60">
                    {ptoTypes.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                        <span className="text-xl">{t.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{t.name}</p>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t.code}</span>
                            {!t.isActive && <span className="text-[9px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Inactive</span>}
                          </div>
                          {t.description && <p className="text-[11px] text-muted-foreground">{t.description}</p>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                          <span className="font-medium text-foreground">{t.defaultDays}d</span>
                          <span>{t.requiresApproval ? "Approval req." : "Auto-approved"}</span>
                          <span>{t.isPaid ? "Paid" : "Unpaid"}</span>
                          <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: t.color }} />
                        </div>
                        <button type="button" onClick={() => setEditingType(t)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Edit type">
                          <Pencil size={13} className="text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Request PTO Modal ───────────────────────────────────────────────── */}
      {requesting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">Request Time Off</h2>
              <button type="button" onClick={() => { setRequesting(false); setReqError(""); }} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">PTO Type *</label>
                <select aria-label="PTO Type" className="input-base w-full" value={reqForm.ptoTypeId} onChange={(e) => setReqForm((f) => ({ ...f, ptoTypeId: e.target.value }))}>
                  <option value="">Select type…</option>
                  {ptoTypes.map((t) => {
                    const bal = myBalances.find((b) => b.ptoTypeId === t.id);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.name} {bal ? `(${bal.remaining}d remaining)` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date *</label>
                  <input type="date" aria-label="Start date" className="input-base w-full" value={reqForm.startDate} onChange={(e) => setReqForm((f) => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date *</label>
                  <input type="date" aria-label="End date" className="input-base w-full" value={reqForm.endDate} min={reqForm.startDate} onChange={(e) => setReqForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              {reqForm.ptoTypeId && ptoTypes.find((t) => t.id === reqForm.ptoTypeId) && (
                <div className="flex items-start gap-2 p-2.5 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  <Info size={12} className="mt-0.5 flex-shrink-0" />
                  {ptoTypes.find((t) => t.id === reqForm.ptoTypeId)!.requiresApproval
                    ? "This type requires manager approval before it is confirmed."
                    : "This type is auto-approved — no manager review needed."}
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Note <span className="text-muted-foreground/60">(optional)</span></label>
                <textarea className="input-base w-full" rows={2} value={reqForm.note} onChange={(e) => setReqForm((f) => ({ ...f, note: e.target.value }))} placeholder="Any context for your manager…" />
              </div>
              {reqError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                  <AlertCircle size={12} /> {reqError}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => { setRequesting(false); setReqError(""); }} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={submitRequest} disabled={submitting} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
                {submitting ? <><Loader2 size={13} className="animate-spin" /> Submitting…</> : <><CalendarDays size={13} /> Submit Request</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Balance Adjust Modal (SUPER_ADMIN) ──────────────────────────────── */}
      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold">Adjust PTO Balance</h2>
                <p className="text-xs text-muted-foreground">{adjusting.userName} · {adjusting.typeName} · {year}</p>
              </div>
              <button type="button" onClick={() => setAdjusting(null)} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Field to adjust</label>
                <div className="flex gap-2">
                  {(["allocated", "carryover"] as const).map((f) => (
                    <button key={f} type="button" onClick={() => setAdjustNote(f)}
                      className={cn("flex-1 py-2 text-xs font-medium rounded-lg border transition-all",
                        adjustNote === f ? "bg-gold/10 border-gold/30 text-gold" : "border-border text-muted-foreground hover:bg-muted")}>
                      {f === "allocated" ? "Allocated Days" : "Carryover Days"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">New value (days)</label>
                <input type="number" step="0.5" min="0" className="input-base w-full" value={adjustDays} onChange={(e) => setAdjustDays(e.target.value)} aria-label="Days" />
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-700">
                <AlertCircle size={12} /> This will immediately update the employee&apos;s balance. Current allocated: {adjusting.current}d.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => setAdjusting(null)} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={saveBalance} disabled={savingAdj} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
                {savingAdj ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit PTO Type Modal (SUPER_ADMIN) ───────────────────────────────── */}
      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">{editingType.id === "new" ? "New PTO Type" : `Edit: ${editingType.name}`}</h2>
              <button type="button" onClick={() => { setEditingType(null); setTypeError(""); }} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                  <input className="input-base w-full" value={editingType.name} onChange={(e) => setEditingType((t) => t ? ({ ...t, name: e.target.value }) : t)} placeholder="e.g. Vacation" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Code *</label>
                  <input className="input-base w-full uppercase" value={editingType.code} onChange={(e) => setEditingType((t) => t ? ({ ...t, code: e.target.value.toUpperCase() }) : t)} placeholder="VAC" maxLength={6} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Emoji / Icon</label>
                  <input className="input-base w-full" value={editingType.icon ?? ""} onChange={(e) => setEditingType((t) => t ? ({ ...t, icon: e.target.value }) : t)} placeholder="🌴" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={editingType.color} onChange={(e) => setEditingType((t) => t ? ({ ...t, color: e.target.value }) : t)} className="w-10 h-9 rounded cursor-pointer border border-border" aria-label="Color picker" />
                    <input className="input-base flex-1" value={editingType.color} onChange={(e) => setEditingType((t) => t ? ({ ...t, color: e.target.value }) : t)} />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <input className="input-base w-full" value={editingType.description ?? ""} onChange={(e) => setEditingType((t) => t ? ({ ...t, description: e.target.value }) : t)} placeholder="Brief description shown to employees" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Default Days / Year</label>
                  <input type="number" step="0.5" min="0" className="input-base w-full" value={editingType.defaultDays} onChange={(e) => setEditingType((t) => t ? ({ ...t, defaultDays: parseFloat(e.target.value) }) : t)} aria-label="Default days" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Carryover (blank = unlimited)</label>
                  <input type="number" step="0.5" min="0" className="input-base w-full" value={editingType.maxCarryover ?? ""} onChange={(e) => setEditingType((t) => t ? ({ ...t, maxCarryover: e.target.value === "" ? null : parseFloat(e.target.value) }) : t)} placeholder="Unlimited" aria-label="Max carryover" />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={editingType.requiresApproval} onChange={(e) => setEditingType((t) => t ? ({ ...t, requiresApproval: e.target.checked }) : t)} className="accent-gold w-4 h-4" />
                  Requires approval
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={editingType.isPaid} onChange={(e) => setEditingType((t) => t ? ({ ...t, isPaid: e.target.checked }) : t)} className="accent-gold w-4 h-4" />
                  Paid leave
                </label>
                {editingType.id !== "new" && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={editingType.isActive} onChange={(e) => setEditingType((t) => t ? ({ ...t, isActive: e.target.checked }) : t)} className="accent-gold w-4 h-4" />
                    Active
                  </label>
                )}
              </div>
              {typeError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                  <AlertCircle size={12} /> {typeError}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => { setEditingType(null); setTypeError(""); }} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={saveType} disabled={savingType} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
                {savingType ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save Type</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
