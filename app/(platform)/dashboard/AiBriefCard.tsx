"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sun, Brain, RefreshCw, Loader2, AlertCircle, TrendingUp,
  Users, BarChart2, Eye, MessageCircle, Zap, ChevronDown, ChevronRight,
  Lightbulb, Target, Megaphone, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type NicheOfDay = {
  topic: string;
  summary: string;
  whyItMattersForWVW: string;
  contentIdea: string;
  talkingPoints: string[];
  topPost?: { title: string; subreddit: string; url: string };
};

type Lead = {
  name: string;
  company: string;
  stage: string;
  value: string;
  probability: string;
  whyNow: string;
  approach: string;
  openingLine: string;
};

type HiringPipeline = {
  summary: string;
  stageSummary: string[];
  nextActions: string[];
  highlight: string;
};

type SurveyActivity = {
  summary: string;
  insights: string[];
  recommendation: string;
};

type MediaStanding = {
  summary: string;
  strengths: string[];
  opportunities: string[];
  recommendation: string;
};

type SocialMentions = {
  directMentions: string;
  sentimentNote: string;
  goodTalk: string[];
  watchList: string[];
  recommendation: string;
};

type BusinessPulse = {
  topPriority: string;
  alerts: string[];
  quickWins: string[];
};

type Brief = {
  nicheOfDay: NicheOfDay;
  topLeads: Lead[];
  hiringPipeline: HiringPipeline;
  surveyActivity: SurveyActivity;
  mediaStanding: MediaStanding;
  socialMentions: SocialMentions;
  businessPulse: BusinessPulse;
};

// ─── Section component ────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  iconColor,
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/30 transition-colors"
        aria-expanded={open ? "true" : "false"}
      >
        <Icon size={14} className={cn("flex-shrink-0", iconColor)} aria-hidden />
        <span className="text-sm font-semibold flex-1 text-left">{title}</span>
        {badge && (
          <span className="text-[10px] font-medium bg-gold/15 text-gold px-2 py-0.5 rounded-full">{badge}</span>
        )}
        {open ? <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />}
      </button>
      {open && <div className="border-t border-border px-4 py-3 space-y-2.5">{children}</div>}
    </div>
  );
}

function BulletList({ items, color = "text-muted-foreground" }: { items: string[]; color?: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold/60 flex-shrink-0 mt-1.5" aria-hidden />
          <span className={cn("text-xs leading-relaxed", color)}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{children}</p>;
}

// ─── Main card ────────────────────────────────────────────────────────────────

export default function AiBriefCard() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; isApiKey?: boolean } | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force ? "/api/ai/brief?force=1" : "/api/ai/brief";
      const res = await fetch(url);
      const json = await res.json() as { data?: { brief: Brief; generatedAt: string }; error?: string; message?: string };
      if (!res.ok) {
        const isApiKey = json.error === "api_key_missing";
        setError({ message: json.message ?? json.error ?? "Failed to generate brief.", isApiKey });
      } else if (json.data) {
        setBrief(json.data.brief);
        setGeneratedAt(json.data.generatedAt);
      }
    } catch {
      setError({ message: "Network error. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="section-card animate-fade-in">
      {/* Header */}
      <div className="section-card-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sun size={14} className="text-gold" aria-hidden />
          <h2 className="font-semibold text-sm">Today&apos;s Brief</h2>
          <span className="text-xs text-muted-foreground font-normal hidden sm:inline">· {dateStr}</span>
        </div>
        <div className="flex items-center gap-2">
          {generatedAt && !loading && (
            <span className="text-[10px] text-muted-foreground hidden md:inline">
              Generated {new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            aria-label="Regenerate brief"
            className="btn-ghost flex items-center gap-1.5 text-xs px-2 py-1"
          >
            <RefreshCw size={12} className={cn(loading && "animate-spin")} aria-hidden />
            {loading ? "Generating…" : "Regenerate"}
          </button>
          <Link href="/ai-command" className="flex items-center gap-1.5 text-xs text-gold hover:underline">
            <Brain size={12} aria-hidden /> AI Command
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="p-8 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 size={24} className="animate-spin text-gold" aria-label="Generating brief" />
          <p className="text-xs">Pulling Reddit trends · Analyzing pipeline · Generating intel…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-5">
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" aria-hidden />
              <p className="text-sm font-semibold text-red-600">Brief unavailable</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{error.message}</p>
            {error.isApiKey && (
              <div className="mt-2 bg-muted rounded-lg p-3 text-xs font-mono text-muted-foreground space-y-1">
                <p>To fix — run in terminal:</p>
                <p className="text-foreground">Add OPENAI_API_KEY to the production environment.</p>
                <p className="text-foreground">npx vercel --prod</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brief content */}
      {!loading && brief && (
        <div className="p-4 space-y-3">

          {/* Business Pulse — always open, top priority visible at a glance */}
          <Section icon={Zap} iconColor="text-gold" title="Business Pulse" defaultOpen>
            <div className="bg-gold/8 border border-gold/20 rounded-lg px-3 py-2.5 mb-2">
              <Label>Top priority today</Label>
              <p className="text-sm font-medium mt-1 leading-snug">{brief.businessPulse.topPriority}</p>
            </div>
            {brief.businessPulse.alerts.length > 0 && (
              <div>
                <Label>Alerts</Label>
                <BulletList items={brief.businessPulse.alerts} color="text-red-600" />
              </div>
            )}
            {brief.businessPulse.quickWins.length > 0 && (
              <div className="mt-2">
                <Label>Quick wins</Label>
                <BulletList items={brief.businessPulse.quickWins} />
              </div>
            )}
          </Section>

          {/* Niche of the Day */}
          <Section icon={TrendingUp} iconColor="text-emerald-500" title="Niche of the Day" badge="Reddit" defaultOpen>
            <div>
              <p className="text-sm font-semibold leading-snug">{brief.nicheOfDay.topic}</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{brief.nicheOfDay.summary}</p>
            </div>
            <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg px-3 py-2.5">
              <Label>Why it matters for WVW</Label>
              <p className="text-xs mt-1 leading-relaxed">{brief.nicheOfDay.whyItMattersForWVW}</p>
            </div>
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2.5">
              <Label>Post this today</Label>
              <p className="text-xs mt-1 leading-relaxed font-medium">{brief.nicheOfDay.contentIdea}</p>
            </div>
            {brief.nicheOfDay.talkingPoints?.length > 0 && (
              <div>
                <Label>Talking points</Label>
                <BulletList items={brief.nicheOfDay.talkingPoints} />
              </div>
            )}
            {brief.nicheOfDay.topPost && (
              <div className="pt-1">
                <Label>Source post</Label>
                <a
                  href={brief.nicheOfDay.topPost.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold hover:underline mt-1 block"
                >
                  r/{brief.nicheOfDay.topPost.subreddit}: {brief.nicheOfDay.topPost.title}
                </a>
              </div>
            )}
          </Section>

          {/* Top Leads */}
          <Section icon={Target} iconColor="text-violet-500" title="Top Leads Today" badge={`${brief.topLeads?.length ?? 0} active`}>
            {(brief.topLeads ?? []).map((lead, i) => (
              <div key={i} className="border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold leading-tight">{lead.name}</p>
                    <p className="text-[11px] text-muted-foreground">{lead.company} · {lead.stage} · {lead.value} · {lead.probability}</p>
                  </div>
                  <Link href="/pipeline" className="text-[10px] text-gold hover:underline flex-shrink-0">View</Link>
                </div>
                <div>
                  <Label>Why now</Label>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{lead.whyNow}</p>
                </div>
                <div>
                  <Label>Approach</Label>
                  <p className="text-xs mt-0.5 leading-relaxed">{lead.approach}</p>
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Label>Opening line</Label>
                  <p className="text-xs mt-0.5 italic leading-relaxed">&ldquo;{lead.openingLine}&rdquo;</p>
                </div>
              </div>
            ))}
            {(!brief.topLeads || brief.topLeads.length === 0) && (
              <p className="text-xs text-muted-foreground">No active pipeline leads. Add opportunities in the Sales Pipeline.</p>
            )}
          </Section>

          {/* Hiring Pipeline */}
          <Section icon={Users} iconColor="text-emerald-500" title="Hiring Pipeline" badge={brief.hiringPipeline?.stageSummary?.length ? `${brief.hiringPipeline.stageSummary.length} active` : undefined}>
            {brief.hiringPipeline?.highlight && (
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2.5">
                <Label>Urgent action</Label>
                <p className="text-sm font-medium mt-0.5 leading-snug">{brief.hiringPipeline.highlight}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">{brief.hiringPipeline?.summary}</p>
            {brief.hiringPipeline?.stageSummary?.length > 0 && (
              <div>
                <Label>Applicants by stage</Label>
                <BulletList items={brief.hiringPipeline.stageSummary} />
              </div>
            )}
            {brief.hiringPipeline?.nextActions?.length > 0 && (
              <div>
                <Label>Next actions</Label>
                <BulletList items={brief.hiringPipeline.nextActions} />
              </div>
            )}
            <Link href="/jobs" className="text-xs text-gold hover:underline">View all applicants →</Link>
          </Section>

          {/* Survey Activity */}
          <Section icon={BarChart2} iconColor="text-violet-500" title="Survey Activity" badge="Last 7 days">
            <p className="text-xs text-muted-foreground leading-relaxed">{brief.surveyActivity?.summary}</p>
            {brief.surveyActivity?.insights?.length > 0 && (
              <div>
                <Label>Insights</Label>
                <BulletList items={brief.surveyActivity.insights} />
              </div>
            )}
            {brief.surveyActivity?.recommendation && (
              <div className="bg-violet-500/8 border border-violet-500/20 rounded-lg px-3 py-2">
                <Label>Recommendation</Label>
                <p className="text-xs mt-0.5 font-medium leading-relaxed">{brief.surveyActivity.recommendation}</p>
              </div>
            )}
            <Link href="/surveys" className="text-xs text-gold hover:underline">View surveys →</Link>
          </Section>

          {/* Media Standing */}
          <Section icon={Eye} iconColor="text-blue-500" title="WVW in the Market">
            <p className="text-xs text-muted-foreground leading-relaxed">{brief.mediaStanding.summary}</p>
            {brief.mediaStanding.strengths?.length > 0 && (
              <div>
                <Label>Strengths</Label>
                <BulletList items={brief.mediaStanding.strengths} color="text-emerald-600" />
              </div>
            )}
            {brief.mediaStanding.opportunities?.length > 0 && (
              <div>
                <Label>Market gaps to own</Label>
                <BulletList items={brief.mediaStanding.opportunities} />
              </div>
            )}
            {((brief.mediaStanding as { culturalSignals?: string[] }).culturalSignals?.length ?? 0) > 0 && (
              <div>
                <Label>Community signals (Neurodiversity · Hoodoo · Black Tech)</Label>
                <BulletList items={(brief.mediaStanding as { culturalSignals?: string[] }).culturalSignals ?? []} />
              </div>
            )}
            <div className="bg-muted rounded-lg px-3 py-2">
              <Label>This week's action</Label>
              <p className="text-xs mt-0.5 leading-relaxed font-medium">{brief.mediaStanding.recommendation}</p>
            </div>
          </Section>

          {/* Social Mentions */}
          <Section icon={MessageCircle} iconColor="text-sky-500" title="Social Mentions & Talk" badge="Reddit">
            <p className="text-xs text-muted-foreground leading-relaxed">{brief.socialMentions.directMentions}</p>
            <div className="flex items-start gap-2">
              <Lightbulb size={13} className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden />
              <p className="text-xs leading-relaxed">{brief.socialMentions.sentimentNote}</p>
            </div>
            {brief.socialMentions.goodTalk?.length > 0 && (
              <div>
                <Label>Positive signals</Label>
                <BulletList items={brief.socialMentions.goodTalk} color="text-emerald-600" />
              </div>
            )}
            {brief.socialMentions.watchList?.length > 0 && (
              <div>
                <Label>Watch list</Label>
                <BulletList items={brief.socialMentions.watchList} color="text-amber-600" />
              </div>
            )}
            <div className="bg-sky-500/8 border border-sky-500/20 rounded-lg px-3 py-2">
              <Label>Post or respond today</Label>
              <p className="text-xs mt-0.5 leading-relaxed font-medium">{brief.socialMentions.recommendation}</p>
            </div>
          </Section>

        </div>
      )}

      {/* Footer note */}
      {!loading && brief && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-muted-foreground">
            Sources: Reddit public API · WVW pipeline · Built with Claude ·
            <Link href="/ai-command" className="text-gold hover:underline ml-1">Full AI Command →</Link>
          </p>
        </div>
      )}
    </div>
  );
}
