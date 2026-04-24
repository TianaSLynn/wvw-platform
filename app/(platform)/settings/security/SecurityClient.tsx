"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ChevronLeft, Copy, Check, Eye, EyeOff, Download, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityEntry {
  id: string; action: string; entityLabel: string | null; timestamp: Date;
  user: { firstName: string; lastName: string } | null;
  entityType: string;
}

interface Props {
  recentActivity: ActivityEntry[];
  orgId: string;
}

export default function SecurityClient({ recentActivity, orgId }: Props) {
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterAction, setFilterAction] = useState("");

  // Simulated API key — in production, store encrypted in DB/env
  const apiKey = `wvw_live_${orgId.slice(0, 8)}xxxxxxxxxxxxxxxxxxxx`;

  const copyKey = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = filterAction
    ? recentActivity.filter((a) => a.action.toLowerCase().includes(filterAction.toLowerCase()) || (a.entityLabel ?? "").toLowerCase().includes(filterAction.toLowerCase()))
    : recentActivity;

  const downloadLog = () => {
    const rows = [
      ["Timestamp", "User", "Action", "Entity Type", "Entity"],
      ...filtered.map((a) => [
        new Date(a.timestamp).toISOString(),
        a.user ? `${a.user.firstName} ${a.user.lastName}` : "System",
        a.action,
        a.entityType,
        a.entityLabel ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wvw-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatAction = (action: string) =>
    action.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" → ");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Back to Settings
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
            <Shield size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Security & Compliance</h1>
            <p className="text-xs text-muted-foreground">API access and immutable audit trail</p>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={15} className="text-gold" />
          <h2 className="font-semibold">API Key</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Use this key to authenticate requests to the WVW Intelligence REST API. Keep it secret — do not commit to version control.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl font-mono text-sm overflow-hidden">
            {showKey ? apiKey : apiKey.slice(0, 12) + "••••••••••••••••••••••"}
          </div>
          <button
            onClick={() => setShowKey((s) => !s)}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button
            onClick={copyKey}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
          </button>
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded-xl">
          Rotate your API key if you suspect it has been compromised. All existing integrations using the old key will stop working.
        </p>
      </div>

      {/* Audit Log */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-gold" />
            <h2 className="font-semibold">Immutable Audit Log</h2>
          </div>
          <button
            onClick={downloadLog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-muted transition-colors"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Every action taken in WVW Intelligence is recorded in an append-only log. This log cannot be modified or deleted.
        </p>

        <input
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          placeholder="Filter by action or entity…"
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
        />

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No activity recorded yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card border-b border-border">
                <tr>
                  {["Time", "User", "Action", "Entity"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2 px-3">
                      {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : <span className="text-muted-foreground italic">System</span>}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-mono text-foreground">{formatAction(entry.action)}</span>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground max-w-[200px] truncate">
                      {entry.entityLabel ?? entry.entityType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
