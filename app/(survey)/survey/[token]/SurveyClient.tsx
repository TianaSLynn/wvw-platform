"use client";

import { useState } from "react";
import { Shield, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from "lucide-react";

type Question = {
  id: string;
  question: string;
  guidance: string | null;
  riskWeight: number;
  isRequired: boolean;
};

type Section = {
  id: string;
  title: string;
  sortOrder: number;
  checklistItems: Question[];
};

type SurveyData = {
  audit: { id: string; name: string; org: string; client?: string | null };
  sections: Section[];
  totalQuestions: number;
};

const LIKERT_OPTIONS = [
  { value: "1", label: "Strongly\nDisagree", short: "1", color: "border-red-300 hover:border-red-400 hover:bg-red-50", selected: "bg-red-100 border-red-500 text-red-700" },
  { value: "2", label: "Disagree", short: "2", color: "border-orange-300 hover:border-orange-400 hover:bg-orange-50", selected: "bg-orange-100 border-orange-500 text-orange-700" },
  { value: "3", label: "Neutral", short: "3", color: "border-amber-300 hover:border-amber-400 hover:bg-amber-50", selected: "bg-amber-100 border-amber-500 text-amber-700" },
  { value: "4", label: "Agree", short: "4", color: "border-blue-300 hover:border-blue-400 hover:bg-blue-50", selected: "bg-blue-100 border-blue-500 text-blue-700" },
  { value: "5", label: "Strongly\nAgree", short: "5", color: "border-green-300 hover:border-green-400 hover:bg-green-50", selected: "bg-green-100 border-green-500 text-green-700" },
] as const;

function parseGuidanceHint(guidance: string | null): string | null {
  if (!guidance || !guidance.includes("code:")) return null;
  const riskMatch = guidance.match(/risk:([^\s|]+)/);
  const reverseMatch = guidance.includes("reverse:true");
  const parts: string[] = [];
  if (riskMatch?.[1]) parts.push(`Focus area: ${riskMatch[1].replace(/-/g, " ")}`);
  if (reverseMatch) parts.push("Note: For this question, lower scores reflect higher concern.");
  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function SurveyClient({ survey, token }: { survey: SurveyData; token: string }) {
  const [step, setStep] = useState<"intro" | "survey" | "done">("intro");
  const [sectionIdx, setSectionIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentRole, setRespondentRole] = useState("");
  const [respondentDept, setRespondentDept] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = survey.sections;
  const currentSection = sections[sectionIdx];
  const answeredCount = Object.keys(responses).length;
  const totalQ = survey.totalQuestions;
  const pct = Math.round((answeredCount / totalQ) * 100);

  const canAdvance = () => {
    if (!currentSection) return false;
    const required = currentSection.checklistItems.filter((q) => q.isRequired);
    return required.every((q) => responses[q.id]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/survey/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respondentName: respondentName || undefined,
          respondentRole: respondentRole || undefined,
          respondentDept: respondentDept || undefined,
          responses,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Thank you!</h1>
        <p className="text-gray-600 mb-2">Your responses have been recorded confidentially.</p>
        <p className="text-sm text-gray-400">{survey.audit.org} will use your feedback to improve your organization.</p>
        <div className="mt-8 p-4 bg-gray-100 rounded-2xl text-xs text-gray-400">
          Your responses are confidential and only viewed in aggregate.
        </div>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#0F1C3F] flex items-center justify-center">
              <Shield size={22} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{survey.audit.org}</p>
              <h1 className="text-lg font-bold text-gray-900">{survey.audit.name}</h1>
            </div>
          </div>
          {survey.audit.client && (
            <p className="text-sm text-gray-500 mb-4">Prepared for: <strong>{survey.audit.client}</strong></p>
          )}
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            You've been invited to participate in an organizational health survey. Your responses are <strong>confidential</strong> and will only be viewed in aggregate — never individually attributed.
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm text-gray-600 space-y-1.5">
            <p>📋 <strong>{survey.totalQuestions} questions</strong> across {sections.length} sections</p>
            <p>⏱ Takes approximately <strong>{Math.ceil(survey.totalQuestions * 0.5)} minutes</strong></p>
            <p>🔒 All responses are confidential</p>
          </div>

          {/* Optional respondent info */}
          <div className="space-y-3 mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">About You (optional)</p>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your role (optional)"
                value={respondentRole}
                onChange={(e) => setRespondentRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
              />
              <input
                type="text"
                placeholder="Department (optional)"
                value={respondentDept}
                onChange={(e) => setRespondentDept(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
              />
            </div>
          </div>

          <button
            onClick={() => setStep("survey")}
            className="w-full py-3 rounded-2xl bg-[#0F1C3F] text-white font-semibold text-sm hover:bg-[#1a2d5a] transition-colors flex items-center justify-center gap-2"
          >
            Begin Survey <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Survey step
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{survey.audit.org} · {survey.audit.name}</span>
          <span>{answeredCount} of {totalQ} answered</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C9A84C] rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
          <span>Section {sectionIdx + 1} of {sections.length}: <strong className="text-gray-600">{currentSection?.title}</strong></span>
          <span>{pct}% complete</span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {currentSection?.checklistItems.map((q, qi) => {
          const hint = parseGuidanceHint(q.guidance);
          const selected = responses[q.id];
          return (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {qi + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                    {q.question}
                    {q.isRequired && <span className="text-red-400 ml-1">*</span>}
                  </p>
                  {hint && (
                    <p className="text-xs text-gray-400 mt-1.5">{hint}</p>
                  )}
                </div>
              </div>

              {/* Likert scale */}
              <div className="grid grid-cols-5 gap-2">
                {LIKERT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setResponses((r) => ({ ...r, [q.id]: opt.value }))}
                    className={`
                      flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all text-center
                      ${selected === opt.value ? opt.selected + " shadow-sm" : "border-gray-200 " + opt.color}
                    `}
                  >
                    <span className="text-xl font-bold">{opt.short}</span>
                    <span className="text-[9px] leading-tight mt-1 whitespace-pre-line">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => sectionIdx > 0 ? setSectionIdx(sectionIdx - 1) : setStep("intro")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {sectionIdx < sections.length - 1 ? (
          <button
            onClick={() => setSectionIdx(sectionIdx + 1)}
            disabled={!canAdvance()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-sm font-semibold hover:bg-[#1a2d5a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next Section <ChevronRight size={16} />
          </button>
        ) : (
          <div className="space-y-3 flex flex-col items-end">
            <textarea
              placeholder="Any additional comments? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-72 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
            />
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!canAdvance() || submitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#C9A84C] text-white text-sm font-bold hover:bg-[#b8953f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit Survey"}
              <CheckCircle2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
