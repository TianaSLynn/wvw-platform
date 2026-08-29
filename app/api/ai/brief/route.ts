/**
 * GET /api/ai/brief
 * Generates WVW's daily intelligence brief pulling from:
 *   - Reddit: HR, nonprofit, burnout, leadership, mental health, Neurodiversity,
 *             hoodoo spirituality, Black tech — plus WVW-specific searches
 *   - DB: pipeline leads, job applicants + hiring stage, survey submissions,
 *         overdue invoices, findings, meetings, audits
 *   - Claude synthesis → structured JSON brief
 *
 * Reddit public JSON API — no key required.
 * Requires OPENAI_API_KEY in env.
 * Responses cached 30 min via Next.js fetch cache.
 */

import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api-response";

// ─── Reddit helpers ───────────────────────────────────────────────────────────

type RedditPost = { title: string; score: number; url: string; subreddit: string; text: string };

async function redditTop(subreddit: string, limit = 5): Promise<RedditPost[]> {
  try {
    const r = await fetch(
      `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=${limit}`,
      {
        headers: { "User-Agent": "WVWIntelligence/1.0 (daily brief aggregator)" },
        next: { revalidate: 1800 },
      },
    );
    if (!r.ok) return [];
    const json = await r.json() as { data?: { children?: Array<{ data: { title: string; score: number; url: string; subreddit: string; selftext: string } }> } };
    return (json.data?.children ?? []).map(c => ({
      title: c.data.title,
      score: c.data.score,
      url: c.data.url,
      subreddit: c.data.subreddit,
      text: (c.data.selftext ?? "").slice(0, 300),
    }));
  } catch { return []; }
}

async function redditSearch(query: string, limit = 4): Promise<RedditPost[]> {
  try {
    const r = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=month&limit=${limit}`,
      {
        headers: { "User-Agent": "WVWIntelligence/1.0 (daily brief aggregator)" },
        next: { revalidate: 1800 },
      },
    );
    if (!r.ok) return [];
    const json = await r.json() as { data?: { children?: Array<{ data: { title: string; score: number; url: string; subreddit: string; permalink: string; selftext: string } }> } };
    return (json.data?.children ?? []).map(c => ({
      title: c.data.title,
      score: c.data.score,
      url: `https://reddit.com${c.data.permalink}`,
      subreddit: c.data.subreddit,
      text: (c.data.selftext ?? "").slice(0, 300),
    }));
  } catch { return []; }
}

// ─── Hiring stage label ───────────────────────────────────────────────────────

function hiringStageLabel(status: string, interviewAt: Date | null): string {
  const stageMap: Record<string, string> = {
    NEW:        "Application received",
    REVIEWING:  "Under review",
    INTERVIEW:  interviewAt ? `Interview scheduled (${interviewAt.toLocaleDateString()})` : "Interview stage",
    OFFERED:    "Offer extended",
    HIRED:      "Hired ✓",
    REJECTED:   "Not moving forward",
    WITHDRAWN:  "Withdrew",
  };
  return stageMap[status] ?? status;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday   = new Date(now); endOfToday.setHours(23, 59, 59, 999);
    const last7Days    = new Date(Date.now() - 7  * 86400000);
    const last30Days   = new Date(Date.now() - 30 * 86400000);

    // ── 1. Gather DB context (all parallel) ─────────────────────────────────
    const [
      leads,
      overdueInvoices,
      openFindings,
      pendingPto,
      todayMeetings,
      activeAudits,
      recentApplicants,
      recentSurveySubmissions,
      activeSurveys,
    ] = await Promise.all([

      // Pipeline opportunities
      db.opportunity.findMany({
        where: { orgId: user.orgId, stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
        include: {
          client: { select: { name: true, industry: true } },
          activities: {
            orderBy: { occurredAt: "desc" },
            take: 1,
            select: { type: true, subject: true, occurredAt: true },
          },
        },
        orderBy: [{ probability: "desc" }, { value: "desc" }],
        take: 7,
      }),

      // Finance
      db.invoice.count({ where: { orgId: user.orgId, status: "OVERDUE" } }),

      // Audit findings
      db.auditFinding.count({
        where: { audit: { orgId: user.orgId }, status: "OPEN", severity: { in: ["CRITICAL", "HIGH"] } },
      }),

      // HR
      db.ptoRequest.count({ where: { orgId: user.orgId, status: "PENDING" } }),

      // Today's meetings
      db.meeting.findMany({
        where: { orgId: user.orgId, scheduledAt: { gte: startOfToday, lte: endOfToday } },
        select: { title: true, scheduledAt: true },
        orderBy: { scheduledAt: "asc" },
      }),

      // Active audits
      db.audit.count({
        where: { orgId: user.orgId, status: { in: ["PLANNING", "FIELDWORK", "REVIEW", "REPORTING"] } },
      }),

      // Job applicants — last 30 days, all statuses, with posting info
      db.jobApplication.findMany({
        where: { orgId: user.orgId, appliedAt: { gte: last30Days } },
        include: {
          posting: { select: { title: true, department: true } },
        },
        orderBy: { appliedAt: "desc" },
        take: 20,
      }),

      // Recent survey submissions — last 7 days
      db.surveySubmission.findMany({
        where: {
          survey: { orgId: user.orgId },
          completedAt: { gte: last7Days, not: null },
        },
        include: {
          survey: { select: { title: true } },
        },
        orderBy: { completedAt: "desc" },
        take: 30,
      }),

      // Active published surveys
      db.survey.findMany({
        where: { orgId: user.orgId, status: "ACTIVE" },
        select: { id: true, title: true, status: true },
        take: 10,
      }),
    ]);

    // ── 2. Fetch Reddit — all subreddits in parallel ─────────────────────────
    const [
      hrPosts,
      nonprofitPosts,
      burnoutPosts,
      leadershipPosts,
      mentalhealthPosts,
      neurodiversityPosts,
      hoodooPosts,
      blacktechPosts,
      wvwMentions,
      psafePosts,
      neuroPosts,
      blackBusinessPosts,
    ] = await Promise.all([
      redditTop("humanresources",    5),
      redditTop("nonprofit",         5),
      redditTop("burnout",           4),
      redditTop("leadership",        4),
      redditTop("mentalhealth",      4),
      redditTop("Neurodiversity",    5),  // r/Neurodiversity
      redditTop("hoodoospirituality",4),  // r/hoodoospirituality
      redditTop("blacktech",         4),  // r/blacktech
      redditSearch("Wholistic Vibes Wellness OR \"WVW consulting\" OR \"WVW wellness\"", 5),
      redditSearch("psychological safety workplace 2025", 5),
      redditSearch("neurodivergent workplace accommodation 2025", 5),
      redditSearch("Black woman entrepreneur consulting 2025", 4),
    ]);

    const allNichePosts = [
      ...hrPosts, ...nonprofitPosts, ...burnoutPosts, ...leadershipPosts,
      ...mentalhealthPosts, ...neurodiversityPosts, ...psafePosts, ...neuroPosts,
    ];

    const culturalPosts = [...hoodooPosts, ...blacktechPosts, ...blackBusinessPosts];

    // ── 3. Shape data for prompt ─────────────────────────────────────────────

    const leadsContext = leads.map(l => ({
      name: l.name,
      company: l.client?.name ?? "Unknown",
      industry: l.client?.industry ?? "",
      stage: l.stage,
      value: l.value ? `$${l.value.toLocaleString()}` : "TBD",
      probability: `${l.probability}%`,
      lastActivity: l.activities[0]
        ? `${l.activities[0].type} — "${l.activities[0].subject}" (${new Date(l.activities[0].occurredAt).toLocaleDateString()})`
        : "No recent activity",
    }));

    // Group applicants by hiring stage
    const applicantsByStage = recentApplicants.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {});

    const applicantsContext = recentApplicants.slice(0, 15).map(a => ({
      name: `${a.firstName} ${a.lastName}`,
      role: a.posting.title,
      department: a.posting.department ?? "",
      stage: hiringStageLabel(a.status, a.interviewAt),
      appliedDate: a.appliedAt.toLocaleDateString(),
      email: a.email,
    }));

    // Survey submission context
    const surveysByTitle = recentSurveySubmissions.reduce<Record<string, number>>((acc, s) => {
      const title = s.survey.title;
      acc[title] = (acc[title] ?? 0) + 1;
      return acc;
    }, {});

    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    // ── 4. Build Claude prompt ───────────────────────────────────────────────
    const prompt = `You are the AI intelligence assistant for Wholistic Vibes Wellness (WVW), a Black-woman-owned consulting firm specializing in psychological safety, neuroinclusion, Black mental health, and burnout prevention. The founder/CEO is neurodivergent (ADHD, Anxiety, PTSD) and leads a growing consulting and CHW Academy operation based in Baltimore, MD.

Today is ${dateStr}.

Generate a structured daily intelligence brief in valid JSON. Use ALL data provided below.

═══════════════════════════════════════════
PIPELINE LEADS (${leads.length} active opportunities):
═══════════════════════════════════════════
${JSON.stringify(leadsContext, null, 2)}

═══════════════════════════════════════════
HIRING PIPELINE — APPLICANTS (last 30 days):
═══════════════════════════════════════════
Summary by stage: ${JSON.stringify(applicantsByStage)}
Total applicants: ${recentApplicants.length}

Individual applicants:
${applicantsContext.map(a => `• ${a.name} — ${a.role} (${a.department}) — Stage: ${a.stage} — Applied: ${a.appliedDate}`).join("\n") || "No recent applicants."}

═══════════════════════════════════════════
SURVEY ACTIVITY (last 7 days):
═══════════════════════════════════════════
Completed submissions by survey:
${Object.entries(surveysByTitle).map(([title, count]) => `• "${title}": ${count} response${count !== 1 ? "s" : ""}`).join("\n") || "No completed survey submissions in the last 7 days."}

Active surveys currently live: ${activeSurveys.map(s => `"${s.title}"`).join(", ") || "None"}

═══════════════════════════════════════════
BUSINESS PULSE:
═══════════════════════════════════════════
- Overdue invoices: ${overdueInvoices}
- Open critical/high audit findings: ${openFindings}
- Pending PTO requests: ${pendingPto}
- Today's meetings: ${todayMeetings.map(m => `${m.title} at ${new Date(m.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`).join(", ") || "None"}
- Active audits: ${activeAudits}

═══════════════════════════════════════════
REDDIT — WVW'S CORE NICHE (HR, Wellness, Nonprofit, Burnout, Leadership):
═══════════════════════════════════════════
${allNichePosts.slice(0, 20).map(p => `[r/${p.subreddit}] "${p.title}" (score: ${p.score})`).join("\n") || "No posts found."}

═══════════════════════════════════════════
REDDIT — NEURODIVERSITY (r/Neurodiversity):
═══════════════════════════════════════════
${neurodiversityPosts.map(p => `[r/${p.subreddit}] "${p.title}" (score: ${p.score})`).join("\n") || "No posts found."}

═══════════════════════════════════════════
REDDIT — CULTURAL & COMMUNITY (r/hoodoospirituality, r/blacktech):
═══════════════════════════════════════════
${culturalPosts.map(p => `[r/${p.subreddit}] "${p.title}" (score: ${p.score})`).join("\n") || "No posts found."}

═══════════════════════════════════════════
WVW MENTIONS & RELATED BRAND SEARCHES ON REDDIT:
═══════════════════════════════════════════
${wvwMentions.length > 0 ? wvwMentions.map(p => `[r/${p.subreddit}] "${p.title}" — ${p.url}`).join("\n") : "No direct WVW mentions found on Reddit this period."}

Black entrepreneur/consulting discussions:
${blackBusinessPosts.map(p => `[r/${p.subreddit}] "${p.title}"`).join("\n") || "None found."}

═══════════════════════════════════════════

Return ONLY valid JSON — no markdown fences, no extra text before or after:
{
  "nicheOfDay": {
    "topic": "string — the single biggest conversation trending in WVW's niche today",
    "summary": "string — 2-3 sentences on what's being discussed and why it matters right now",
    "whyItMattersForWVW": "string — specific relevance to WVW's services and positioning",
    "contentIdea": "string — a ready-to-post LinkedIn angle WVW should use today, written as a content hook",
    "talkingPoints": ["string", "string", "string"],
    "topPost": { "title": "string", "subreddit": "string", "url": "string" }
  },
  "topLeads": [
    {
      "name": "string",
      "company": "string",
      "stage": "string",
      "value": "string",
      "probability": "string",
      "whyNow": "string — why this lead deserves attention today specifically",
      "approach": "string — specific, actionable recommended next step",
      "openingLine": "string — suggested first sentence for outreach or call"
    }
  ],
  "hiringPipeline": {
    "summary": "string — 2-3 sentences on the current state of WVW's hiring pipeline",
    "stageSummary": ["string — one line per applicant or stage group, e.g. '2 applicants ready for interview: [names] for [role]'"],
    "nextActions": ["string — specific actions to move the hiring process forward today"],
    "highlight": "string — the most urgent hiring action item"
  },
  "surveyActivity": {
    "summary": "string — what the survey response data tells us about WVW's audience engagement",
    "insights": ["string — 2-3 observations from recent survey submissions"],
    "recommendation": "string — what to do with this data or which survey to push next"
  },
  "mediaStanding": {
    "summary": "string — honest assessment of WVW's current market visibility and positioning",
    "strengths": ["string"],
    "opportunities": ["string — specific gaps in the market WVW can own based on today's Reddit data"],
    "culturalSignals": ["string — what r/Neurodiversity, r/hoodoospirituality, and r/blacktech tell us about WVW's audience"],
    "recommendation": "string — one concrete visibility action for this week"
  },
  "socialMentions": {
    "directMentions": "string — summary of any WVW mentions found",
    "sentimentNote": "string — honest sentiment assessment",
    "goodTalk": ["string — positive signals or conversations WVW should amplify"],
    "watchList": ["string — competitive threats or concerning narratives to monitor"],
    "recommendation": "string — what to post or respond to today across LinkedIn, Reddit, or social"
  },
  "businessPulse": {
    "topPriority": "string — the single most important thing for WVW to act on today",
    "alerts": ["string"],
    "quickWins": ["string — 2-3 fast actions that move the business forward today"]
  }
}`;

    // ── 5. Generate the governed WVW briefing ───────────────────────────────
    const openai = new OpenAI();
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.5",
      input: prompt,
    });
    const rawText = response.output_text;
    const jsonText = rawText.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();

    let brief: unknown;
    try {
      brief = JSON.parse(jsonText);
    } catch {
      return new Response(JSON.stringify({
        error: "Brief parsing failed",
        raw: rawText.slice(0, 500),
      }), { status: 500 });
    }

    return ok({ brief, generatedAt: now.toISOString() });

  } catch (e) {
    console.error("[AI Brief Error]", e);
    const msg = e instanceof Error ? e.message.toLowerCase() : "";
    const isAuthError = msg.includes("401") || msg.includes("authentication") ||
      msg.includes("invalid_api_key") || msg.includes("api key") ||
      msg.includes("apikey") || (e as { status?: number })?.status === 401;
    if (isAuthError) {
      return new Response(JSON.stringify({
        error: "api_key_missing",
        message: "OPENAI_API_KEY is not configured for this deployment.",
      }), { status: 503 });
    }
    return serverError(e);
  }
}
