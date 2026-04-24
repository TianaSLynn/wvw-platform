"use client";

import { useState, useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, cn, severityColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CheckCircle2, Circle, AlertTriangle, ChevronDown, ChevronRight,
  Plus, FileText, Users, Shield, ClipboardList, TrendingUp,
  ArrowRight, CheckSquare, Eye, Send, Copy, ExternalLink, BarChart3,
  Upload, Link2, StickyNote, X, Download, Cloud,
} from "lucide-react";
import { MS365FilePicker } from "@/components/ui/MS365FilePicker";

type ChecklistItem = {
  id: string; question: string; guidance: string | null;
  response: string | null; notes: string | null;
  isCompleted: boolean; riskWeight: number; isRequired: boolean;
  evidenceRequired: boolean; sortOrder: number;
  evidence: Array<{ id: string; title: string; type: string }>;
};

type Section = {
  id: string; title: string; description: string | null;
  completionPct: number; checklistItems: ChecklistItem[];
};

type Finding = {
  id: string; findingNumber: string | null; title: string;
  severity: string; status: string; category: string | null;
  riskScore: number | null; dueDate: Date | null;
  assignee: { id: string; firstName: string; lastName: string } | null;
  remediationActions: Array<{ id: string; status: string }>;
  _count: { evidence: number };
};

type Audit = {
  id: string; name: string; code: string | null; status: string;
  type: string; scope: string | null; description: string | null;
  overallRiskScore: number | null;
  client: { id: string; name: string };
  project: { id: string; name: string } | null;
  members: Array<{ role: string; user: { id: string; firstName: string; lastName: string; title: string | null } }>;
  sections: Section[];
  findings: Finding[];
  evidence: Array<{ id: string; title: string; type: string; createdAt: Date; uploadedBy: { firstName: string; lastName: string } | null }>;
  frameworks: Array<{ framework: { name: string; type: string } }>;
  planningStartDate: Date | null; fieldworkStartDate: Date | null;
  fieldworkEndDate: Date | null; reportDueDate: Date | null;
};

interface Props {
  audit: Audit;
  overallPct: number;
  totalItems: number;
  completedItems: number;
  findingsBySeverity: Record<string, number>;
  currentUserId: string;
  initialTab?: "checklist" | "findings" | "evidence" | "team" | "overview";
}

type Tab = "checklist" | "findings" | "evidence" | "team" | "overview" | "survey" | "results";

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", PLANNING: "Planning", FIELDWORK: "Fieldwork",
  REVIEW: "In Review", REPORTING: "Reporting", COMPLETED: "Completed", ARCHIVED: "Archived",
};
const STATUS_VARIANT: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  DRAFT: "secondary", PLANNING: "default", FIELDWORK: "default",
  REVIEW: "warning", REPORTING: "warning", COMPLETED: "success", ARCHIVED: "secondary",
};
const RESPONSE_COLORS: Record<string, string> = {
  yes: "text-green-500", no: "text-red-500", partial: "text-amber-500", "n/a": "text-muted-foreground",
};

export default function AuditDetailClient({
  audit, overallPct, totalItems, completedItems, findingsBySeverity, currentUserId, initialTab,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "checklist");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(audit.sections.slice(0, 2).map((s) => s.id))
  );
  const [sections, setSections] = useState(audit.sections);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const respondToItem = async (
    sectionId: string, itemId: string,
    response: string, notes?: string
  ) => {
    const isLikertResponse = ["1","2","3","4","5"].includes(response);
    const isCompleted = isLikertResponse ? true : response === "yes";

    // Optimistic update
    setSections((prev) =>
      prev.map((s) => s.id !== sectionId ? s : {
        ...s,
        checklistItems: s.checklistItems.map((item) =>
          item.id !== itemId ? item : { ...item, response, notes: notes ?? item.notes, isCompleted }
        ),
        completionPct: (() => {
          const items = s.checklistItems.map((i) => i.id === itemId ? { ...i, isCompleted } : i);
          return items.length > 0 ? Math.round((items.filter((i) => i.isCompleted).length / items.length) * 100) : 0;
        })(),
      })
    );

    await fetch(`/api/audits/${audit.id}/checklist-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response, notes, isCompleted }),
    });

    startTransition(() => router.refresh());
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview",  label: "Overview" },
    { id: "checklist", label: "Checklist", count: totalItems },
    { id: "findings",  label: "Findings",  count: audit.findings.length },
    { id: "evidence",  label: "Evidence",  count: audit.evidence.length },
    { id: "team",      label: "Team",      count: audit.members.length },
    { id: "survey",    label: "Survey Distribution" },
    { id: "results",   label: "Results & Insights" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-foreground text-background text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <CheckCircle2 size={13} className="text-green-400" />
          {toast}
        </div>
      )}
      {/* Header */}
      <PageHeader
        title={audit.name}
        subtitle={`${audit.client.name}${audit.code ? ` · ${audit.code}` : ""}${audit.type ? ` · ${audit.type.replace("_", " ")}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[audit.status] ?? "secondary"}>
              {STATUS_LABELS[audit.status] ?? audit.status}
            </Badge>
            <Link
              href={`/audits/${audit.id}/findings/new`}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-navy-900 text-white hover:bg-navy-800 transition-colors"
            >
              <Plus size={13} /> Add Finding
            </Link>
          </div>
        }
      />

      {/* Progress bar + risk summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Overall progress */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Audit Progress</p>
            <span className="text-2xl font-bold">{overallPct}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                overallPct >= 80 ? "bg-green-500" : overallPct >= 40 ? "bg-gold" : "bg-blue-500"
              )}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{completedItems} of {totalItems} items complete</p>
        </div>

        {/* Findings by severity */}
        {SEVERITY_ORDER.slice(0, 4).map((sev) => {
          const count = findingsBySeverity[sev] ?? 0;
          const colors: Record<string, string> = {
            CRITICAL: "text-red-500 border-red-500/20 bg-red-500/5",
            HIGH: "text-orange-500 border-orange-500/20 bg-orange-500/5",
            MEDIUM: "text-amber-500 border-amber-500/20 bg-amber-500/5",
            LOW: "text-blue-500 border-blue-500/20 bg-blue-500/5",
          };
          return (
            <div key={sev} className={cn("bg-card rounded-xl border p-4 shadow-card", colors[sev])}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1">{sev}</p>
              <p className="text-3xl font-bold">{count}</p>
              <p className="text-xs opacity-60 mt-0.5">finding{count !== 1 ? "s" : ""}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5",
                tab === t.id ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-slide-in-right">
        {tab === "overview" && <OverviewTab audit={audit} />}
        {tab === "checklist" && (
          <ChecklistTab sections={sections} auditId={audit.id} onRespond={respondToItem} />
        )}
        {tab === "findings"  && <FindingsTab findings={audit.findings} auditId={audit.id} />}
        {tab === "evidence"  && <EvidenceTab evidence={audit.evidence} auditId={audit.id} />}
        {tab === "team"      && <TeamTab members={audit.members} />}
        {tab === "survey"    && <SurveyDistributionTab auditId={audit.id} auditName={audit.name} onScored={() => { showToast("Scores computed — switching to Results tab."); setTab("results"); }} />}
        {tab === "results"   && <ResultsTab auditId={audit.id} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ audit }: { audit: Audit }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {audit.scope && (
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Shield size={14} className="text-gold" /> Scope</h3>
            <p className="text-sm text-muted-foreground">{audit.scope}</p>
          </div>
        )}
        {audit.description && (
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="font-semibold text-sm mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{audit.description}</p>
          </div>
        )}
        {audit.frameworks.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="font-semibold text-sm mb-3">Compliance Frameworks</h3>
            <div className="flex flex-wrap gap-2">
              {audit.frameworks.map((f, i) => (
                <Badge key={i} variant="gold">{f.framework.name}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-semibold text-sm mb-3">Timeline</h3>
          <dl className="space-y-2 text-sm">
            {[
              { label: "Planning Start", value: audit.planningStartDate },
              { label: "Fieldwork Start", value: audit.fieldworkStartDate },
              { label: "Fieldwork End", value: audit.fieldworkEndDate },
              { label: "Report Due", value: audit.reportDueDate },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value ? formatDate(value) : "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

// ─── Checklist Tab ────────────────────────────────────────────────────────────
function ChecklistTab({
  sections, auditId, onRespond,
}: {
  sections: Section[];
  auditId: string;
  onRespond: (sectionId: string, itemId: string, response: string, notes?: string) => void;
}) {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.slice(0, 2).map((s) => s.id))
  );

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const completedCount = section.checklistItems.filter((i) => i.isCompleted).length;
        return (
          <div key={section.id} className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => setExpandedSections((prev) => {
                const next = new Set(prev);
                next.has(section.id) ? next.delete(section.id) : next.add(section.id);
                return next;
              })}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                <div className="text-left">
                  <p className="font-semibold text-sm">{section.title}</p>
                  {section.description && <p className="text-xs text-muted-foreground">{section.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{completedCount}/{section.checklistItems.length}</span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", section.completionPct >= 80 ? "bg-green-500" : "bg-gold")}
                    style={{ width: `${section.completionPct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold w-10 text-right">{Math.round(section.completionPct)}%</span>
              </div>
            </button>

            {/* Items */}
            {isExpanded && (
              <div className="border-t border-border divide-y divide-border">
                {section.checklistItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    isActive={activeItem === item.id}
                    onToggle={() => setActiveItem(activeItem === item.id ? null : item.id)}
                    onRespond={(response, notes) => {
                      onRespond(section.id, item.id, response, notes);
                      setActiveItem(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Detects WVW Likert questions from the guidance metadata string
function isLikertItem(guidance: string | null): boolean {
  return !!guidance && guidance.includes("scale:1-5");
}

// Parse human-readable hint from WVW guidance string
function parseGuidanceHint(guidance: string | null): string | null {
  if (!guidance) return null;
  if (!guidance.includes("code:")) return guidance;
  const riskMatch = guidance.match(/risk:([^\s|]+)/);
  const reverseMatch = guidance.includes("reverse:true");
  const parts: string[] = [];
  if (riskMatch?.[1]) parts.push(`Risk area: ${riskMatch[1].replace(/-/g, " ")}`);
  if (reverseMatch) parts.push("Reverse-scored — lower scores indicate stronger risk");
  return parts.length > 0 ? parts.join(" · ") : null;
}

const LIKERT_LABELS: Record<string, string> = {
  "1": "Strongly Disagree",
  "2": "Disagree",
  "3": "Neutral",
  "4": "Agree",
  "5": "Strongly Agree",
};

const LIKERT_COLORS: Record<string, string> = {
  "1": "bg-red-500/15 text-red-500 border-red-500/30",
  "2": "bg-orange-500/15 text-orange-500 border-orange-500/30",
  "3": "bg-amber-500/15 text-amber-500 border-amber-500/30",
  "4": "bg-blue-500/15 text-blue-500 border-blue-500/30",
  "5": "bg-green-500/15 text-green-500 border-green-500/30",
};

function ChecklistItemRow({
  item, isActive, onToggle, onRespond,
}: {
  item: ChecklistItem;
  isActive: boolean;
  onToggle: () => void;
  onRespond: (response: string, notes?: string) => void;
}) {
  const [notes, setNotes] = useState(item.notes ?? "");
  const isLikert = isLikertItem(item.guidance);

  return (
    <div className={cn("transition-colors", isActive ? "bg-muted/30" : "hover:bg-muted/10")}>
      <div className="flex items-start gap-3 px-5 py-3">
        {/* Completion icon */}
        <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
          {item.isCompleted
            ? <CheckCircle2 size={18} className="text-green-500" />
            : <Circle size={18} className="text-muted-foreground" />}
        </button>

        {/* Question */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm", item.isCompleted ? "text-muted-foreground line-through" : "text-foreground")}>
            {item.question}
            {item.isRequired && <span className="text-red-400 ml-1">*</span>}
          </p>
          {item.response && (
            <span className={cn("text-xs font-semibold capitalize", LIKERT_COLORS[item.response] ?? RESPONSE_COLORS[item.response])}>
              {["1","2","3","4","5"].includes(item.response)
                ? `${item.response}/5 — ${LIKERT_LABELS[item.response]}`
                : `→ ${item.response}`}
            </span>
          )}
          {item.notes && !isActive && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.notes}</p>
          )}
          {item.evidence.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <FileText size={10} className="text-blue-400" />
              <span className="text-[10px] text-blue-400">{item.evidence.length} evidence</span>
            </div>
          )}
        </div>

        {/* Risk weight */}
        {item.riskWeight > 1 && (
          <div className="flex-shrink-0">
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
              ×{item.riskWeight.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Expanded response area */}
      {isActive && (
        <div className="px-5 pb-4 ml-9 space-y-3">
          {(() => {
            const hint = parseGuidanceHint(item.guidance);
            return hint ? (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
                💡 {hint}
              </p>
            ) : null;
          })()}

          {/* Response buttons — Likert 1–5 for WVW survey items, yes/no/partial/n/a for standard */}
          {isLikert ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Rate 1–5</p>
              <div className="flex items-center gap-2 flex-wrap">
                {(["1","2","3","4","5"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => onRespond(r, notes || undefined)}
                    className={cn(
                      "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-semibold border transition-colors min-w-[60px]",
                      item.response === r
                        ? LIKERT_COLORS[r]
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    )}
                  >
                    <span className="text-base font-bold">{r}</span>
                    <span className="text-[9px] leading-tight text-center mt-0.5">{LIKERT_LABELS[r]}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {(["yes","no","partial","n/a"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => onRespond(r, notes || undefined)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize",
                    item.response === r
                      ? {
                          yes: "bg-green-500/15 text-green-500 border-green-500/30",
                          no: "bg-red-500/15 text-red-500 border-red-500/30",
                          partial: "bg-amber-500/15 text-amber-500 border-amber-500/30",
                          "n/a": "bg-muted text-muted-foreground border-border",
                        }[r]
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  {r === "n/a" ? "N/A" : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes... (optional)"
            rows={2}
            className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-gold"
          />

          {item.response && (
            <button
              onClick={() => onRespond(item.response as never, notes || undefined)}
              className="text-xs text-gold hover:underline"
            >
              Save notes
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Findings Tab ─────────────────────────────────────────────────────────────
function FindingsTab({ findings, auditId }: { findings: Finding[]; auditId: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link href={`/audits/${auditId}/findings/new`}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-navy-900 text-white hover:bg-navy-800 transition-colors"
        >
          <Plus size={13} /> Add Finding
        </Link>
      </div>

      {findings.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CheckSquare size={28} className="text-green-500 mx-auto mb-2" />
          <p className="font-semibold">No findings yet</p>
          <p className="text-sm text-muted-foreground">Create a finding to track issues discovered during this audit</p>
        </div>
      ) : (
        findings.map((f) => (
          <div key={f.id} className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {f.findingNumber && <span className="text-xs font-mono text-muted-foreground">{f.findingNumber}</span>}
                  <span className={cn("badge text-xs font-semibold", severityColor(f.severity))}>
                    {f.severity}
                  </span>
                  <Badge variant={f.status === "OPEN" ? "destructive" : f.status === "REMEDIATED" ? "success" : "warning"} size="sm">
                    {f.status.replace("_", " ")}
                  </Badge>
                  {f.category && <span className="text-xs text-muted-foreground">{f.category}</span>}
                </div>
                <p className="font-semibold text-sm">{f.title}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {f.assignee && <span>→ {f.assignee.firstName} {f.assignee.lastName}</span>}
                  {f.dueDate && <span>Due {formatDate(f.dueDate)}</span>}
                  <span>{f._count.evidence} evidence</span>
                  <span>{f.remediationActions.length} actions</span>
                </div>
              </div>
              {f.riskScore !== null && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Risk</p>
                  <p className={cn("text-xl font-bold", f.riskScore >= 75 ? "text-red-500" : f.riskScore >= 50 ? "text-orange-500" : "text-amber-500")}>
                    {f.riskScore.toFixed(0)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Evidence Tab ─────────────────────────────────────────────────────────────
type EvidenceItem = Audit["evidence"][number];

function EvidenceTab({ evidence: initialEvidence, auditId }: { evidence: EvidenceItem[]; auditId: string }) {
  const [evidence, setEvidence] = useState(initialEvidence);
  const [mode, setMode] = useState<"list" | "file" | "note" | "link">("list");
  const [showMS365Picker, setShowMS365Picker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const TYPE_ICONS: Record<string, string> = {
    FILE: "📄", NOTE: "📝", SCREENSHOT: "🖼️", API_SNAPSHOT: "🔌",
    INTERVIEW: "🎤", OBSERVATION: "👁️", SYSTEM_EXPORT: "💾", LINK: "🔗",
  };

  const reset = () => {
    setMode("list");
    setTitle(""); setDescription(""); setNoteContent(""); setExternalUrl("");
    setSelectedFile(null); setUploadError(null);
  };

  const submitFile = async () => {
    if (!title.trim()) { setUploadError("Title is required"); return; }
    setUploading(true); setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("auditId", auditId);
      fd.append("title", title.trim());
      fd.append("type", selectedFile ? "FILE" : "NOTE");
      if (description) fd.append("description", description);
      if (selectedFile) fd.append("file", selectedFile);
      if (noteContent) fd.append("noteContent", noteContent);

      const res = await fetch("/api/evidence/upload", { method: "POST", body: fd });
      if (!res.ok) { const j = await res.json() as { error?: string }; throw new Error(j.error ?? "Upload failed"); }
      const { data } = await res.json() as { data: EvidenceItem };
      setEvidence((prev) => [data, ...prev]);
      reset();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submitLink = async () => {
    if (!externalUrl.trim()) { setUploadError("URL is required"); return; }
    setUploading(true); setUploadError(null);
    try {
      const res = await fetch("/api/evidence/capture-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, url: externalUrl.trim(), title: title.trim() || externalUrl }),
      });
      if (!res.ok) throw new Error("Failed to save link");
      const { data } = await res.json() as { data: EvidenceItem };
      setEvidence((prev) => [data, ...prev]);
      reset();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed");
    } finally {
      setUploading(false);
    }
  };

  if (mode !== "list") {
    return (
      <div className="max-w-lg">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-sm">
              {mode === "file" ? "Upload File" : mode === "note" ? "Add Note" : "Add Link"}
            </h3>
            <button type="button" onClick={reset} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <label htmlFor="ev-title" className="sr-only">Title</label>
            <input
              id="ev-title"
              type="text"
              placeholder="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-base w-full"
            />
            {mode === "file" && (
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
                  selectedFile ? "border-gold/50 bg-gold/5" : "border-border hover:border-muted-foreground/40"
                )}
                onClick={() => document.getElementById("ev-file-input")?.click()}
              >
                <input
                  id="ev-file-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  accept="*/*"
                />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to select a file (max 50MB)</p>
                  </>
                )}
              </div>
            )}
            {mode === "note" && (
              <textarea
                placeholder="Note content…"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={5}
                className="input-base w-full resize-none"
              />
            )}
            {mode === "link" && (
              <input
                type="url"
                placeholder="https://…"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="input-base w-full font-mono text-sm"
              />
            )}
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-base w-full"
            />
          </div>

          {uploadError && (
            <p className="text-xs text-red-500 mt-3 flex items-center gap-1">
              <AlertTriangle size={12} /> {uploadError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 mt-5">
            <button onClick={reset} className="btn-ghost text-sm">Cancel</button>
            <button
              onClick={mode === "link" ? submitLink : submitFile}
              disabled={uploading}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {uploading ? "Saving…" : mode === "file" ? "Upload" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setMode("file")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:border-gold/40 hover:bg-gold/5 transition-colors"
        >
          <Upload size={13} className="text-gold" /> Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode("note")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:border-blue-400/40 hover:bg-blue-500/5 transition-colors"
        >
          <StickyNote size={13} className="text-blue-500" /> Add Note
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:border-green-400/40 hover:bg-green-500/5 transition-colors"
        >
          <Link2 size={13} className="text-green-500" /> Add Link
        </button>
        <button
          type="button"
          onClick={() => setShowMS365Picker(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:border-blue-600/40 hover:bg-blue-700/5 transition-colors"
        >
          <Cloud size={13} className="text-blue-600" /> SharePoint / OneDrive
        </button>
      </div>

      {showMS365Picker && (
        <MS365FilePicker
          mode="onedrive"
          onClose={() => setShowMS365Picker(false)}
          onSelect={({ name, url }) => {
            // Add the selected file as a LINK evidence item
            setExternalUrl(url);
            setTitle(name);
            setShowMS365Picker(false);
            setMode("link");
          }}
        />
      )}

      {/* Evidence list */}
      {evidence.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText size={28} className="text-muted-foreground mx-auto mb-2" />
          <p className="font-semibold text-sm">No evidence collected yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload files, add notes, or link external resources</p>
        </div>
      ) : (
        <div className="space-y-2">
          {evidence.map((e) => (
            <div key={e.id} className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{TYPE_ICONS[e.type] ?? "📎"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{e.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {e.uploadedBy ? `${e.uploadedBy.firstName} ${e.uploadedBy.lastName} · ` : ""}
                  {formatDate(e.createdAt)}
                </p>
              </div>
              <Badge variant="secondary" size="sm">{e.type.replace("_", " ")}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────
function TeamTab({ members }: { members: Audit["members"] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {members.map((m) => (
        <div key={m.user.id} className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy-900/10 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold">{m.user.firstName[0]}{m.user.lastName[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-sm">{m.user.firstName} {m.user.lastName}</p>
            <div className="flex items-center gap-2">
              {m.user.title && <p className="text-xs text-muted-foreground">{m.user.title}</p>}
              <Badge variant={m.role === "lead" ? "gold" : "secondary"} size="sm" className="capitalize">
                {m.role}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Survey Distribution Tab ──────────────────────────────────────────────────
function SurveyDistributionTab({ auditId, auditName, onScored }: { auditId: string; auditName: string; onScored?: () => void }) {
  const [surveyUrl, setSurveyUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseCount, setResponseCount] = useState<number | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [avgScores, setAvgScores] = useState<Record<string, { avg: number; count: number }> | null>(null);
  const [scoreSuccess, setScoreSuccess] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/survey`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { data } = await res.json() as { data: { surveyUrl: string } };
      setSurveyUrl(data.surveyUrl);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!surveyUrl) return;
    await navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const loadResults = async () => {
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/survey`);
      const { data } = await res.json() as { data: { totalResponses: number; averages: Record<string, { avg: number; count: number }> } };
      setResponseCount(data.totalResponses);
      setAvgScores(data.averages);
    } finally {
      setLoadingResults(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Explainer */}
      <div className="section-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Send size={15} className="text-gold" />
          <h3 className="text-sm font-semibold">Distribute Survey to Employees</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Generate a secure, anonymous survey link and share it with employees — directly or through your client contact to forward to their team. Each respondent fills out the Likert-scale questions independently. Responses are aggregated and kept confidential.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          {[
            { icon: "🔗", label: "Generate Link", desc: "One click to create a unique survey URL" },
            { icon: "📤", label: "Share Freely", desc: "Email, Slack, Teams — works anywhere" },
            { icon: "📊", label: "See Results", desc: "Aggregated scores appear here in real time" },
          ].map((step) => (
            <div key={step.label} className="bg-muted/50 rounded-xl p-3">
              <div className="text-xl mb-1">{step.icon}</div>
              <p className="text-xs font-semibold text-foreground">{step.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{step.desc}</p>
            </div>
          ))}
        </div>

        {!surveyUrl ? (
          <button
            onClick={generateLink}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Send size={14} />
            {loading ? "Generating…" : "Generate Survey Link"}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-xl border border-border">
              <ExternalLink size={13} className="text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-foreground font-mono truncate flex-1">{surveyUrl}</span>
              <button
                onClick={copyLink}
                className={cn("btn-ghost text-xs flex items-center gap-1 flex-shrink-0", copied && "text-green-500")}
              >
                <Copy size={12} /> {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={surveyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs flex items-center gap-1"
              >
                <ExternalLink size={12} /> Preview survey
              </a>
              <button onClick={generateLink} className="btn-ghost text-xs text-muted-foreground">
                Generate new link
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Share this link via email, Slack, or ask your client to forward it to their employees. Each submission is confidential.
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="section-card">
        <div className="section-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold">Survey Results</h3>
            {responseCount !== null && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{responseCount} responses</span>
            )}
          </div>
          <button
            onClick={loadResults}
            disabled={loadingResults}
            className="btn-ghost text-xs"
          >
            {loadingResults ? "Loading…" : "Refresh Results"}
          </button>
        </div>

        {responseCount === null ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <BarChart3 size={28} className="mx-auto mb-3 opacity-30" />
            <p>Click &ldquo;Refresh Results&rdquo; to load responses</p>
          </div>
        ) : responseCount === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <p>No responses yet. Share the survey link to get started.</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 bg-gold/5 border-b border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">{responseCount}</strong> responses collected
              </p>
              <button
                onClick={async () => {
                  const res = await fetch(`/api/audits/${auditId}/compute-score`, { method: "POST" });
                  if (res.ok) { setScoreSuccess(true); onScored?.(); }
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold/80 transition-colors"
              >
                <TrendingUp size={12} /> {scoreSuccess ? "Scored ✓" : "Compute Scores →"}
              </button>
            </div>
          </>
        )}
        {responseCount !== null && responseCount > 0 && avgScores && (
          <div className="divide-y divide-border">
            {Object.entries(avgScores).map(([itemId, { avg, count }]) => {
              const pct = ((avg - 1) / 4) * 100;
              const color = avg >= 4 ? "bg-green-500" : avg >= 3 ? "bg-blue-500" : avg >= 2 ? "bg-amber-500" : "bg-red-500";
              return (
                <div key={itemId} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground">{itemId.slice(0, 8)}…</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold", avg >= 4 ? "text-green-500" : avg >= 3 ? "text-blue-500" : avg >= 2 ? "text-amber-500" : "text-red-500")}>
                        {avg.toFixed(1)}/5
                      </span>
                      <span className="text-[10px] text-muted-foreground">({count} resp.)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Results & Insights Tab ───────────────────────────────────────────────────
type AuditResultData = {
  overallScore: number;
  riskBand: "CRITICAL" | "AT_RISK" | "NEEDS_STRENGTHENING" | "STRONG";
  responseCount: number;
  questionCount: number;
  flaggedRiskTags: string[];
  domainResults: Array<{
    sectionId: string; sectionTitle: string;
    score: number; riskBand: string;
    questionCount: number; answeredCount: number;
    flaggedRiskTags: string[];
  }>;
  patternFlags: Array<{ riskTag: string; severity: string; avgScore: number; questionCount: number }>;
  recommendations: Array<{
    id: string; triggerType: string; triggerValue: string;
    title: string; body: string; priority: number;
    pathway: { id: string; slug: string; name: string; pathwayNumber: number } | null;
  }>;
};

const BAND_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
  CRITICAL:            { label: "Critical",             color: "text-red-700 bg-red-50 border-red-200",    bar: "bg-red-500" },
  AT_RISK:             { label: "At Risk",              color: "text-orange-700 bg-orange-50 border-orange-200", bar: "bg-orange-500" },
  NEEDS_STRENGTHENING: { label: "Needs Strengthening",  color: "text-amber-700 bg-amber-50 border-amber-200", bar: "bg-amber-500" },
  STRONG:              { label: "Strong",               color: "text-green-700 bg-green-50 border-green-200", bar: "bg-green-500" },
};

function RiskBandPill({ band }: { band: string }) {
  const cfg = BAND_CONFIG[band] ?? BAND_CONFIG.AT_RISK!;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", cfg.color)}>
      {cfg.label}
    </span>
  );
}

function ResultsTab({ auditId }: { auditId: string }) {
  const [data, setData] = useState<AuditResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/audits/${auditId}/compute-score`);
      const json = await res.json() as { data: AuditResultData | null };
      setData(json.data);
    } catch {
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const compute = async () => {
    setComputing(true);
    setError(null);
    try {
      const res = await fetch(`/api/audits/${auditId}/compute-score`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? "Compute failed");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compute scores");
    } finally {
      setComputing(false);
    }
  };

  if (!data && !loading) {
    return (
      <div className="p-8 text-center">
        <TrendingUp size={32} className="mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-sm font-medium text-foreground mb-1">No results computed yet</p>
        <p className="text-xs text-muted-foreground mb-5">
          Compute scores once survey responses have been collected. Results are stored and updated each time you recompute.
        </p>
        <button onClick={compute} disabled={computing} className="btn-primary flex items-center gap-2 mx-auto">
          <TrendingUp size={14} />
          {computing ? "Computing…" : "Compute Scores Now"}
        </button>
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading results…</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        <p>No results found.</p>
        <button onClick={compute} className="btn-ghost text-xs mt-2 flex items-center gap-1 mx-auto">
          <TrendingUp size={12} /> Compute now
        </button>
      </div>
    );
  }

  const bandCfg = BAND_CONFIG[data.riskBand] ?? BAND_CONFIG.AT_RISK!;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Overall score card */}
      <div className={cn("section-card p-6 border-2", bandCfg.color)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">Overall Health Score</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold">{data.overallScore}</span>
              <span className="text-lg font-medium opacity-60 mb-1">/100</span>
            </div>
            <div className="mt-2">
              <RiskBandPill band={data.riskBand} />
            </div>
          </div>
          <div className="text-right text-xs opacity-70 space-y-1">
            <p><strong>{data.responseCount}</strong> respondents</p>
            <p><strong>{data.questionCount}</strong> questions scored</p>
          </div>
        </div>
        <div className="mt-4 h-2.5 bg-black/10 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", bandCfg.bar)}
            style={{ width: `${data.overallScore}%` }}
          />
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={compute}
            disabled={computing}
            className="text-xs opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
          >
            <TrendingUp size={11} /> {computing ? "Recomputing…" : "Recompute"}
          </button>
        </div>
      </div>

      {/* Domain breakdown */}
      {data.domainResults.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h3 className="text-sm font-semibold">Domain Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Score by audit section</p>
          </div>
          <div className="divide-y divide-border">
            {data.domainResults.map((d) => {
              const dcfg = BAND_CONFIG[d.riskBand] ?? BAND_CONFIG.AT_RISK!;
              return (
                <div key={d.sectionId} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-foreground">{d.sectionTitle}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold">{d.score}/100</span>
                      <RiskBandPill band={d.riskBand} />
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                    <div className={cn("h-full rounded-full", dcfg.bar)} style={{ width: `${d.score}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{d.answeredCount}/{d.questionCount} answered</span>
                    {d.flaggedRiskTags.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-end">
                        {d.flaggedRiskTags.map((tag) => (
                          <span key={tag} className="bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-full">
                            {tag.replace(/-/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pattern flags */}
      {data.patternFlags.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h3 className="text-sm font-semibold">Risk Patterns Detected</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Recurring themes that signal elevated organizational risk</p>
          </div>
          <div className="divide-y divide-border">
            {data.patternFlags.map((f) => {
              const sevColor = f.severity === "critical" ? "text-red-600 bg-red-50 border-red-200"
                : f.severity === "elevated" ? "text-orange-600 bg-orange-50 border-orange-200"
                : "text-amber-600 bg-amber-50 border-amber-200";
              return (
                <div key={f.riskTag} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium capitalize">{f.riskTag.replace(/-/g, " ")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.questionCount} question{f.questionCount > 1 ? "s" : ""} flagged · avg {f.avgScore}/100</p>
                  </div>
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize flex-shrink-0", sevColor)}>
                    {f.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h3 className="text-sm font-semibold">Generated Recommendations</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Pathway and intervention recommendations based on scoring</p>
          </div>
          <div className="divide-y divide-border">
            {data.recommendations.map((rec) => (
              <div key={rec.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp size={14} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.body}</p>
                    {rec.pathway && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                        <ArrowRight size={11} />
                        P{rec.pathway.pathwayNumber}: {rec.pathway.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
