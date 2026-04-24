import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Heart, Sun, Moon, Wind, Coffee, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Wellness Coach" };

const WELLNESS_TIPS = [
  { icon: Sun,    title: "Morning Ritual",   tip: "Start your day with 5 minutes of deep breathing or a short walk before checking email.",             category: "Energy"   },
  { icon: Coffee, title: "Mindful Breaks",   tip: "Take a 5-minute break every 90 minutes to reset focus. Step away from your screen.",                 category: "Focus"    },
  { icon: Wind,   title: "Stress Release",   tip: "When overwhelmed, use the 4-7-8 technique: inhale 4s, hold 7s, exhale 8s.",                          category: "Stress"   },
  { icon: Moon,   title: "Evening Wind-Down",tip: "Create a clear work-off ritual. Close your laptop, write tomorrow's top 3 priorities, then walk away.", category: "Recovery" },
];

const RESOURCES = [
  { title: "Employee Assistance Programme (EAP)", desc: "Confidential counselling and support — 6 free sessions per year",                   icon: "🧠" },
  { title: "Mental Health Days",                  desc: "Use your designated mental health days without explanation required",                icon: "🌿" },
  { title: "Peer Support Network",                desc: "Connect with trained peer supporters within the team",                              icon: "🤝" },
  { title: "Meditation Library",                  desc: "Guided meditations for focus, sleep, and stress reduction",                         icon: "🎧" },
  { title: "Fitness Reimbursement",               desc: "Up to $600/year for gym, fitness apps, or wellness activities",                     icon: "💪" },
  { title: "Nutritional Support",                 desc: "Resources for healthy eating on-the-go and during client travel",                   icon: "🥗" },
];

const WEEKLY_CHECKIN = [
  { question: "How are you feeling overall this week?",  options: ["😔 Struggling", "😐 OK", "🙂 Good", "😊 Great"]         },
  { question: "How is your workload?",                   options: ["🔥 Overwhelming", "📈 Heavy", "✅ Manageable", "💤 Light"] },
  { question: "Did you take proper breaks today?",       options: ["❌ No", "🤏 Barely", "✅ Yes", "💯 Absolutely"]           },
];

export default async function WellnessCoachPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Wellness Coach"
        subtitle={`Welcome back, ${user.firstName}. Your wellbeing matters.`}
        icon={Heart}
        iconBg="bg-red-500/10 border-red-500/20"
        iconColor="text-red-500"
      />

      {/* Weekly check-in (informational — submitting wired via Pulse) */}
      <div className="section-card p-5 bg-gradient-to-br from-sage/10 to-green-500/5 border-sage/20">
        <div className="flex items-center gap-2 mb-4">
          <Heart size={16} className="text-sage" />
          <h2 className="text-sm font-semibold text-foreground">Weekly Wellness Check-in</h2>
        </div>
        <div className="space-y-4">
          {WEEKLY_CHECKIN.map((q, i) => (
            <div key={i}>
              <p className="text-xs font-medium text-foreground mb-2">{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button key={opt} type="button" className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:border-sage hover:bg-sage/10 transition-colors">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">Submit your full wellness pulse from the <strong>Culture Scanner</strong> page.</p>
        </div>
      </div>

      {/* Daily tips */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Today&apos;s Wellness Tips</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {WELLNESS_TIPS.map((tip) => {
            const Icon = tip.icon;
            return (
              <div key={tip.title} className="section-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sage/20 flex items-center justify-center">
                    <Icon size={16} className="text-sage" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                    <span className="text-xs text-muted-foreground">{tip.category}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tip.tip}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Wellness Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RESOURCES.map((r) => (
            <div key={r.title} className="section-card p-4 hover:shadow-md transition-all group">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
