"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FolderOpen, File, Link2, Camera, FileText, Search,
  Shield, Download, ExternalLink, Filter, Hash, Globe, Plus, X, Loader2,
} from "lucide-react";

const TYPE_ICON: Record<string, React.ElementType> = {
  FILE:         File,
  LINK:         Link2,
  SCREENSHOT:   Camera,
  NOTE:         FileText,
  API_SNAPSHOT: Hash,
  OBSERVATION:  FileText,
};
const TYPE_COLOR: Record<string, string> = {
  FILE:         "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  LINK:         "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
  SCREENSHOT:   "text-green-500 bg-green-50 dark:bg-green-950/30",
  NOTE:         "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
  API_SNAPSHOT: "text-gray-500 bg-gray-50 dark:bg-gray-900/50",
  OBSERVATION:  "text-orange-500 bg-orange-50 dark:bg-orange-950/30",
};

function formatBytes(b: number) {
  if (b === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface EvidenceItem {
  id: string; type: string; title: string; description: string | null;
  fileUrl: string | null; fileName: string | null; fileSize: number | null;
  externalUrl: string | null; sha256Hash: string | null; tags: string[];
  collectedAt: Date; createdAt: Date;
  audit: { id: string; name: string; code: string | null; client: { name: string } };
  uploadedBy: { firstName: string; lastName: string } | null;
  finding: { findingNumber: string | null; title: string } | null;
}

interface Props {
  evidence: EvidenceItem[];
  audits: Array<{ id: string; name: string; code: string | null }>;
  stats: { total: number; files: number; links: number; screenshots: number; notes: number; totalBytes: number; hashed: number };
}

const TYPES = ["ALL", "FILE", "LINK", "SCREENSHOT", "NOTE", "API_SNAPSHOT", "OBSERVATION"];

export default function EvidenceVaultClient({ evidence, audits, stats }: Props) {
  const [search, setSearch]         = useState("");
  const [typeFilter, setType]       = useState("ALL");
  const [auditFilter, setAudit]     = useState("ALL");
  const [showCapture, setCapture]   = useState(false);
  const [captureUrl, setCaptureUrl] = useState("");
  const [captureAudit, setCaptureAudit] = useState(audits[0]?.id ?? "");
  const [capturing, setCapturing]   = useState(false);
  const [captureMsg, setCaptureMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleCapture() {
    if (!captureUrl || !captureAudit) return;
    setCapturing(true);
    setCaptureMsg(null);
    try {
      const res = await fetch("/api/evidence/capture-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: captureUrl, auditId: captureAudit }),
      });
      if (res.ok) {
        setCaptureMsg({ ok: true, text: "URL captured — reload to see it." });
        setCaptureUrl("");
        setCapture(false);
      } else {
        const d = await res.json() as { error?: string };
        setCaptureMsg({ ok: false, text: d.error ?? "Capture failed" });
      }
    } catch {
      setCaptureMsg({ ok: false, text: "Network error" });
    } finally {
      setCapturing(false);
    }
  }

  const filtered = useMemo(() => {
    return evidence.filter((e) => {
      if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
      if (auditFilter !== "ALL" && e.audit.id !== auditFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.description ?? "").toLowerCase().includes(q) ||
          e.audit.name.toLowerCase().includes(q) ||
          e.audit.client.name.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [evidence, typeFilter, auditFilter, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center flex-shrink-0">
            <FolderOpen size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Evidence Vault</h1>
            <p className="text-muted-foreground text-sm">{stats.total} items · {formatBytes(stats.totalBytes)} · {stats.hashed} verified</p>
          </div>
        </div>
        <button
          onClick={() => setCapture(!showCapture)}
          className="btn-primary flex-shrink-0"
        >
          <Globe size={14} />
          Capture URL
        </button>
      </div>

      {/* URL Capture Panel */}
      {showCapture && (
        <div className="section-card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-gold" />
              <h3 className="font-semibold text-sm">Capture URL as Evidence</h3>
            </div>
            <button onClick={() => setCapture(false)} className="btn-ghost p-1.5 rounded-md">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">URL to capture</label>
              <input
                value={captureUrl}
                onChange={(e) => setCaptureUrl(e.target.value)}
                placeholder="https://example.com/policy-document"
                className="input-base"
                type="url"
                onKeyDown={(e) => e.key === "Enter" && handleCapture()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Link to audit</label>
              <select
                value={captureAudit}
                onChange={(e) => setCaptureAudit(e.target.value)}
                className="input-base"
              >
                {audits.map((a) => (
                  <option key={a.id} value={a.id}>{a.code ? `${a.code} · ` : ""}{a.name}</option>
                ))}
              </select>
            </div>
            {captureMsg && (
              <p className={cn("text-xs px-3 py-2 rounded-lg", captureMsg.ok ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                {captureMsg.text}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCapture}
                disabled={!captureUrl || !captureAudit || capturing}
                className="btn-gold text-xs px-4 py-2"
              >
                {capturing ? <><Loader2 size={12} className="animate-spin" /> Capturing…</> : <><Plus size={12} /> Capture</>}
              </button>
              <button onClick={() => setCapture(false)} className="btn-ghost text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Files",        value: stats.files,       color: "text-blue-500" },
          { label: "Links",        value: stats.links,       color: "text-purple-500" },
          { label: "Screenshots",  value: stats.screenshots, color: "text-green-500" },
          { label: "Notes",        value: stats.notes,       color: "text-amber-500" },
          { label: "Verified",     value: `${stats.hashed}/${stats.total}`, color: "text-gold" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search evidence…"
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-muted-foreground" />
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                typeFilter === t
                  ? "bg-navy-900 text-white border-navy-700"
                  : "border-border text-muted-foreground hover:border-gold/30"
              )}
            >
              {t === "ALL" ? "All Types" : t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ")}
            </button>
          ))}
        </div>
        <select
          value={auditFilter}
          onChange={(e) => setAudit(e.target.value)}
          className="px-3 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        >
          <option value="ALL">All Audits</option>
          {audits.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
        </select>
      </div>

      {/* Evidence grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <FolderOpen size={28} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No evidence found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or upload evidence from within an audit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const Icon = TYPE_ICON[item.type] ?? File;
            const typeColor = TYPE_COLOR[item.type] ?? "text-gray-500 bg-gray-50";
            return (
              <div key={item.id} className="bg-card border border-border rounded-2xl p-4 hover:border-gold/20 transition-colors group space-y-3">
                {/* Top */}
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", typeColor.split(" ").slice(1).join(" "))}>
                    <Icon size={16} className={typeColor.split(" ")[0]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.audit.client.name} · {item.audit.code}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.fileUrl && (
                      <a href={item.fileUrl} download={item.fileName ?? undefined} className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
                        <Download size={11} className="text-muted-foreground" />
                      </a>
                    )}
                    {item.externalUrl && (
                      <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
                        <ExternalLink size={11} className="text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                )}

                {/* Finding link */}
                {item.finding && (
                  <Link
                    href={`/audits/${item.audit.id}?tab=findings`}
                    className="flex items-center gap-1.5 text-xs text-gold hover:underline"
                  >
                    <Shield size={11} />
                    F-{String(item.finding.findingNumber).padStart(3, "0")} · {item.finding.title}
                  </Link>
                )}

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">+{item.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    {item.sha256Hash && <Shield size={10} className="text-green-500" aria-label="Integrity verified" />}
                    {item.fileSize && <span>{formatBytes(item.fileSize)}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.uploadedBy && <span>{item.uploadedBy.firstName} {item.uploadedBy.lastName[0]}.</span>}
                    <span>{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
