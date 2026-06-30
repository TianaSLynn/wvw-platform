import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  BookOpen, ClipboardList, Users, BarChart3, Shield, Award,
  ArrowRight, CheckCircle2, Layers, Brain,
} from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1B]">
      {/* Nav */}
      <header className="border-b border-[#1A1A1B]/10 bg-[#F5F5F0]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1B] flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-[#1A1A1B] tracking-tight">WVW Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm text-[#708090] hover:text-[#1A1A1B] transition-colors">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-semibold bg-[#1A1A1B] text-[#C9A84C] px-4 py-2 rounded-lg hover:bg-[#1A1A1B]/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#A0522D] bg-[#A0522D]/10 border border-[#A0522D]/20 px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A0522D] animate-pulse" />
          WVW Intelligence Audit Engine™
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6 tracking-tight">
          Care with expectations.<br />
          <span className="text-[#708090]">Soft in appearance.</span><br />
          Uncompromising in practice.
        </h1>
        <p className="text-lg text-[#708090] max-w-2xl mx-auto mb-10 leading-relaxed">
          The complete intelligence platform for wellness consultants — audit management, training delivery, client portals, team operations, and workforce analytics in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 bg-[#1A1A1B] text-[#C9A84C] font-semibold px-6 py-3 rounded-xl hover:bg-[#1A1A1B]/90 transition-all hover:gap-3"
          >
            Start Free <ArrowRight size={16} />
          </Link>
          <Link
            href="/sign-in"
            className="flex items-center gap-2 border border-[#1A1A1B]/20 text-[#1A1A1B] font-medium px-6 py-3 rounded-xl hover:border-[#1A1A1B]/40 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-[#1A1A1B]/8 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.iconBg}`}>
                <f.icon size={18} className={f.iconColor} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-[#708090] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audit templates callout */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-[#1A1A1B] rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">15 Proprietary Wellness Audit Templates</h2>
          <p className="text-[#C9A84C]/80 text-sm mb-6 max-w-xl mx-auto">
            Ready-to-deploy audits covering Organizational Wellness, Burnout Risk, DEI & Belonging, Psychological Safety, Leadership Effectiveness, and more — each with expert-crafted questions and automated scoring.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {AUDIT_TAGS.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                {tag}
              </span>
            ))}
          </div>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#1A1A1B] font-bold px-6 py-3 rounded-xl hover:bg-[#C9A84C]/90 transition-colors"
          >
            Launch Your First Audit <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* What's included */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-10">Everything your practice needs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
          {INCLUDED.map((item) => (
            <div key={item} className="flex items-start gap-3 text-sm">
              <CheckCircle2 size={16} className="text-[#6B8F71] flex-shrink-0 mt-0.5" />
              <span className="text-[#1A1A1B]">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1B]/10 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#708090]">
          <span>© 2026 Wholistic Vibes Wellness, LLC. All rights reserved.</span>
          <div className="flex flex-wrap gap-6">
            <Link href="/sign-in" className="hover:text-[#1A1A1B] transition-colors">Sign In</Link>
            <Link href="/sign-up" className="hover:text-[#1A1A1B] transition-colors">Get Started</Link>
            <Link href="/privacy" className="hover:text-[#1A1A1B] transition-colors">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-[#1A1A1B] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    title: "Audit Catalog",
    desc: "15 proprietary wellness templates with expert-crafted questions, automated scoring, and pathway recommendations.",
    icon: ClipboardList,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Training & Academy",
    desc: "Build and deliver training programs in-platform. Assign courses, track completion, issue credentials.",
    icon: BookOpen,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Client Portal",
    desc: "Give clients secure access to their audit results, reports, and evidence submissions — no account required.",
    icon: Users,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    title: "Workforce Analytics",
    desc: "Track team utilization, time, and capacity. Manage HR records, onboarding workflows, and compliance.",
    icon: BarChart3,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    title: "Question Bank",
    desc: "Central library of reusable audit questions. Pull any question into any template. Active/inactive control.",
    icon: Shield,
    iconBg: "bg-terracotta/10",
    iconColor: "text-terracotta",
  },
  {
    title: "Audit Bundles & Scoring",
    desc: "Group templates into bundles. Compute wellness scores with radial charts, domain breakdowns, and pattern flags.",
    icon: Layers,
    iconBg: "bg-sage/10",
    iconColor: "text-sage",
  },
  {
    title: "AI Command",
    desc: "AI-powered insights and recommendations built into the workflow — not bolted on.",
    icon: Brain,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    title: "Credentials & Awards",
    desc: "Issue verifiable credentials upon course completion. WVW-branded certifications your clients can share.",
    icon: Award,
    iconBg: "bg-gold/10",
    iconColor: "text-gold",
  },
];

const AUDIT_TAGS = [
  "Organizational Wellness", "Workplace Culture", "Burnout Risk",
  "DEI & Belonging", "Psychological Safety", "Leadership Effectiveness",
  "Manager Effectiveness", "Employee Wellbeing", "Work-Life Balance",
  "Retention & Engagement", "Onboarding Experience", "HR Policy Compliance",
];

const INCLUDED = [
  "Unlimited audit templates and question banks",
  "Client portal with token-based secure access",
  "In-platform training content builder",
  "Team invites with role-based access control",
  "Automated scoring and pathway recommendations",
  "Time tracking, invoicing, and financials",
  "Workforce HRIS, onboarding workflows, and credentials",
  "Automation builder with n8n workflow integration",
  "Community spaces, messaging, and meeting management",
  "Executive dashboards and KPI analytics",
];
