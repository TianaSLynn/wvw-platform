"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SurveyQuestion {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  required: boolean;
  sortOrder: number;
  options?: string[] | null;
  rows?: string[] | null;
  columns?: string[] | null;
  minValue?: number | null;
  maxValue?: number | null;
  minLabel?: string | null;
  maxLabel?: string | null;
  logic?: unknown;
}

interface Survey {
  id: string;
  title: string;
  description?: string | null;
  isAnonymous: boolean;
  showProgress: boolean;
  confirmMessage: string;
  questions: SurveyQuestion[];
}

type AnswerValue = string | number | string[] | null;

function fingerprint(): string {
  try {
    const stored = localStorage.getItem("wvw_fp");
    if (stored) return stored;
    const fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("wvw_fp", fp);
    return fp;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

// ─── Question Renderers ───────────────────────────────────────────────────────

function LikertScale({ q, value, onChange }: { q: SurveyQuestion; value: AnswerValue; onChange: (v: number) => void }) {
  const min = q.minValue ?? 1;
  const max = q.maxValue ?? 5;
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{q.minLabel ?? "Strongly Disagree"}</span>
        <span>{q.maxLabel ?? "Strongly Agree"}</span>
      </div>
      <div className="flex gap-2 justify-between">
        {steps.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all",
              value === n
                ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
                : "border-border hover:border-[#C9A84C]/40 text-foreground"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function NPSScale({ q, value, onChange }: { q: SurveyQuestion; value: AnswerValue; onChange: (v: number) => void }) {
  const steps = Array.from({ length: 11 }, (_, i) => i);
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-gray-500">
        <span>0 – {q.minLabel ?? "Not at all likely"}</span>
        <span>{q.maxLabel ?? "Extremely likely"} – 10</span>
      </div>
      <div className="flex gap-1.5 flex-wrap justify-between">
        {steps.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              "w-10 h-10 rounded-xl border-2 font-semibold text-sm transition-all",
              value === n
                ? n >= 9 ? "border-green-500 bg-green-50 text-green-700"
                  : n >= 7 ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-red-500 bg-red-50 text-red-700"
                : "border-border hover:border-[#C9A84C]/50"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function StarRating({ q, value, onChange }: { q: SurveyQuestion; value: AnswerValue; onChange: (v: number) => void }) {
  const max = q.maxValue ?? 5;
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-3xl transition-transform hover:scale-110"
        >
          <span className={cn(
            "transition-colors",
            (hover || (value as number)) >= n ? "text-[#C9A84C]" : "text-gray-200"
          )}>★</span>
        </button>
      ))}
      {value && <span className="ml-3 text-sm text-gray-500 self-center">{value} / {max}</span>}
    </div>
  );
}

function MultipleChoice({ q, value, onChange }: { q: SurveyQuestion; value: AnswerValue; onChange: (v: string) => void }) {
  const opts = (q.options as string[]) ?? [];
  return (
    <div className="space-y-2">
      {opts.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm",
            value === opt
              ? "border-[#C9A84C] bg-[#C9A84C]/10 text-foreground font-medium"
              : "border-border hover:border-[#C9A84C]/40"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Checkbox({ q, value, onChange }: { q: SurveyQuestion; value: AnswerValue; onChange: (v: string[]) => void }) {
  const opts = (q.options as string[]) ?? [];
  const selected = Array.isArray(value) ? value : [];

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  }

  return (
    <div className="space-y-2">
      {opts.map((opt) => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          className={cn(
            "w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm flex items-center gap-3",
            selected.includes(opt)
              ? "border-[#C9A84C] bg-[#C9A84C]/10 font-medium"
              : "border-border hover:border-[#C9A84C]/40"
          )}
        >
          <span className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
            selected.includes(opt) ? "border-[#C9A84C] bg-[#C9A84C]" : "border-gray-300"
          )}>
            {selected.includes(opt) && <span className="text-white text-xs">✓</span>}
          </span>
          {opt}
        </button>
      ))}
    </div>
  );
}

function TextInput({ q, value, onChange, multiline }: { q: SurveyQuestion; value: AnswerValue; onChange: (v: string) => void; multiline?: boolean }) {
  const base = "w-full border-2 rounded-xl px-4 py-3 text-sm bg-background text-foreground transition-colors outline-none focus:border-[#C9A84C] placeholder:text-muted-foreground";
  if (multiline) {
    return (
      <textarea
        rows={4}
        placeholder={q.description ?? "Your answer…"}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(base, "resize-none")}
      />
    );
  }
  return (
    <input
      type="text"
      placeholder={q.description ?? "Your answer…"}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={base}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicSurveyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState(0); // 0 = intro, 0.5 = your info (non-anonymous only)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [needsInfo, setNeedsInfo] = useState(false);
  const [infoActive, setInfoActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useState(() => new Date().toISOString())[0];

  useEffect(() => {
    fetch(`/api/s/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setSurvey(data.data);
          setNeedsInfo(!data.data.isAnonymous);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const setAnswer = useCallback((qId: string, val: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  }, []);

  const currentQ = survey?.questions[step - 1]; // step 0 = intro
  const totalSteps = survey ? survey.questions.length : 0;
  const progress = totalSteps > 0 ? Math.round((step / (totalSteps + 1)) * 100) : 0;

  function canAdvance() {
    if (infoActive) {
      return respondentName.trim().length > 0 && /\S+@\S+\.\S+/.test(respondentEmail);
    }
    if (step === 0) return true;
    if (!currentQ) return true;
    if (!currentQ.required) return true;
    const ans = answers[currentQ.id];
    if (ans === null || ans === undefined || ans === "") return false;
    if (Array.isArray(ans) && ans.length === 0) return false;
    return true;
  }

  function handleStart() {
    if (needsInfo) {
      setInfoActive(true);
    } else {
      setStep(1);
    }
  }

  function handleInfoContinue() {
    setInfoActive(false);
    setStep(1);
  }

  async function submit() {
    if (!survey) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      fingerprint: fingerprint(),
      startedAt,
      ...(needsInfo ? { respondentName: respondentName.trim(), respondentEmail: respondentEmail.trim() } : {}),
      answers: survey.questions.map((q) => {
        const val = answers[q.id];
        const isNumeric = ["likert", "nps", "rating"].includes(q.type);
        const isJson = q.type === "checkbox";
        return {
          questionId: q.id,
          ...(isNumeric && val !== undefined ? { valueNumber: val as number } : {}),
          ...(isJson && val !== undefined ? { valueJson: val } : {}),
          ...(!isNumeric && !isJson && val !== undefined ? { valueText: val as string } : {}),
        };
      }).filter((a) => Object.keys(a).length > 1),
    };

    try {
      const res = await fetch(`/api/s/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error ?? "Submission failed. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1]">
        <Loader2 className="animate-spin text-[#C9A84C]" size={32} />
      </div>
    );
  }

  if (notFound || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1]">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-[#0F1C3F]">Survey not found</p>
          <p className="text-sm text-gray-500">This survey may have closed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1]">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="w-16 h-16 rounded-full bg-[#6B8F71]/10 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-[#6B8F71]" />
          </div>
          <p className="text-xl font-bold text-[#0F1C3F]">Thank you!</p>
          <p className="text-sm text-gray-500">{survey.confirmMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F1C3F] to-[#1a2d5a] flex items-center justify-center">
            <span className="text-[#C9A84C] text-xs font-bold">W</span>
          </div>
          <span className="text-sm font-medium text-[#0F1C3F]/60">WVW Intelligence</span>
        </div>

        {/* Progress */}
        {survey.showProgress && step > 0 && !infoActive && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Question {step} of {totalSteps}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0F1C3F] to-[#C9A84C] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          {step === 0 && !infoActive ? (
            // Intro screen
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-[#0F1C3F]">{survey.title}</h1>
              {survey.description && (
                <p className="text-gray-500 text-sm leading-relaxed">{survey.description}</p>
              )}
              {survey.isAnonymous && (
                <p className="text-xs text-[#6B8F71] bg-[#6B8F71]/10 px-3 py-2 rounded-lg">
                  🔒 This survey is anonymous — your identity will not be recorded.
                </p>
              )}
              <p className="text-xs text-gray-400">{totalSteps} question{totalSteps !== 1 ? "s" : ""}</p>
            </div>
          ) : infoActive ? (
            // Respondent info screen (name + email)
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#C9A84C] uppercase tracking-wider">Your Info</p>
                <h2 className="text-lg font-semibold text-[#0F1C3F]">Let's start with your details</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Full Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Jordan Rivera"
                    className="w-full border-2 rounded-xl px-4 py-3 text-sm bg-background text-foreground outline-none focus:border-[#C9A84C] placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Email Address <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    placeholder="jordan@organization.org"
                    className="w-full border-2 rounded-xl px-4 py-3 text-sm bg-background text-foreground outline-none focus:border-[#C9A84C] placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          ) : currentQ ? (
            // Question screen
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#C9A84C] uppercase tracking-wider">
                  Question {step} {currentQ.required && <span className="text-red-400">*</span>}
                </p>
                <h2 className="text-lg font-semibold text-[#0F1C3F]">{currentQ.title}</h2>
                {currentQ.description && (
                  <p className="text-sm text-gray-400">{currentQ.description}</p>
                )}
              </div>

              <div>
                {currentQ.type === "likert" && (
                  <LikertScale q={currentQ} value={answers[currentQ.id] ?? null}
                    onChange={(v) => setAnswer(currentQ.id, v)} />
                )}
                {currentQ.type === "nps" && (
                  <NPSScale q={currentQ} value={answers[currentQ.id] ?? null}
                    onChange={(v) => setAnswer(currentQ.id, v)} />
                )}
                {currentQ.type === "rating" && (
                  <StarRating q={currentQ} value={answers[currentQ.id] ?? null}
                    onChange={(v) => setAnswer(currentQ.id, v)} />
                )}
                {currentQ.type === "multiple_choice" && (
                  <MultipleChoice q={currentQ} value={answers[currentQ.id] ?? null}
                    onChange={(v) => setAnswer(currentQ.id, v)} />
                )}
                {currentQ.type === "checkbox" && (
                  <Checkbox q={currentQ} value={answers[currentQ.id] ?? null}
                    onChange={(v) => setAnswer(currentQ.id, v)} />
                )}
                {currentQ.type === "short_text" && (
                  <TextInput q={currentQ} value={answers[currentQ.id] ?? null}
                    onChange={(v) => setAnswer(currentQ.id, v)} />
                )}
                {currentQ.type === "long_text" && (
                  <TextInput q={currentQ} value={answers[currentQ.id] ?? null}
                    onChange={(v) => setAnswer(currentQ.id, v)} multiline />
                )}
              </div>

              {!canAdvance() && (
                <p className="text-xs text-red-400">This question is required.</p>
              )}
            </div>
          ) : null}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => { if (infoActive) { setInfoActive(false); } else { setStep((s) => Math.max(0, s - 1)); } }}
              disabled={step === 0 && !infoActive}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-0 transition-all"
            >
              <ChevronLeft size={16} /> Back
            </button>

            {infoActive ? (
              <button
                onClick={handleInfoContinue}
                disabled={!canAdvance()}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all",
                  canAdvance()
                    ? "bg-[#0F1C3F] text-white hover:bg-[#1a2d5a]"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                )}
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : step < totalSteps ? (
              <button
                onClick={() => { if (step === 0) { handleStart(); } else { setStep((s) => s + 1); } }}
                disabled={!canAdvance()}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all",
                  canAdvance()
                    ? "bg-[#0F1C3F] text-white hover:bg-[#1a2d5a]"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                )}
              >
                {step === 0 ? "Start" : "Next"} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canAdvance() || submitting}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all",
                  canAdvance() && !submitting
                    ? "bg-[#C9A84C] text-white hover:bg-[#b8973e]"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                )}
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Survey"}
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">Powered by WVW Intelligence</p>
      </div>
    </div>
  );
}
