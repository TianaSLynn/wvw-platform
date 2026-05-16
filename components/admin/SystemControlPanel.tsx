"use client";

import { useState } from "react";
import {
  Shield, Database, RefreshCw, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronRight, Zap, BookOpen, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_VERSION, APP_VERSION_DATE, CHANGELOG } from "@/lib/app-version";

type HealthData = {
  status: string;
  queryTimeMs: number;
  audits: { total: number; templates: number; globalFrameworkTemplates: number };
  platform: { users: number; activeClients: number; activeIntegrations: number };
  financial: { totalRevenue: number; collectionRate: number };
};

type SeedResult = { seeded: number; skipped: number; results: Array<{ name: string; action: string }> };

export default function SystemControlPanel({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const [showChangelog, setShowChangelog] = useState(false);

  const checkHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await fetch("/api/system/health");
      if (!res.ok) throw new Error("Health check failed");
      const { data } = await res.json();
      setHealth(data);
    } catch {
      setHealthError("Could not reach health endpoint.");
    } finally {
      setHealthLoading(false);
    }
  };

  const seedTemplates = async (wvwOnly = false) => {
    setSeedLoading(true);
    setSeedError(null);
    setSeedResult(null);
    try {
      const res = await fetch("/api/admin/seed-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wvwOnly }),
      });
      if (!res.ok) throw new Error("Seed failed");
      const { data } = await res.json();
      setSeedResult(data);
    } catch {
      setSeedError("Template seed failed. Check your role permissions.");
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="section-card">
      <div className="section-card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-gold" />
          <h3 className="text-sm font-semibold">System Control</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            v{APP_VERSION}
          </span>
          <span className="text-[10px] text-muted-foreground">{APP_VERSION_DATE}</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Version + Changelog */}
        <div className="bg-gold/5 border border-gold/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">WVW Intelligence v{APP_VERSION}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Released {APP_VERSION_DATE}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowChangelog((v) => !v)}
              className="btn-ghost text-xs flex items-center gap-1"
            >
              {showChangelog ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              Changelog
            </button>
          </div>
          {showChangelog && (
            <div className="mt-4 space-y-3">
              {CHANGELOG.map((entry) => (
                <div key={entry.version} className="border-l-2 border-gold/30 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gold">v{entry.version}</span>
                    <span className="text-[10px] text-muted-foreground">{entry.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{entry.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls — SUPER_ADMIN only */}
        {isSuperAdmin && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Actions</p>

            {/* Seed templates */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <BookOpen size={16} className="text-gold mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">WVW Audit Templates</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seeds all 8 WVW Intelligence™ audit templates into the database. Safe to re-run — already-seeded templates are skipped.
                </p>
                {seedResult && (
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-green-500" />
                    <span className="text-xs text-green-600 font-medium">
                      {seedResult.seeded} seeded · {seedResult.skipped} skipped
                    </span>
                  </div>
                )}
                {seedError && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle size={12} /> {seedError}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => seedTemplates(true)}
                  disabled={seedLoading}
                  className="btn-gold text-xs flex items-center gap-1.5 whitespace-nowrap"
                >
                  {seedLoading ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                  {seedLoading ? "Seeding…" : "Seed WVW"}
                </button>
                <button
                  type="button"
                  onClick={() => seedTemplates(false)}
                  disabled={seedLoading}
                  className="btn-ghost text-xs flex items-center gap-1.5 whitespace-nowrap"
                >
                  Seed All
                </button>
              </div>
            </div>

            {/* Health check */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <Activity size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">System Health</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Checks database connectivity and entity counts across the platform.
                </p>
                {health && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { label: "DB Latency", value: `${health.queryTimeMs}ms`, ok: health.queryTimeMs < 500 },
                      { label: "Audit Templates", value: health.audits.globalFrameworkTemplates.toString(), ok: health.audits.globalFrameworkTemplates > 0 },
                      { label: "Active Clients", value: health.platform.activeClients.toString(), ok: true },
                      { label: "Collection Rate", value: `${health.financial.collectionRate}%`, ok: health.financial.collectionRate >= 80 },
                    ].map(({ label, value, ok }) => (
                      <div key={label} className={cn("rounded-lg px-3 py-2 border", ok ? "border-green-500/20 bg-green-500/5" : "border-amber-500/20 bg-amber-500/5")}>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <p className={cn("text-sm font-bold", ok ? "text-green-600" : "text-amber-600")}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {healthError && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle size={12} /> {healthError}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={checkHealth}
                disabled={healthLoading}
                className="btn-ghost text-xs flex items-center gap-1.5 flex-shrink-0"
              >
                {healthLoading ? <RefreshCw size={12} className="animate-spin" /> : <Database size={12} />}
                {healthLoading ? "Checking…" : "Run Check"}
              </button>
            </div>
          </div>
        )}

        {!isSuperAdmin && (
          <p className="text-xs text-muted-foreground text-center py-2">
            System actions are restricted to Super Admin.
          </p>
        )}
      </div>
    </div>
  );
}
