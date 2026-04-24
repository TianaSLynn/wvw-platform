"use client";

import { useState } from "react";
import { Scan, MessageCircle, CheckCircle2, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

const PULSE_QUESTIONS = [
  "I feel my work is meaningful and connected to our mission",
  "My manager genuinely cares about my development",
  "I have the tools and support I need to do my best work",
  "I feel comfortable sharing my ideas and concerns",
  "I look forward to coming to work each day",
  "Achievements and contributions are recognised on our team",
  "Our pace of work is sustainable",
  "I feel included and valued regardless of my background",
];

const CULTURE_TOPICS = [
  { topic: "Mission Alignment", desc: "How well the team connects daily work to the organisation's purpose" },
  { topic: "Collaboration Quality", desc: "Effectiveness of teamwork and cross-functional cooperation" },
  { topic: "Communication Clarity", desc: "How well information flows across the organisation" },
  { topic: "Recognition Culture", desc: "Whether achievements are noticed and celebrated" },
  { topic: "Growth Mindset", desc: "The team's appetite for learning and continuous improvement" },
  { topic: "Work-Life Balance", desc: "Healthy boundaries and a sustainable working pace" },
  { topic: "Diversity & Inclusion", desc: "An inclusive environment where all voices are heard" },
  { topic: "Leadership Trust", desc: "Confidence in leadership decisions and direction" },
];

export default function CultureScannerPage() {
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function setRating(idx: number, val: number) {
    setRatings((prev) => ({ ...prev, [idx]: val }));
  }

  async function handleSubmit() {
    const unanswered = PULSE_QUESTIONS.filter((_, i) => !ratings[i]);
    if (unanswered.length > 0) { setError("Please answer all questions before submitting."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: PULSE_QUESTIONS.map((q, i) => ({ question: q, rating: ratings[i] })) }),
      });
      if (!res.ok) { setError("Failed to submit — please try again."); return; }
      setSubmitted(true);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Culture Scanner"
        subtitle="Share your weekly pulse — your responses shape team culture insights"
        icon={Scan}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
      />

      {/* What we measure */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <MessageCircle size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Culture Dimensions We Track</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-border">
          {CULTURE_TOPICS.map((t) => (
            <div key={t.topic} className="px-4 py-3 border-b border-border last:border-0 sm:[&:nth-child(odd)]:border-r sm:border-r-border">
              <p className="text-sm font-medium text-foreground">{t.topic}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-purple-500/5 border-t border-purple-500/20">
          <p className="text-xs text-muted-foreground">Culture scores appear here once enough pulse responses have been collected from the team.</p>
        </div>
      </div>

      {/* Pulse survey */}
      {submitted ? (
        <div className="section-card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={24} className="text-green-500" />
          </div>
          <p className="text-sm font-semibold text-foreground">Pulse submitted — thank you!</p>
          <p className="text-xs text-muted-foreground mt-1">Your responses contribute to your team's culture insights.</p>
        </div>
      ) : (
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <Scan size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Weekly Pulse Check</h2>
          </div>
          <div className="p-4 space-y-5">
            {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
            {PULSE_QUESTIONS.map((q, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-foreground mb-2">{q}</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRating(i, r)}
                      className={`w-9 h-9 rounded-full border text-sm font-semibold transition-colors ${
                        ratings[i] === r
                          ? "bg-purple-500 border-purple-500 text-white"
                          : "border-border text-muted-foreground hover:bg-purple-500/10 hover:border-purple-500 hover:text-purple-500"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">1=Disagree · 5=Agree</span>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Send size={13} />
              {submitting ? "Submitting…" : "Submit Pulse"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
