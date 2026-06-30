"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Plus, Trash2, Save, Globe, EyeOff, Settings,
  ChevronDown, ChevronUp, Loader2, ArrowLeft, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice",  desc: "One answer from a list" },
  { value: "checkbox",        label: "Checkboxes",       desc: "Multiple answers from a list" },
  { value: "short_text",      label: "Short Text",       desc: "Single-line text response" },
  { value: "long_text",       label: "Long Text",        desc: "Multi-line text response" },
  { value: "likert",          label: "Likert Scale",     desc: "Agreement scale (1–5 or 1–7)" },
  { value: "nps",             label: "NPS Score",        desc: "Likely to recommend (0–10)" },
  { value: "rating",          label: "Star Rating",      desc: "Star rating (1–5)" },
];

interface SurveyQuestion {
  id?: string;
  type: string;
  title: string;
  description?: string | null;
  required: boolean;
  sortOrder: number;
  options?: string[] | null;
  minValue?: number | null;
  maxValue?: number | null;
  minLabel?: string | null;
  maxLabel?: string | null;
  weight?: number | null;
}

interface Survey {
  id: string;
  title: string;
  description?: string | null;
  isAnonymous: boolean;
  showProgress: boolean;
  allowMultiple: boolean;
  confirmMessage: string;
  closeAt?: string | null;
  status: string;
  slug: string;
  auditId?: string | null;
  questions: SurveyQuestion[];
}

interface Audit { id: string; name: string; }

let tmpId = 0;
function nextId() { return `tmp_${++tmpId}`; }

function defaultQuestion(type: string, sortOrder: number): SurveyQuestion {
  const base: SurveyQuestion = {
    id: nextId(), type, title: "", required: true, sortOrder,
    description: null, options: null, minValue: null, maxValue: null,
    minLabel: null, maxLabel: null, weight: 1.0,
  };
  if (["multiple_choice", "checkbox"].includes(type)) base.options = ["Option 1", "Option 2"];
  if (type === "likert")  { base.minValue = 1; base.maxValue = 5; base.minLabel = "Strongly Disagree"; base.maxLabel = "Strongly Agree"; }
  if (type === "nps")     { base.minLabel = "Not at all likely"; base.maxLabel = "Extremely likely"; }
  if (type === "rating")  { base.maxValue = 5; }
  return base;
}

// ─── Sortable Question Row ────────────────────────────────────────────────────

function SortableQuestion({
  q, index, expanded, onToggle, onUpdate, onDelete,
}: {
  q: SurveyQuestion;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<SurveyQuestion>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id! });
  const dragStyle = { transform: CSS.Transform.toString(transform), transition };

  const hasOptions = ["multiple_choice", "checkbox"].includes(q.type);
  const hasScale   = ["likert", "nps"].includes(q.type);
  const hasMax     = q.type === "rating";

  function setOption(i: number, val: string) {
    const opts = [...(q.options ?? [])];
    opts[i] = val;
    onUpdate({ options: opts });
  }
  function addOption() { onUpdate({ options: [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`] }); }
  function removeOption(i: number) {
    const opts = (q.options ?? []).filter((_, idx) => idx !== i);
    onUpdate({ options: opts });
  }

  const qFieldId = `q-${q.id}`;

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={cn("border border-border rounded-xl bg-card transition-shadow", isDragging ? "shadow-xl opacity-90" : "")}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>

        <span className="text-xs font-mono text-muted-foreground w-5 mt-1 flex-shrink-0">{index + 1}</span>

        <div className="flex-1 min-w-0">
          <label htmlFor={qFieldId} className="sr-only">Question text</label>
          <input
            id={qFieldId}
            className="w-full bg-transparent font-semibold text-sm outline-none placeholder:text-muted-foreground/50 focus:text-foreground"
            placeholder="Question text…"
            value={q.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
          <div className="flex items-center gap-3 mt-1">
            <label htmlFor={`${qFieldId}-type`} className="sr-only">Question type</label>
            <select
              id={`${qFieldId}-type`}
              aria-label="Question type"
              className="text-xs text-muted-foreground bg-transparent border-0 outline-none cursor-pointer"
              value={q.type}
              onChange={(e) => onUpdate({ type: e.target.value })}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                className="w-3 h-3"
                checked={q.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
              />
              Required
            </label>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            aria-label={expanded ? "Collapse question" : "Expand question"}
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            aria-label="Delete question"
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-10 pb-4 space-y-3 border-t border-border/50 pt-3">
          <div>
            <label htmlFor={`${qFieldId}-desc`} className="text-xs text-muted-foreground">Helper text (optional)</label>
            <input
              id={`${qFieldId}-desc`}
              className="input-base w-full text-xs mt-1"
              placeholder="Additional context shown below the question"
              value={q.description ?? ""}
              onChange={(e) => onUpdate({ description: e.target.value || null })}
            />
          </div>

          {hasOptions && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Options</p>
              <div className="space-y-2">
                {(q.options ?? []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <label htmlFor={`${qFieldId}-opt-${i}`} className="sr-only">Option {i + 1}</label>
                    <input
                      id={`${qFieldId}-opt-${i}`}
                      aria-label={`Option ${i + 1}`}
                      className="input-base flex-1 text-xs"
                      value={opt}
                      onChange={(e) => setOption(i, e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={`Remove option ${i + 1}`}
                      onClick={() => removeOption(i)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addOption} className="text-xs text-gold hover:underline flex items-center gap-1">
                  <Plus size={12} /> Add option
                </button>
              </div>
            </div>
          )}

          {hasScale && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${qFieldId}-min`} className="text-xs text-muted-foreground">Min value</label>
                <input id={`${qFieldId}-min`} type="number" className="input-base w-full text-xs mt-1"
                  value={q.minValue ?? 1}
                  onChange={(e) => onUpdate({ minValue: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label htmlFor={`${qFieldId}-max`} className="text-xs text-muted-foreground">Max value</label>
                <input id={`${qFieldId}-max`} type="number" className="input-base w-full text-xs mt-1"
                  value={q.maxValue ?? 5}
                  onChange={(e) => onUpdate({ maxValue: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label htmlFor={`${qFieldId}-minlabel`} className="text-xs text-muted-foreground">Min label</label>
                <input id={`${qFieldId}-minlabel`} className="input-base w-full text-xs mt-1"
                  value={q.minLabel ?? ""}
                  onChange={(e) => onUpdate({ minLabel: e.target.value || null })}
                />
              </div>
              <div>
                <label htmlFor={`${qFieldId}-maxlabel`} className="text-xs text-muted-foreground">Max label</label>
                <input id={`${qFieldId}-maxlabel`} className="input-base w-full text-xs mt-1"
                  value={q.maxLabel ?? ""}
                  onChange={(e) => onUpdate({ maxLabel: e.target.value || null })}
                />
              </div>
            </div>
          )}

          {hasMax && (
            <div>
              <label htmlFor={`${qFieldId}-stars`} className="text-xs text-muted-foreground">Max stars</label>
              <input id={`${qFieldId}-stars`} type="number" min={3} max={10} className="input-base w-24 text-xs mt-1"
                value={q.maxValue ?? 5}
                onChange={(e) => onUpdate({ maxValue: parseInt(e.target.value) })}
              />
            </div>
          )}

          <div>
            <label htmlFor={`${qFieldId}-weight`} className="text-xs text-muted-foreground">Question weight (for scoring)</label>
            <input id={`${qFieldId}-weight`} type="number" min={0} step={0.1} className="input-base w-24 text-xs mt-1"
              value={q.weight ?? 1.0}
              onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

export function SurveyBuilder({ survey: initial, audits }: { survey: Survey; audits: Audit[] }) {
  const router = useRouter();
  const [survey, setSurvey] = useState<Survey>(initial);
  const [questions, setQuestions] = useState<SurveyQuestion[]>(initial.questions);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setQuestions((qs) => {
        const oldIdx = qs.findIndex((q) => q.id === active.id);
        const newIdx = qs.findIndex((q) => q.id === over.id);
        return arrayMove(qs, oldIdx, newIdx).map((q, i) => ({ ...q, sortOrder: i }));
      });
    }
  }

  function addQuestion(type: string) {
    const q = defaultQuestion(type, questions.length);
    setQuestions((qs) => [...qs, q]);
    setExpanded(q.id!);
    setAddMenuOpen(false);
  }

  function updateQuestion(id: string, updates: Partial<SurveyQuestion>) {
    setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, ...updates } : q));
  }

  function deleteQuestion(id: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== id).map((q, i) => ({ ...q, sortOrder: i })));
    if (expanded === id) setExpanded(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/surveys/${survey.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:          survey.title,
        description:    survey.description,
        isAnonymous:    survey.isAnonymous,
        showProgress:   survey.showProgress,
        allowMultiple:  survey.allowMultiple,
        confirmMessage: survey.confirmMessage,
        closeAt:        survey.closeAt,
        auditId:        survey.auditId,
        questions:      questions.map((q, i) => ({
          type:        q.type,
          title:       q.title,
          description: q.description,
          required:    q.required,
          sortOrder:   i,
          options:     q.options,
          minValue:    q.minValue,
          maxValue:    q.maxValue,
          minLabel:    q.minLabel,
          maxLabel:    q.maxLabel,
          weight:      q.weight ?? 1.0,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to save"); return; }
    const d = await res.json().catch(() => null);
    if (d?.data) {
      const fresh = await fetch(`/api/surveys/${survey.id}`).then((r) => r.json()).catch(() => null);
      if (fresh?.data?.questions) setQuestions(fresh.data.questions);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    await save();
    const res = await fetch(`/api/surveys/${survey.id}/publish`, { method: "POST" });
    setPublishing(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error ?? "Could not publish");
      return;
    }
    setSurvey((s) => ({ ...s, status: "ACTIVE" }));
    router.refresh();
  }

  async function unpublish() {
    const res = await fetch(`/api/surveys/${survey.id}/publish`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DRAFT" }),
    });
    if (res.ok) setSurvey((s) => ({ ...s, status: "DRAFT" }));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-20">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur py-3 -mx-4 px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href={`/surveys/${survey.id}`} className="text-muted-foreground hover:text-foreground" aria-label="Back to survey">
            <ArrowLeft size={16} />
          </Link>
          <label htmlFor="survey-title" className="sr-only">Survey title</label>
          <input
            id="survey-title"
            aria-label="Survey title"
            className="font-bold text-sm bg-transparent outline-none border-0 focus:underline"
            value={survey.title}
            onChange={(e) => setSurvey((s) => ({ ...s, title: e.target.value }))}
          />
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium border",
            survey.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"
          )}>
            {survey.status.charAt(0) + survey.status.slice(1).toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {survey.status === "ACTIVE" && (
            <Link href={`/s/${survey.slug}`} target="_blank"
              className="btn-ghost text-xs flex items-center gap-1.5 px-3">
              <ExternalLink size={12} /> Preview
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className={cn("btn-ghost text-xs px-3 flex items-center gap-1.5", showSettings && "bg-muted")}
          >
            <Settings size={12} /> Settings
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-ghost text-xs px-3 flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saved ? "Saved!" : "Save"}
          </button>
          {survey.status !== "ACTIVE" ? (
            <button
              type="button"
              onClick={publish}
              disabled={publishing}
              className="btn-primary text-xs px-4 flex items-center gap-1.5"
            >
              {publishing ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
              Publish
            </button>
          ) : (
            <button
              type="button"
              onClick={unpublish}
              className="btn-ghost text-xs px-3 flex items-center gap-1.5"
            >
              <EyeOff size={12} /> Unpublish
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2" role="alert">
          {error}
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="section-card p-5 space-y-4">
          <h3 className="font-semibold text-sm">Survey Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-title" className="text-xs text-muted-foreground">Title</label>
              <input
                id="settings-title"
                className="input-base w-full mt-1 text-sm"
                value={survey.title}
                onChange={(e) => setSurvey((s) => ({ ...s, title: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="settings-audit" className="text-xs text-muted-foreground">Linked Audit (optional)</label>
              <select
                id="settings-audit"
                className="input-base w-full mt-1 text-sm"
                value={survey.auditId ?? ""}
                onChange={(e) => setSurvey((s) => ({ ...s, auditId: e.target.value || null }))}
              >
                <option value="">None</option>
                {audits.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="settings-desc" className="text-xs text-muted-foreground">Description</label>
              <textarea
                id="settings-desc"
                className="input-base w-full mt-1 text-sm resize-none"
                rows={2}
                value={survey.description ?? ""}
                onChange={(e) => setSurvey((s) => ({ ...s, description: e.target.value || null }))}
              />
            </div>
            <div>
              <label htmlFor="settings-confirm" className="text-xs text-muted-foreground">Confirmation message</label>
              <textarea
                id="settings-confirm"
                className="input-base w-full mt-1 text-sm resize-none"
                rows={2}
                value={survey.confirmMessage}
                onChange={(e) => setSurvey((s) => ({ ...s, confirmMessage: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="settings-closeat" className="text-xs text-muted-foreground">Close at (optional)</label>
              <input
                id="settings-closeat"
                type="datetime-local"
                className="input-base w-full mt-1 text-sm"
                value={survey.closeAt ? new Date(survey.closeAt).toISOString().slice(0, 16) : ""}
                onChange={(e) => setSurvey((s) => ({ ...s, closeAt: e.target.value || null }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {(
              [
                ["isAnonymous",   "Anonymous responses"],
                ["showProgress",  "Show progress bar"],
                ["allowMultiple", "Allow multiple submissions"],
              ] as [keyof Survey, string][]
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  aria-label={label}
                  checked={!!survey[key]}
                  onChange={(e) => setSurvey((s) => ({ ...s, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Questions */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map((q) => q.id!)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <SortableQuestion
                key={q.id}
                q={q}
                index={i}
                expanded={expanded === q.id}
                onToggle={() => setExpanded((prev) => prev === q.id ? null : q.id!)}
                onUpdate={(updates) => updateQuestion(q.id!, updates)}
                onDelete={() => deleteQuestion(q.id!)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {questions.length === 0 && (
        <div className="section-card p-10 text-center">
          <p className="font-semibold text-sm mb-1">No questions yet</p>
          <p className="text-xs text-muted-foreground">Add your first question below</p>
        </div>
      )}

      {/* Add question */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setAddMenuOpen((v) => !v)}
          aria-expanded={addMenuOpen ? "true" : "false"}
          aria-haspopup="listbox"
          className="w-full border-2 border-dashed border-border hover:border-gold/40 rounded-xl py-3 text-sm text-muted-foreground hover:text-gold transition-all flex items-center justify-center gap-2"
        >
          <Plus size={15} /> Add Question
        </button>

        {addMenuOpen && (
          <div role="listbox" aria-label="Question types" className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 p-2 grid grid-cols-2 gap-1">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => addQuestion(t.value)}
                className="text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
