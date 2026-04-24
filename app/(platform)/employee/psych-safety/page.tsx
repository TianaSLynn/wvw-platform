import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Shield, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Psychological Safety" };

const PRACTICES = [
  { practice: "Team Retrospectives", freq: "Biweekly", desc: "Structured sessions to share what's working and what needs improvement" },
  { practice: "Anonymous Feedback Channel", freq: "Always Open", desc: "Submit concerns, ideas, or feedback anonymously" },
  { practice: "No-Blame Incident Reviews", freq: "As needed", desc: "Post-incident reviews focused on systems, not people" },
  { practice: "Skip-Level Meetings", freq: "Quarterly", desc: "Direct conversations with leadership outside your reporting line" },
  { practice: "Celebration of Experiments", freq: "Monthly", desc: "Share what you tried — even if it didn't work — in all-hands" },
];

const WHAT_IT_MEANS = [
  "You can raise concerns without fear of embarrassment or retaliation",
  "It's safe to admit mistakes, ask questions, and share ideas",
  "Diverse perspectives are actively sought and valued",
  "Risk-taking and experimentation are encouraged",
  "Failure is treated as a learning opportunity, not a punishable offence",
];

const FOUR_QUESTIONS = [
  "If you make a mistake on this team, is it often held against you?",
  "Are members of this team able to bring up problems and tough issues?",
  "Do people on this team sometimes reject others for being different?",
  "Is it safe to take a risk on this team?",
];

export default async function PsychSafetyPage() {
  await requireUser();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Psychological Safety"
        subtitle="Build and sustain an environment where everyone can speak up, take risks, and belong"
        icon={Shield}
        iconBg="bg-sage/20 border-sage/30"
        iconColor="text-sage"
      />

      {/* What it is */}
      <div className="section-card p-5 bg-gradient-to-br from-sage/5 to-green-500/5 border-sage/20">
        <p className="text-sm font-semibold text-foreground mb-3">What Psychological Safety Means</p>
        <ul className="space-y-2">
          {WHAT_IT_MEANS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 size={14} className="text-sage mt-0.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* The 4 questions (Amy Edmondson) */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <Shield size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Amy Edmondson&apos;s 4 Key Indicators</h2>
        </div>
        <div className="divide-y divide-border">
          {FOUR_QUESTIONS.map((q, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <span className="text-xs font-bold text-sage mt-0.5 flex-shrink-0">Q{i + 1}</span>
              <p className="text-sm text-foreground">{q}</p>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-muted/40 border-t border-border">
          <p className="text-xs text-muted-foreground">Team psychological safety scores appear here once your team completes culture pulse surveys.</p>
        </div>
      </div>

      {/* Practices */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <CheckCircle2 size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Our Safety Practices</h2>
        </div>
        <div className="divide-y divide-border">
          {PRACTICES.map((p) => (
            <div key={p.practice} className="flex items-start gap-3 px-4 py-3">
              <CheckCircle2 size={14} className="text-sage mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{p.practice}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{p.freq}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
