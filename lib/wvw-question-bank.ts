/**
 * WVW Organizational Intelligence Engine™ — Master Question Bank v1.0
 *
 * Defines the 8 core audit templates:
 *   1. Entry / Pre-Audit (22q) — Client Fit & Readiness
 *   2. Core WVW Organizational Resilience & Culture Audit (60q)
 *   3. Psychological Safety Deep-Dive (62q)
 *   4. Burnout Risk & Operational Sustainability Deep-Dive (58q)
 *   5. Leadership Integrity & Trust Deep-Dive (60q)
 *   6. Moral Injury & Ethical Alignment Deep-Dive (55q)
 *   7. Neuroinclusion Deep-Dive (58q)
 *   8. DEI Reality Deep-Dive (62q)
 *
 * Each question includes full WVW metadata.
 */

export type WvwQuestionType =
  | "Likert" | "Frequency" | "Severity" | "Scenario" | "Evidence"
  | "OpenEnded" | "Ranking" | "Matrix" | "Confidence" | "HiddenTrigger"
  | "Contradiction" | "MultipleChoice";

export type ScenarioOption = { letter: string; text: string; score: number };

export type WvwQuestion = {
  qId: string;
  question: string;
  guidance: string | null;
  questionType: WvwQuestionType;
  reverseScored: boolean;
  riskWeight: number;
  riskTag: string | null;
  pathwayTriggers: string[];
  industryTags: string[];
  isRequired: boolean;
  evidenceRequired: boolean;
  scenarioOptions?: ScenarioOption[];
};

export type WvwSection = {
  title: string;
  description: string;
  questions: WvwQuestion[];
};

export type WvwAuditTemplate = {
  name: string;
  description: string;
  auditType: string;
  isGlobal: boolean;
  version: string;
  industryTags: string[];
  sections: WvwSection[];
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function q(
  qId: string,
  question: string,
  questionType: WvwQuestionType,
  reverseScored: boolean,
  riskWeight: number,
  riskTag: string | null,
  pathwayTriggers: string[],
  industryTags: string[] = ["general"],
  scenarioOptions?: ScenarioOption[],
  isRequired = true,
  evidenceRequired = false,
): WvwQuestion {
  return {
    qId, question, guidance: null, questionType, reverseScored, riskWeight,
    riskTag, pathwayTriggers, industryTags, isRequired, evidenceRequired,
    scenarioOptions,
  };
}

const STANDARD_SCENARIO: ScenarioOption[] = [
  { letter: "A", text: "Act immediately and transparently", score: 100 },
  { letter: "B", text: "Acknowledge but delay action", score: 75 },
  { letter: "C", text: "Downplay or minimize the issue", score: 25 },
  { letter: "D", text: "Dismiss or blame others", score: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATE 1: ENTRY / PRE-AUDIT (22 questions)
// ─────────────────────────────────────────────────────────────────────────────

const ENTRY_AUDIT: WvwAuditTemplate = {
  name: "WVW Entry Fit Assessment™",
  description: "22-question pre-audit assessing leadership readiness, budget, change willingness, psychological readiness, and organizational fit. Determines which audit track is most appropriate.",
  auditType: "HR",
  isGlobal: true,
  version: "1.0",
  industryTags: ["general", "government", "tech", "healthcare"],
  sections: [
    {
      title: "Leadership Commitment & Readiness",
      description: "Assessing whether senior leadership is truly committed to culture transformation.",
      questions: [
        q("ENTRY_01", "I believe our senior leadership is fully committed to investing time and resources in culture transformation.", "Likert", false, 1.2, "readiness", ["leadership-alignment"], ["general"]),
        q("ENTRY_02", "We have dedicated budget allocated this fiscal year for external culture and organizational health initiatives.", "Likert", false, 1.1, "readiness", ["leadership-alignment"], ["general"]),
        q("ENTRY_03", "Leadership tends to view culture work as a 'nice-to-have' rather than a business imperative.", "Likert", true, 1.3, "readiness", ["leadership-alignment"], ["general"]),
        q("ENTRY_04", "Our organization is willing to make difficult decisions if the audit reveals serious issues.", "Likert", false, 1.2, "readiness", ["leadership-alignment"], ["general"]),
        q("ENTRY_05", "Employees and leaders are psychologically ready to receive honest feedback about our culture.", "Likert", false, 1.0, "readiness", [], ["general"]),
        q("ENTRY_06", "How often does internal resistance to change surface when new initiatives are introduced?", "Frequency", true, 1.3, "readiness", ["culture-trust-rebuild"], ["general"]),
      ],
    },
    {
      title: "Urgency & Fit",
      description: "Determining the level of urgency and organizational fit for WVW engagement.",
      questions: [
        q("ENTRY_07", "Which best describes your organization's current urgency around culture and employee well-being?", "MultipleChoice", false, 1.5, "readiness", ["leadership-alignment"], ["general"], [
          { letter: "A", text: "Critical — risk of talent loss or reputational damage", score: 100 },
          { letter: "B", text: "High — clear warning signs present", score: 75 },
          { letter: "C", text: "Moderate — some awareness of issues", score: 50 },
          { letter: "D", text: "Low — business as usual", score: 25 },
        ]),
        q("ENTRY_08", "If the audit reveals significant leadership trust gaps, leadership would most likely:", "Scenario", false, 1.5, "readiness", ["leadership-alignment"], ["general"], STANDARD_SCENARIO),
        q("ENTRY_09", "We have a high level of data transparency and are willing to share internal metrics for the audit.", "Likert", false, 1.0, "readiness", [], ["general"]),
        q("ENTRY_10", "There is significant internal skepticism that this audit will lead to real change.", "Likert", true, 1.2, "readiness", ["culture-trust-rebuild"], ["general"]),
        q("ENTRY_11", "How confident are you that leadership will follow through on audit recommendations?", "Confidence", false, 1.3, "readiness", ["leadership-alignment"], ["general"]),
      ],
    },
    {
      title: "Accountability & Change Tolerance",
      description: "Measuring organizational tolerance for accountability and real change.",
      questions: [
        q("ENTRY_12", "Our organization has a track record of following through on culture and employee well-being initiatives.", "Likert", false, 1.1, "accountability", ["performance-accountability"], ["general"]),
        q("ENTRY_13", "Leadership is willing to be personally held accountable for culture outcomes.", "Likert", false, 1.3, "accountability", ["performance-accountability"], ["general"]),
        q("ENTRY_14", "How often are culture or well-being commitments made but not followed through?", "Frequency", true, 1.2, "accountability", ["performance-accountability"], ["general"]),
        q("ENTRY_15", "Our senior team has openly discussed the need for external support on organizational health.", "Likert", false, 1.0, "readiness", [], ["general"]),
        q("ENTRY_16", "What is one major barrier leadership believes would prevent successful culture change?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Psychological & Structural Readiness",
      description: "Red-flag trigger questions for low-fit or high-risk engagement paths.",
      questions: [
        q("ENTRY_17", "Our organization has experienced significant leadership turnover in the past 12 months.", "HiddenTrigger", false, 1.2, "readiness", ["leadership-alignment"], ["general"]),
        q("ENTRY_18", "Employees currently feel psychologically safe enough to participate honestly in surveys and audits.", "Likert", false, 1.3, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("ENTRY_19", "Past engagement surveys or culture initiatives have led to visible, meaningful change.", "Likert", false, 1.1, "readiness", ["culture-trust-rebuild"], ["general"]),
        q("ENTRY_20", "There are active, unresolved conflicts or grievances at the leadership level right now.", "HiddenTrigger", true, 1.4, "readiness", ["conflict-resolution"], ["general"]),
        q("ENTRY_21", "Rank your organization's top 3 readiness factors (most important first).", "Ranking", false, 0.5, null, [], ["general"]),
        q("ENTRY_22", "How severe is the current impact of culture-related issues on business outcomes?", "Severity", false, 1.5, "readiness", ["leadership-alignment"], ["general"]),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATE 2: CORE WVW ORGANIZATIONAL RESILIENCE & CULTURE AUDIT™ (60q)
// ─────────────────────────────────────────────────────────────────────────────

const CORE_AUDIT: WvwAuditTemplate = {
  name: "WVW Core Organizational Resilience & Culture Audit™",
  description: "The flagship 60-question adaptive audit across 5 domains: Leadership Trust, Psychological Safety, Burnout Risk, Neuroinclusion & DEI, and Moral Injury. Establishes baseline organizational intelligence and triggers deep-dive pathways.",
  auditType: "HR",
  isGlobal: true,
  version: "1.0",
  industryTags: ["general", "government", "tech", "healthcare"],
  sections: [
    {
      title: "Domain 1: Leadership Trust & Integrity",
      description: "Measures trust in senior leadership, ethical behavior, and accountability — the foundation of organizational health. (12 questions)",
      questions: [
        q("CORE_LT_01", "I trust senior leaders to act with integrity even when no one is watching.", "Likert", false, 1.3, "leadership", ["leadership-alignment"], ["general"]),
        q("CORE_LT_02", "Leaders sometimes bend rules or cut ethical corners to achieve results.", "Likert", true, 1.3, "leadership", ["leadership-integrity-program"], ["general"]),
        q("CORE_LT_03", "Senior leaders communicate honestly about the organization's challenges and direction.", "Likert", false, 1.2, "trust", ["leadership-alignment"], ["general"]),
        q("CORE_LT_04", "I believe leadership would respond appropriately if a serious ethical concern were raised.", "Confidence", false, 1.2, "leadership", ["leadership-integrity-program"], ["general"]),
        q("CORE_LT_05", "Leaders here follow through on commitments they make to employees.", "Likert", false, 1.2, "accountability", ["performance-accountability"], ["general"]),
        q("CORE_LT_06", "There is a gap between what leadership says and what they actually do.", "Contradiction", true, 1.3, "transparency-claim", ["culture-trust-rebuild"], ["general"]),
        q("CORE_LT_07", "A senior leader publicly commits to transparency but privately pressures teams to hit numbers at any cost. What most likely happens?", "Scenario", false, 1.4, "leadership", ["ethics-realignment"], ["general"], [
          { letter: "A", text: "The behavior is addressed openly and corrected", score: 100 },
          { letter: "B", text: "The behavior is acknowledged but quietly tolerated", score: 50 },
          { letter: "C", text: "Most employees know but say nothing out of fear", score: 25 },
          { letter: "D", text: "It is normalized as 'just how things work here'", score: 0 },
        ]),
        q("CORE_LT_08", "Which of the following currently exist in your organization? (select all that apply)", "Evidence", false, 1.1, "accountability", [], ["general"], undefined, true, true),
        q("CORE_LT_09", "Leaders show vulnerability and model growth by acknowledging their own mistakes.", "Likert", false, 1.1, "leadership", ["leadership-alignment"], ["general"]),
        q("CORE_LT_10", "How often does leadership act inconsistently with the values they publicly promote?", "Frequency", true, 1.3, "values-conflict", ["ethics-realignment"], ["general"]),
        q("CORE_LT_11", "Favoritism or unequal treatment from senior leadership is a real issue in our organization.", "Likert", true, 1.2, "favoritism", ["equity-accountability"], ["general"]),
        q("CORE_LT_12", "Overall, I rate my confidence in senior leadership's ethical decision-making as:", "Likert", false, 1.3, "leadership", ["leadership-alignment"], ["general"]),
      ],
    },
    {
      title: "Domain 2: Psychological Safety & Communication",
      description: "Edmondson-adapted psychological safety measurement combined with communication health indicators. (13 questions)",
      questions: [
        q("CORE_PS_01", "If I make a mistake on this team, it is not held against me.", "Likert", false, 1.3, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("CORE_PS_02", "Members of this team are able to bring up problems and tough issues.", "Likert", false, 1.3, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("CORE_PS_03", "People on this team sometimes reject others for being different.", "Likert", true, 1.3, "inclusion", ["belonging-inclusion"], ["general"]),
        q("CORE_PS_04", "It is safe to take a risk on this team.", "Likert", false, 1.2, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("CORE_PS_05", "It is difficult to ask other members of this team for help.", "Likert", true, 1.2, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("CORE_PS_06", "No one on this team would deliberately act in a way that undermines my efforts.", "Likert", false, 1.2, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("CORE_PS_07", "Working with members of this team, my unique skills and talents are valued and utilized.", "Likert", false, 1.2, "inclusion", ["belonging-inclusion"], ["general"]),
        q("CORE_PS_08", "I stay silent about problems or concerns to protect my career or standing.", "Contradiction", true, 1.4, "voice-silence", ["psych-safety-infrastructure"], ["general"]),
        q("CORE_PS_09", "Leadership genuinely encourages employees to share concerns and difficult feedback.", "Likert", false, 1.2, "leadership-feedback", ["leadership-alignment"], ["general"]),
        q("CORE_PS_10", "How often do you hesitate to speak up in meetings or team settings?", "Frequency", true, 1.2, "speaking-up", ["voice-inclusion"], ["general"]),
        q("CORE_PS_11", "How confident are you that raising a concern would not negatively impact your career?", "Confidence", false, 1.3, "retaliation-fear", ["retaliation-prevention"], ["general"]),
        q("CORE_PS_12", "Communication in our organization is transparent, timely, and honest.", "Likert", false, 1.1, "communication", ["communication-clarity"], ["general"]),
        q("CORE_PS_13", "Describe a time when you or a colleague chose not to speak up. What happened?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 3: Burnout Risk & Operational Sustainability",
      description: "Maslach Burnout Inventory-adapted assessment covering emotional exhaustion, cynicism, and workload sustainability. (12 questions)",
      questions: [
        q("CORE_BR_01", "How often do you feel emotionally drained from your work?", "Frequency", false, 1.4, "burnout", ["burnout-recovery", "workload-sustainability"], ["general"]),
        q("CORE_BR_02", "How severe is your current level of burnout?", "Severity", false, 1.5, "burnout", ["burnout-recovery"], ["general"]),
        q("CORE_BR_03", "I feel cynical or detached about the value of my work.", "Likert", false, 1.3, "cynicism", ["culture-trust-rebuild", "burnout-recovery"], ["general"]),
        q("CORE_BR_04", "I feel confident and effective in my role.", "Likert", true, 1.2, "burnout", ["burnout-prevention"], ["general"]),
        q("CORE_BR_05", "My workload is consistently sustainable and manageable.", "Likert", true, 1.3, "workload", ["workload-sustainability"], ["general"]),
        q("CORE_BR_06", "How often are you expected to be available after work hours or on weekends?", "Frequency", false, 1.2, "workload", ["workload-sustainability"], ["general"]),
        q("CORE_BR_07", "Our organization actively monitors and prevents burnout.", "Likert", false, 1.2, "burnout", ["burnout-prevention"], ["general"]),
        q("CORE_BR_08", "Rank the top 3 burnout drivers in your organization.", "Ranking", false, 0.5, null, [], ["general"]),
        q("CORE_BR_09", "You are asked to work another weekend during a high-priority project. What typically happens in your team?", "Scenario", false, 1.3, "workload", ["workload-sustainability"], ["general"], [
          { letter: "A", text: "Clear boundaries are respected and alternatives are found", score: 100 },
          { letter: "B", text: "The request is framed as optional but pressure is implied", score: 50 },
          { letter: "C", text: "Most comply without complaint due to fear of repercussions", score: 25 },
          { letter: "D", text: "Weekend work is expected and never questioned", score: 0 },
        ]),
        q("CORE_BR_10", "Does your organization have a formal burnout prevention or recovery policy?", "Evidence", false, 1.0, "burnout", ["burnout-prevention"], ["general"]),
        q("CORE_BR_11", "I have adequate recovery time between demanding projects or busy seasons.", "Likert", false, 1.2, "workload", ["workload-sustainability"], ["general"]),
        q("CORE_BR_12", "How often do you feel that your workload is pushing you toward chronic stress or exhaustion?", "Frequency", false, 1.4, "exhaustion", ["burnout-recovery"], ["general"]),
      ],
    },
    {
      title: "Domain 4: Neuroinclusion & DEI Reality",
      description: "Measures the lived experience of belonging, equity, and neuroinclusion — going beyond policy to practice. (11 questions)",
      questions: [
        q("CORE_DEI_01", "I can bring my whole self to work without hiding parts of my identity.", "Likert", false, 1.3, "belonging", ["belonging-inclusion"], ["general"]),
        q("CORE_DEI_02", "I sometimes feel I need to code-switch or mask aspects of myself to fit in.", "Likert", true, 1.3, "code-switching", ["belonging-inclusion", "dei-reality-intervention"], ["general"]),
        q("CORE_DEI_03", "Promotion and growth opportunities are distributed fairly regardless of identity.", "Likert", false, 1.3, "equity", ["equity-accountability"], ["general"]),
        q("CORE_DEI_04", "Neurodivergent employees (ADHD, autism, dyslexia, etc.) feel safe disclosing their needs here.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("CORE_DEI_05", "How often do microaggressions or exclusionary behaviors occur in your team?", "Frequency", false, 1.3, "bias", ["dei-reality-intervention"], ["general"]),
        q("CORE_DEI_06", "An employee from an underrepresented group shares a cultural perspective in a meeting. What most likely happens?", "Scenario", false, 1.3, "belonging", ["belonging-inclusion"], ["general"], [
          { letter: "A", text: "The perspective is valued and meaningfully incorporated", score: 100 },
          { letter: "B", text: "It is politely acknowledged but not acted on", score: 60 },
          { letter: "C", text: "It is dismissed or treated as secondary", score: 25 },
          { letter: "D", text: "Negative social or career consequences follow", score: 0 },
        ]),
        q("CORE_DEI_07", "Our DEI commitments result in real, measurable change rather than performative statements.", "Likert", false, 1.3, "performative-dei", ["dei-reality-intervention"], ["general"]),
        q("CORE_DEI_08", "Which DEI infrastructure currently exists and functions effectively in your organization?", "Evidence", false, 1.0, "equity", ["dei-systems-build"], ["general"], undefined, true, true),
        q("CORE_DEI_09", "How confident are you that requesting accommodations will not negatively impact your career?", "Confidence", false, 1.2, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("CORE_DEI_10", "Our organization values diversity in leadership and decision-making, not just entry-level hiring.", "Likert", false, 1.2, "equity", ["equity-accountability"], ["general"]),
        q("CORE_DEI_11", "What is the biggest gap between your organization's DEI commitments and lived reality?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 5: Moral Injury & Ethical Alignment",
      description: "OMIS-adapted assessment of moral injury, ethical misalignment, value conflicts, and organizational integrity. (12 questions)",
      questions: [
        q("CORE_MI_01", "I have been asked to do things that violated my personal core values.", "Likert", false, 1.5, "moral-transgression", ["moral-injury-recovery", "ethics-realignment"], ["general"]),
        q("CORE_MI_02", "I feel that leadership has betrayed the trust of employees through their decisions or inactions.", "Likert", false, 1.4, "betrayal", ["moral-injury-recovery", "leadership-integrity-program"], ["general"]),
        q("CORE_MI_03", "How often do you experience guilt, shame, or moral distress about things that happen at work?", "Frequency", false, 1.4, "guilt-shame", ["moral-injury-recovery"], ["general"]),
        q("CORE_MI_04", "How severe is the moral distress you experience from work-related ethical conflicts?", "Severity", false, 1.5, "moral-injury", ["moral-injury-recovery"], ["general"]),
        q("CORE_MI_05", "Our organization's stated values align with how decisions are actually made day-to-day.", "Likert", false, 1.3, "values-stated", ["ethics-realignment"], ["general"]),
        q("CORE_MI_06", "There is a significant gap between what this organization says it values and what it actually rewards.", "Contradiction", false, 1.4, "values-violated", ["ethics-realignment"], ["general"]),
        q("CORE_MI_07", "I feel supported if I need to report an ethical concern or policy violation.", "Likert", false, 1.3, "reporting-fear", ["reporting-safety"], ["general"]),
        q("CORE_MI_08", "How often are ethical concerns raised but not adequately addressed?", "Frequency", false, 1.3, "reporting-fear", ["reporting-safety", "retaliation-prevention"], ["general"]),
        q("CORE_MI_09", "Our organization has clear, safe channels for reporting ethical violations.", "Evidence", false, 1.1, "reporting-fear", ["reporting-safety"], ["general"], undefined, true, true),
        q("CORE_MI_10", "I am able to do work that aligns with my personal sense of purpose and meaning.", "Likert", false, 1.2, "values-conflict", ["moral-injury-recovery"], ["general"]),
        q("CORE_MI_11", "How confident are you that raising an ethical concern would be taken seriously and handled appropriately?", "Confidence", false, 1.3, "reporting-fear", ["reporting-safety"], ["general"]),
        q("CORE_MI_12", "Describe the most significant ethical challenge you have faced in this organization.", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATE 3: PSYCHOLOGICAL SAFETY DEEP-DIVE (62q)
// ─────────────────────────────────────────────────────────────────────────────

const PSYCH_SAFETY_DEEP_DIVE: WvwAuditTemplate = {
  name: "WVW Psychological Safety Deep-Dive Audit™",
  description: "62-question deep-dive covering all dimensions of psychological safety: leadership modeling, speaking up, error response, interpersonal inclusion, and retaliation fear. Ideal for Government/Defense, high-stakes environments.",
  auditType: "HR",
  isGlobal: true,
  version: "1.0",
  industryTags: ["general", "government", "tech", "healthcare"],
  sections: [
    {
      title: "Domain 1: Leadership Trust & Safety Modeling",
      description: "How leaders demonstrate or undermine psychological safety by their own behavior. (12 questions)",
      questions: [
        q("PS_D1_01", "Senior leaders here demonstrate that it is safe to speak up.", "Likert", false, 1.25, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D1_02", "My leader would be upset if I publicly disagreed with them.", "Likert", true, 1.3, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D1_03", "How confident are you that your direct leader would support you if you raised a difficult issue?", "Confidence", false, 1.2, "trust", ["leadership-alignment"], ["general"]),
        q("PS_D1_04", "A team member challenges a senior leader's idea in a meeting. What most likely happens?", "Scenario", false, 1.4, "psychological-safety", ["psych-safety-infrastructure"], ["general"], [
          { letter: "A", text: "The idea is discussed openly and respectfully", score: 100 },
          { letter: "B", text: "The leader thanks them but the idea goes nowhere", score: 65 },
          { letter: "C", text: "Subtle negative feedback follows later", score: 25 },
          { letter: "D", text: "Career impact is feared and expected", score: 0 },
        ]),
        q("PS_D1_05", "Leaders here model vulnerability by acknowledging their own mistakes openly.", "Likert", false, 1.2, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D1_06", "I have seen leaders punish or sideline employees who raised concerns.", "HiddenTrigger", true, 1.5, "retaliation", ["retaliation-prevention"], ["general"]),
        q("PS_D1_07", "Leadership actively seeks feedback on their own performance from team members.", "Likert", false, 1.1, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D1_08", "Leaders respond to bad news with blame rather than curiosity.", "Likert", true, 1.3, "blame-culture", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D1_09", "How often does leadership take visible, meaningful action on feedback they receive?", "Frequency", false, 1.2, "accountability", ["performance-accountability"], ["general"]),
        q("PS_D1_10", "I trust that my manager would advocate for me if I raised a concern with their own leadership.", "Likert", false, 1.2, "trust", ["leadership-alignment"], ["general"]),
        q("PS_D1_11", "Leaders here treat mistakes as learning opportunities rather than failures.", "Likert", false, 1.2, "error-response", ["learning-culture"], ["general"]),
        q("PS_D1_12", "Which specific behaviors do leaders consistently model that support or undermine psychological safety?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 2: Speaking Up & Voice Safety",
      description: "Edmondson 7-item core + extensions measuring whether employees can actually speak up. (14 questions)",
      questions: [
        q("PS_D2_01", "If I make a mistake on this team, it is not held against me.", "Likert", false, 1.3, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D2_02", "Members of this team are able to bring up problems and tough issues.", "Likert", false, 1.3, "speaking-up", ["voice-inclusion"], ["general"]),
        q("PS_D2_03", "People on this team sometimes reject others for being different.", "Likert", true, 1.3, "inclusion", ["belonging-inclusion"], ["general"]),
        q("PS_D2_04", "It is safe to take a risk on this team.", "Likert", false, 1.2, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D2_05", "It is difficult to ask other members of this team for help.", "Likert", true, 1.2, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D2_06", "No one on this team would deliberately act in a way that undermines my efforts.", "Likert", false, 1.2, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D2_07", "Working with members of this team, my unique skills and talents are valued and utilized.", "Likert", false, 1.2, "inclusion", ["belonging-inclusion"], ["general"]),
        q("PS_D2_08", "I can voice concerns about unethical behavior without fear of consequences.", "Likert", false, 1.4, "reporting-fear", ["reporting-safety", "retaliation-prevention"], ["general"]),
        q("PS_D2_09", "Leadership says they want feedback, yet I stay silent to protect my career.", "Contradiction", true, 1.4, "voice-silence", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D2_10", "How often do you self-censor in team or leadership meetings?", "Frequency", false, 1.3, "speaking-up", ["voice-inclusion"], ["general"]),
        q("PS_D2_11", "Describe the last time you chose not to speak up and what held you back.", "OpenEnded", false, 0.5, null, [], ["general"]),
        q("PS_D2_12", "I feel my opinions are genuinely considered when team decisions are made.", "Likert", false, 1.2, "voice-safety", ["voice-inclusion"], ["general"]),
        q("PS_D2_13", "When I share an unpopular view, I am taken seriously rather than dismissed.", "Likert", false, 1.2, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D2_14", "How often do you feel silenced or talked over in meetings?", "Frequency", false, 1.2, "voice-safety", ["voice-inclusion"], ["general"]),
      ],
    },
    {
      title: "Domain 3: Error & Risk Response",
      description: "How the organization treats mistakes, failure, and risk-taking. (12 questions)",
      questions: [
        q("PS_D3_01", "When mistakes happen here, the focus is on learning rather than blame.", "Likert", false, 1.3, "error-response", ["learning-culture"], ["general"]),
        q("PS_D3_02", "I am afraid to make mistakes because the consequences are disproportionate.", "Likert", true, 1.4, "error-response", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D3_03", "How often are errors or near-misses openly discussed to prevent recurrence?", "Frequency", false, 1.2, "error-response", ["learning-culture"], ["general"]),
        q("PS_D3_04", "How severe is the culture of blame when things go wrong here?", "Severity", false, 1.4, "blame-culture", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D3_05", "Our team celebrates smart risk-taking even when it does not succeed.", "Likert", false, 1.1, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D3_06", "I have avoided sharing an idea because I feared it would be criticized or dismissed.", "HiddenTrigger", false, 1.3, "speaking-up", ["voice-inclusion"], ["general"]),
        q("PS_D3_07", "A team member reports a significant error before it escalates. What most likely happens?", "Scenario", false, 1.4, "error-response", ["learning-culture"], ["general"], [
          { letter: "A", text: "They are thanked for catching it early and lessons are shared", score: 100 },
          { letter: "B", text: "It is handled quietly with little to no blame", score: 70 },
          { letter: "C", text: "They are quietly penalized despite acting with integrity", score: 20 },
          { letter: "D", text: "There are formal or informal career consequences", score: 0 },
        ]),
        q("PS_D3_08", "Our organization has a formal process for learning from errors and near-misses.", "Evidence", false, 1.0, "error-response", ["learning-culture"], ["general"]),
        q("PS_D3_09", "Fear of failure prevents our team from innovating or taking necessary risks.", "Likert", true, 1.3, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D3_10", "How confident are you that experimenting and failing will not damage your career?", "Confidence", false, 1.2, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D3_11", "Leaders here publicly acknowledge their own errors and model accountability.", "Likert", false, 1.2, "error-response", ["leadership-alignment"], ["general"]),
        q("PS_D3_12", "How often does the organization analyze failure patterns to improve systems?", "Frequency", false, 1.1, "error-response", ["learning-culture"], ["general"]),
      ],
    },
    {
      title: "Domain 4: Interpersonal & Inclusion Safety",
      description: "Safety across identity groups — including race, gender, neurodiversity, and hierarchy. (12 questions)",
      questions: [
        q("PS_D4_01", "All team members, regardless of their identity or background, are treated with equal respect.", "Likert", false, 1.3, "inclusion", ["belonging-inclusion"], ["general"]),
        q("PS_D4_02", "Some groups in our organization feel less safe speaking up than others.", "HiddenTrigger", false, 1.4, "inclusion", ["belonging-inclusion", "psych-safety-infrastructure"], ["general"]),
        q("PS_D4_03", "I feel comfortable being my authentic self at work.", "Likert", false, 1.3, "belonging", ["belonging-inclusion"], ["general"]),
        q("PS_D4_04", "How often do interpersonal conflicts negatively affect psychological safety on your team?", "Frequency", false, 1.2, "psychological-safety", ["conflict-resolution"], ["general"]),
        q("PS_D4_05", "How severe is the impact of cliques or in-group/out-group dynamics on team safety?", "Severity", false, 1.3, "inclusion", ["belonging-inclusion"], ["general"]),
        q("PS_D4_06", "Employees with marginalized identities feel equally safe raising concerns as those in majority groups.", "Likert", false, 1.4, "inclusion", ["dei-reality-intervention"], ["general"]),
        q("PS_D4_07", "I have witnessed or experienced interpersonal behavior that made me feel unsafe at work.", "HiddenTrigger", false, 1.4, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D4_08", "Our team respects different communication styles, thinking patterns, and working preferences.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("PS_D4_09", "Rate the psychological safety across these dimensions in your organization.", "Matrix", false, 1.1, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("PS_D4_10", "Hierarchy in our organization gets in the way of open, honest communication.", "Likert", true, 1.2, "communication", ["communication-clarity"], ["general"]),
        q("PS_D4_11", "I feel safe disagreeing with people who have more organizational power than I do.", "Likert", false, 1.3, "voice-safety", ["voice-inclusion"], ["general"]),
        q("PS_D4_12", "Describe an experience — positive or negative — related to interpersonal safety on your team.", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 5: Retaliation & Reporting Fear",
      description: "Critical assessment of actual or perceived retaliation risk — the most severe psychological safety failure. (12 questions)",
      questions: [
        q("PS_D5_01", "I fear negative consequences if I report a concern, even through anonymous channels.", "Likert", false, 1.5, "retaliation-fear", ["retaliation-prevention", "reporting-safety"], ["general"]),
        q("PS_D5_02", "I know of colleagues who faced retaliation — formal or informal — for speaking up.", "HiddenTrigger", false, 1.5, "retaliation", ["retaliation-prevention"], ["general"]),
        q("PS_D5_03", "How often do employees self-censor because they fear career consequences?", "Frequency", false, 1.4, "voice-silence", ["retaliation-prevention"], ["general"]),
        q("PS_D5_04", "How severe is the culture of retaliation (explicit or subtle) in your organization?", "Severity", false, 1.5, "retaliation", ["retaliation-prevention"], ["general"]),
        q("PS_D5_05", "Our organization has a clearly communicated and enforced anti-retaliation policy.", "Likert", false, 1.2, "retaliation", ["retaliation-prevention"], ["general"]),
        q("PS_D5_06", "Which reporting and protection mechanisms currently exist in your organization?", "Evidence", false, 1.1, "reporting-fear", ["reporting-safety"], ["general"], undefined, true, true),
        q("PS_D5_07", "An employee reports harassment and faces subtle exclusion afterward. What most likely happens next?", "Scenario", false, 1.5, "retaliation", ["retaliation-prevention"], ["general"], [
          { letter: "A", text: "HR investigates and the retaliation is addressed formally", score: 100 },
          { letter: "B", text: "Leadership is aware but it is handled informally and quietly", score: 50 },
          { letter: "C", text: "The employee is advised to 'let it go' to preserve relationships", score: 15 },
          { letter: "D", text: "The reporter eventually leaves the organization", score: 0 },
        ]),
        q("PS_D5_08", "Anonymous reporting tools in our organization are genuinely confidential and trusted.", "Likert", false, 1.3, "reporting-fear", ["reporting-safety"], ["general"]),
        q("PS_D5_09", "How confident are you that reporting wrongdoing would be met with protection rather than punishment?", "Confidence", false, 1.4, "retaliation-fear", ["retaliation-prevention"], ["general"]),
        q("PS_D5_10", "The fear of retaliation is the primary reason I or others do not raise concerns.", "HiddenTrigger", false, 1.5, "retaliation-fear", ["retaliation-prevention"], ["general"]),
        q("PS_D5_11", "Whistleblower protections are known, accessible, and genuinely respected here.", "Likert", false, 1.2, "retaliation", ["reporting-safety"], ["government"]),
        q("PS_D5_12", "What one change would most increase your willingness to speak up about serious concerns?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATE 4: BURNOUT RISK & OPERATIONAL SUSTAINABILITY DEEP-DIVE (58q)
// ─────────────────────────────────────────────────────────────────────────────

const BURNOUT_DEEP_DIVE: WvwAuditTemplate = {
  name: "WVW Burnout Risk & Operational Sustainability Deep-Dive Audit™",
  description: "58-question MBI-adapted burnout audit across 5 domains: Emotional Exhaustion, Depersonalization/Cynicism, Personal Accomplishment, Workload & Recovery, and Organizational Drivers.",
  auditType: "HR",
  isGlobal: true,
  version: "1.0",
  industryTags: ["general", "government", "tech", "healthcare"],
  sections: [
    {
      title: "Domain 1: Emotional Exhaustion",
      description: "Core burnout dimension — measuring depletion of emotional reserves. (12 questions)",
      questions: [
        q("BURN_D1_01", "How often do you feel emotionally drained from your work?", "Frequency", false, 1.5, "exhaustion", ["burnout-recovery"], ["general"]),
        q("BURN_D1_02", "How often do you feel used up at the end of a workday?", "Frequency", false, 1.4, "exhaustion", ["burnout-recovery"], ["general"]),
        q("BURN_D1_03", "How often do you feel fatigued when you wake up and must face another day at work?", "Frequency", false, 1.4, "exhaustion", ["burnout-recovery"], ["general"]),
        q("BURN_D1_04", "How often do you feel burned out from your work?", "Frequency", false, 1.5, "burnout", ["burnout-recovery", "burnout-prevention"], ["general"]),
        q("BURN_D1_05", "How severe is your current level of emotional exhaustion?", "Severity", false, 1.5, "exhaustion", ["burnout-recovery"], ["general"]),
        q("BURN_D1_06", "How often do you feel frustrated or trapped by your job?", "Frequency", false, 1.3, "burnout", ["burnout-recovery"], ["general"]),
        q("BURN_D1_07", "Working with people all day is really a strain for me.", "Likert", false, 1.2, "exhaustion", ["burnout-recovery"], ["general"]),
        q("BURN_D1_08", "I feel energized and engaged in my work most days.", "Likert", true, 1.3, "burnout", ["burnout-prevention"], ["general"]),
        q("BURN_D1_09", "How often do work-related stress and exhaustion spill into your personal life?", "Frequency", false, 1.3, "exhaustion", ["workload-sustainability"], ["general"]),
        q("BURN_D1_10", "Our organization proactively addresses signs of emotional exhaustion in employees.", "Likert", false, 1.2, "burnout", ["burnout-prevention"], ["general"]),
        q("BURN_D1_11", "How often does your emotional exhaustion interfere with your effectiveness at work?", "Frequency", false, 1.4, "exhaustion", ["burnout-recovery"], ["general"]),
        q("BURN_D1_12", "I have adequate mental and emotional recovery time built into my work schedule.", "Likert", false, 1.3, "workload", ["workload-sustainability"], ["general"]),
      ],
    },
    {
      title: "Domain 2: Depersonalization & Cynicism",
      description: "Second core burnout dimension — disconnection and detachment from work and colleagues. (12 questions)",
      questions: [
        q("BURN_D2_01", "I feel cynical about whether my work makes any real difference.", "Likert", false, 1.3, "cynicism", ["culture-trust-rebuild", "burnout-recovery"], ["general"]),
        q("BURN_D2_02", "I have become less caring about the people I work with or serve.", "Likert", false, 1.4, "depersonalization", ["burnout-recovery"], ["general"]),
        q("BURN_D2_03", "I am increasingly indifferent to the outcomes of my work.", "Likert", false, 1.4, "cynicism", ["burnout-recovery"], ["general"]),
        q("BURN_D2_04", "How often do you feel emotionally numb or detached at work?", "Frequency", false, 1.4, "depersonalization", ["burnout-recovery"], ["general"]),
        q("BURN_D2_05", "I feel strongly that this organization's mission still matters to me.", "Likert", true, 1.3, "cynicism", ["culture-trust-rebuild"], ["general"]),
        q("BURN_D2_06", "How often do you treat colleagues or clients with less patience than they deserve?", "Frequency", false, 1.3, "depersonalization", ["burnout-recovery"], ["general"]),
        q("BURN_D2_07", "I sometimes feel like I am just going through the motions at work.", "Likert", false, 1.3, "cynicism", ["culture-trust-rebuild"], ["general"]),
        q("BURN_D2_08", "How severe is your current level of cynicism toward work or this organization?", "Severity", false, 1.4, "cynicism", ["burnout-recovery"], ["general"]),
        q("BURN_D2_09", "Rank the top 3 drivers of cynicism in your organization.", "Ranking", false, 0.5, null, [], ["general"]),
        q("BURN_D2_10", "I feel proud to work for this organization.", "Likert", true, 1.2, "cynicism", ["culture-trust-rebuild"], ["general"]),
        q("BURN_D2_11", "How often does organizational dysfunction make you question whether to stay in this role?", "Frequency", false, 1.3, "cynicism", ["recognition-retention"], ["general"]),
        q("BURN_D2_12", "Describe a moment when organizational cynicism most significantly affected your performance.", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 3: Reduced Personal Accomplishment",
      description: "Third burnout dimension — declining sense of effectiveness and achievement. (10 questions)",
      questions: [
        q("BURN_D3_01", "I feel confident that I am doing effective, meaningful work.", "Likert", true, 1.3, "burnout", ["burnout-prevention"], ["general"]),
        q("BURN_D3_02", "I can easily create a relaxed atmosphere with my colleagues and clients.", "Likert", true, 1.1, "burnout", ["burnout-prevention"], ["general"]),
        q("BURN_D3_03", "I have accomplished many worthwhile things in this job.", "Likert", true, 1.2, "burnout", ["recognition-retention"], ["general"]),
        q("BURN_D3_04", "I feel exhilarated when I have accomplished something meaningful in my work.", "Likert", true, 1.2, "burnout", ["recognition-retention"], ["general"]),
        q("BURN_D3_05", "I have been growing and developing professionally in this role.", "Likert", true, 1.2, "burnout", ["recognition-retention"], ["general"]),
        q("BURN_D3_06", "How severely has burnout impacted the quality of your work output?", "Severity", false, 1.4, "burnout", ["burnout-recovery"], ["general"]),
        q("BURN_D3_07", "I have effective strategies to recover from difficult days or projects.", "Likert", true, 1.2, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D3_08", "My organization recognizes and celebrates meaningful contributions.", "Likert", false, 1.2, "recognition", ["recognition-retention"], ["general"]),
        q("BURN_D3_09", "How often does workload prevent you from doing your job to the standard you want?", "Frequency", false, 1.3, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D3_10", "I feel that my contributions here are genuinely valued.", "Likert", false, 1.3, "recognition", ["recognition-retention"], ["general"]),
      ],
    },
    {
      title: "Domain 4: Workload & Recovery Patterns",
      description: "Structural workload, recovery, and sustainability indicators. (12 questions)",
      questions: [
        q("BURN_D4_01", "My workload is consistently realistic and manageable.", "Likert", false, 1.3, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D4_02", "How often are you required to be available outside of contracted work hours?", "Frequency", false, 1.3, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D4_03", "How severe is the overtime culture in your organization?", "Severity", false, 1.4, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D4_04", "You are asked to work another weekend during a high-priority surge. What typically happens?", "Scenario", false, 1.3, "workload", ["workload-sustainability"], ["general"], [
          { letter: "A", text: "Boundaries are respected and sustainability is discussed", score: 100 },
          { letter: "B", text: "The request is framed as optional but pressure is implied", score: 55 },
          { letter: "C", text: "Compliance is expected without real choice", score: 20 },
          { letter: "D", text: "Weekend work is normalized and never discussed", score: 0 },
        ]),
        q("BURN_D4_05", "I have genuine, protected recovery time between demanding work periods.", "Likert", false, 1.3, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D4_06", "Which workload support mechanisms exist and function effectively?", "Evidence", false, 1.0, "burnout", ["burnout-prevention"], ["general"], undefined, true, true),
        q("BURN_D4_07", "I take my full allotted vacation and recovery time without guilt or penalty.", "Likert", false, 1.2, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D4_08", "How often does heavy workload prevent you from completing important tasks properly?", "Frequency", false, 1.3, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D4_09", "Our team has adequate staffing to meet our current responsibilities.", "Likert", false, 1.2, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D4_10", "I feel comfortable telling my manager when my workload is unsustainable.", "Likert", false, 1.3, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("BURN_D4_11", "Rank the top 3 workload factors that most contribute to burnout in your team.", "Ranking", false, 0.5, null, [], ["general"]),
        q("BURN_D4_12", "How confident are you that raising a workload concern would lead to a real response?", "Confidence", false, 1.2, "workload", ["workload-sustainability"], ["general"]),
      ],
    },
    {
      title: "Domain 5: Organizational Drivers & Systemic Burnout",
      description: "Identifies structural and systemic organizational causes of burnout. (12 questions)",
      questions: [
        q("BURN_D5_01", "Our organizational culture implicitly or explicitly glorifies overwork.", "HiddenTrigger", false, 1.4, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D5_02", "Leadership models healthy boundaries and visible recovery behaviors.", "Likert", false, 1.3, "burnout", ["burnout-prevention"], ["general"]),
        q("BURN_D5_03", "Our organization has a formal burnout prevention or employee wellness program.", "Evidence", false, 1.0, "burnout", ["burnout-prevention"], ["general"], undefined, true, true),
        q("BURN_D5_04", "Management acknowledges and acts on burnout signals before they become crises.", "Likert", false, 1.3, "burnout", ["burnout-prevention"], ["general"]),
        q("BURN_D5_05", "How often does organizational bureaucracy or inefficiency contribute to your workload stress?", "Frequency", false, 1.2, "workload", ["workload-sustainability"], ["general", "government"]),
        q("BURN_D5_06", "How severe is the impact of constant change, reorganization, or uncertainty on team burnout?", "Severity", false, 1.3, "burnout", ["burnout-recovery"], ["general"]),
        q("BURN_D5_07", "The pace of change in our organization is managed in a way that supports employee sustainability.", "Likert", false, 1.2, "workload", ["workload-sustainability"], ["general"]),
        q("BURN_D5_08", "I feel that the system itself — not just individual choices — is driving burnout here.", "HiddenTrigger", false, 1.4, "burnout", ["burnout-prevention"], ["general"]),
        q("BURN_D5_09", "Our organization regularly measures and reports on employee well-being and burnout risk.", "Likert", false, 1.1, "burnout", ["burnout-prevention"], ["general"]),
        q("BURN_D5_10", "How confident are you that your organization will take effective action on burnout?", "Confidence", false, 1.2, "burnout", ["burnout-prevention"], ["general"]),
        q("BURN_D5_11", "A team is chronically understaffed and leadership is aware. What most likely happens?", "Scenario", false, 1.4, "workload", ["workload-sustainability"], ["general"], [
          { letter: "A", text: "Staffing is addressed within 30–60 days", score: 100 },
          { letter: "B", text: "It is acknowledged as a problem but deprioritized", score: 55 },
          { letter: "C", text: "Existing staff are asked to absorb the workload indefinitely", score: 20 },
          { letter: "D", text: "The problem is ignored until people leave", score: 0 },
        ]),
        q("BURN_D5_12", "What one structural or systemic change would most reduce burnout in your organization?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATE 5: LEADERSHIP INTEGRITY & TRUST DEEP-DIVE (60q)
// ─────────────────────────────────────────────────────────────────────────────

const LEADERSHIP_DEEP_DIVE: WvwAuditTemplate = {
  name: "WVW Leadership Integrity & Trust Deep-Dive Audit™",
  description: "60-question deep-dive on leadership ethical behavior, decision transparency, accountability, vulnerability modeling, and power dynamics.",
  auditType: "HR",
  isGlobal: true,
  version: "1.0",
  industryTags: ["general", "government", "tech", "healthcare"],
  sections: [
    {
      title: "Domain 1: Ethical Behavior & Consistency",
      description: "Measuring the gap between stated values and actual leadership behavior. (14 questions)",
      questions: [
        q("LI_D1_01", "Leaders here act with integrity even when it hurts short-term results.", "Likert", false, 1.4, "leadership", ["leadership-integrity-program"], ["general"]),
        q("LI_D1_02", "I have observed leaders act inconsistently with the values they publicly promote.", "HiddenTrigger", false, 1.5, "values-conflict", ["ethics-realignment"], ["general"]),
        q("LI_D1_03", "Ethical behavior is consistently rewarded and unethical behavior consistently addressed.", "Likert", false, 1.3, "accountability", ["performance-accountability"], ["general"]),
        q("LI_D1_04", "Leaders sometimes compromise ethical standards to hit short-term targets.", "Likert", true, 1.4, "ethical-misalignment", ["ethics-realignment"], ["general"]),
        q("LI_D1_05", "How often do you observe leadership behavior that conflicts with the organization's stated values?", "Frequency", false, 1.4, "values-conflict", ["ethics-realignment"], ["general"]),
        q("LI_D1_06", "How severe is the gap between leadership's stated values and their observed actions?", "Severity", false, 1.4, "values-stated", ["ethics-realignment"], ["general"]),
        q("LI_D1_07", "A senior leader engages in behavior that violates the code of conduct but results are strong. What happens?", "Scenario", false, 1.5, "ethical-misalignment", ["ethics-realignment"], ["general"], [
          { letter: "A", text: "The behavior is addressed regardless of performance", score: 100 },
          { letter: "B", text: "A private conversation happens with no formal consequence", score: 55 },
          { letter: "C", text: "It is overlooked because the numbers are good", score: 15 },
          { letter: "D", text: "Other leaders are implicitly encouraged to do the same", score: 0 },
        ]),
        q("LI_D1_08", "Which ethical accountability mechanisms exist in your organization?", "Evidence", false, 1.0, "accountability", ["performance-accountability"], ["general"], undefined, true, true),
        q("LI_D1_09", "Leadership consistently models the behavior they expect from others.", "Likert", false, 1.3, "leadership", ["leadership-integrity-program"], ["general"]),
        q("LI_D1_10", "Our organization would take public accountability for an organizational failure or wrongdoing.", "Likert", false, 1.2, "accountability", ["leadership-integrity-program"], ["general"]),
        q("LI_D1_11", "How confident are you in the ethical standards of your organization's senior leadership?", "Confidence", false, 1.3, "leadership", ["leadership-integrity-program"], ["general"]),
        q("LI_D1_12", "Ethics are treated as a core business strategy, not just a compliance requirement.", "Likert", false, 1.2, "ethical-misalignment", ["ethics-realignment"], ["general"]),
        q("LI_D1_13", "The organization's public reputation for ethics matches the internal reality.", "Contradiction", false, 1.3, "values-stated", ["ethics-realignment"], ["general"]),
        q("LI_D1_14", "Describe the most significant ethical leadership failure you have witnessed in this organization.", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 2: Decision-Making Transparency",
      description: "How transparent, inclusive, and explained leadership decisions are. (12 questions)",
      questions: [
        q("LI_D2_01", "Leadership clearly communicates the rationale behind major decisions.", "Likert", false, 1.3, "transparency-claim", ["communication-clarity"], ["general"]),
        q("LI_D2_02", "Important decisions are made by a small group without input from those most affected.", "Likert", true, 1.3, "transparency-claim", ["communication-clarity"], ["general"]),
        q("LI_D2_03", "I understand how decisions that affect my work and team are made.", "Likert", false, 1.2, "communication", ["communication-clarity"], ["general"]),
        q("LI_D2_04", "How often are employees informed of significant decisions after they have already been finalized?", "Frequency", false, 1.2, "communication", ["communication-clarity"], ["general"]),
        q("LI_D2_05", "Leadership claims transparency but key decisions are made behind closed doors.", "Contradiction", false, 1.4, "info-withheld", ["communication-clarity"], ["general"]),
        q("LI_D2_06", "Employees have meaningful input into decisions that affect their work.", "Likert", false, 1.2, "voice-safety", ["voice-inclusion"], ["general"]),
        q("LI_D2_07", "Leadership communicates difficult news — layoffs, restructuring, failures — honestly and promptly.", "Likert", false, 1.3, "trust", ["leadership-alignment"], ["general"]),
        q("LI_D2_08", "How severe is the information asymmetry between leadership and the broader workforce?", "Severity", false, 1.3, "communication", ["communication-clarity"], ["general"]),
        q("LI_D2_09", "Does your organization have formal mechanisms for decision transparency?", "Evidence", false, 1.0, "accountability", [], ["general"], undefined, false, false),
        q("LI_D2_10", "How often do post-decision communications include honest reasoning or tradeoffs?", "Frequency", false, 1.2, "communication", ["communication-clarity"], ["general"]),
        q("LI_D2_11", "How confident are you that leadership is honest about the organization's real challenges?", "Confidence", false, 1.3, "trust", ["leadership-alignment"], ["general"]),
        q("LI_D2_12", "What decision-making process change would most increase your trust in leadership?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 3: Accountability & Follow-Through",
      description: "Whether leaders hold themselves and others accountable for commitments. (12 questions)",
      questions: [
        q("LI_D3_01", "Leaders follow through on commitments they make to teams and individuals.", "Likert", false, 1.3, "accountability", ["performance-accountability"], ["general"]),
        q("LI_D3_02", "When leaders fail to meet commitments, there are clear consequences.", "Likert", false, 1.3, "accountability", ["performance-accountability"], ["general"]),
        q("LI_D3_03", "How often does leadership make promises or commitments that are not fulfilled?", "Frequency", false, 1.4, "accountability", ["performance-accountability"], ["general"]),
        q("LI_D3_04", "Leadership holds employees to high standards while applying lower standards to themselves.", "HiddenTrigger", false, 1.4, "favoritism", ["equity-accountability"], ["general"]),
        q("LI_D3_05", "Culture and people commitments are treated with the same urgency as financial commitments.", "Likert", false, 1.3, "accountability", ["performance-accountability"], ["general"]),
        q("LI_D3_06", "How severe is the gap between leadership's stated priorities and where they actually invest time?", "Severity", false, 1.3, "accountability", ["performance-accountability"], ["general"]),
        q("LI_D3_07", "A leader commits to a significant culture initiative. Six months later it has stalled. What happens?", "Scenario", false, 1.4, "accountability", ["performance-accountability"], ["general"], STANDARD_SCENARIO),
        q("LI_D3_08", "Our organization has formal accountability mechanisms for leadership performance on culture.", "Evidence", false, 1.0, "accountability", ["performance-accountability"], ["general"], undefined, false, false),
        q("LI_D3_09", "Leaders welcome being held accountable by the people they lead.", "Likert", false, 1.2, "accountability", ["performance-accountability"], ["general"]),
        q("LI_D3_10", "How confident are you that leadership will act on the findings from this audit?", "Confidence", false, 1.3, "accountability", ["performance-accountability"], ["general"]),
        q("LI_D3_11", "How often are culture-related action plans revisited and updated?", "Frequency", false, 1.1, "accountability", ["performance-accountability"], ["general"]),
        q("LI_D3_12", "I have personally seen leadership change their own behavior based on feedback.", "Likert", false, 1.2, "accountability", ["leadership-alignment"], ["general"]),
      ],
    },
    {
      title: "Domain 4: Modeling Vulnerability & Growth",
      description: "Whether leaders model learning, humility, and psychological safety through their own behavior. (10 questions)",
      questions: [
        q("LI_D4_01", "Leaders openly acknowledge when they have made a mistake or do not know the answer.", "Likert", false, 1.3, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("LI_D4_02", "Leadership is perceived as defensive when they receive critical feedback.", "Likert", true, 1.3, "trust", ["leadership-alignment"], ["general"]),
        q("LI_D4_03", "I have personally witnessed senior leaders show genuine vulnerability or admit they were wrong.", "HiddenTrigger", false, 1.2, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("LI_D4_04", "Our leaders visibly invest in their own growth and development.", "Likert", false, 1.1, "leadership", ["leadership-integrity-program"], ["general"]),
        q("LI_D4_05", "How often does leadership seek and visibly apply feedback from their teams?", "Frequency", false, 1.2, "accountability", ["performance-accountability"], ["general"]),
        q("LI_D4_06", "Showing weakness or uncertainty as a leader is seen as a liability in this organization.", "HiddenTrigger", true, 1.3, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("LI_D4_07", "Our leaders create genuine psychological safety by modeling it themselves.", "Likert", false, 1.3, "psychological-safety", ["psych-safety-infrastructure"], ["general"]),
        q("LI_D4_08", "How severe is the gap between the leadership behaviors that are rewarded and what would truly build trust?", "Severity", false, 1.2, "leadership", ["leadership-integrity-program"], ["general"]),
        q("LI_D4_09", "How confident are you that senior leaders are genuinely open to growing and changing?", "Confidence", false, 1.2, "leadership", ["leadership-integrity-program"], ["general"]),
        q("LI_D4_10", "Describe a moment when a leader's vulnerability or humility significantly impacted your trust in them.", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 5: Power Dynamics & Favoritism",
      description: "Examining how power is used, distributed, and whether favoritism distorts organizational fairness. (12 questions)",
      questions: [
        q("LI_D5_01", "Opportunities, promotions, and recognition are based on merit rather than relationships.", "Likert", false, 1.4, "favoritism", ["equity-accountability"], ["general"]),
        q("LI_D5_02", "There is a culture of favoritism where some individuals receive preferential treatment.", "HiddenTrigger", false, 1.5, "favoritism", ["equity-accountability", "leadership-integrity-program"], ["general"]),
        q("LI_D5_03", "People who agree with leadership or are in their inner circle advance faster.", "HiddenTrigger", false, 1.4, "power-dynamics", ["equity-accountability"], ["general"]),
        q("LI_D5_04", "How often is feedback or dissent from lower-level employees dismissed or devalued?", "Frequency", false, 1.3, "power-dynamics", ["voice-inclusion"], ["general"]),
        q("LI_D5_05", "How severe is the culture of nepotism or favoritism in your organization?", "Severity", false, 1.4, "favoritism", ["equity-accountability"], ["general"]),
        q("LI_D5_06", "Senior leaders use their positional power to silence dissent rather than engage with it.", "HiddenTrigger", false, 1.5, "power-dynamics", ["retaliation-prevention", "psych-safety-infrastructure"], ["general"]),
        q("LI_D5_07", "A high-performer who consistently challenges leadership is passed over for promotion despite results. What happens?", "Scenario", false, 1.5, "power-dynamics", ["equity-accountability"], ["general"], [
          { letter: "A", text: "The decision is reviewed and fairly addressed", score: 100 },
          { letter: "B", text: "An explanation is given but nothing formally changes", score: 55 },
          { letter: "C", text: "The pattern is known but never discussed openly", score: 20 },
          { letter: "D", text: "Others learn the implicit lesson and conform", score: 0 },
        ]),
        q("LI_D5_08", "Our organization has safeguards against misuse of positional power.", "Evidence", false, 1.0, "power-dynamics", ["equity-accountability"], ["general"], undefined, false, false),
        q("LI_D5_09", "Power in our organization is used to serve the mission, not to protect hierarchical interests.", "Likert", false, 1.3, "power-dynamics", ["leadership-integrity-program"], ["general"]),
        q("LI_D5_10", "How confident are you that performance, not politics, determines outcomes here?", "Confidence", false, 1.3, "favoritism", ["equity-accountability"], ["general"]),
        q("LI_D5_11", "I have observed employees disengage or leave because of favoritism or political dynamics.", "HiddenTrigger", false, 1.4, "retention", ["recognition-retention"], ["general"]),
        q("LI_D5_12", "What one leadership behavior change would most reduce power imbalance in your organization?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATE 6: MORAL INJURY & ETHICAL ALIGNMENT DEEP-DIVE (55q)
// ─────────────────────────────────────────────────────────────────────────────

const MORAL_INJURY_DEEP_DIVE: WvwAuditTemplate = {
  name: "WVW Moral Injury & Ethical Alignment Deep-Dive Audit™",
  description: "55-question OMIS/MIDS-adapted audit measuring moral transgressions, betrayal, guilt/shame, organizational value misalignment, and recovery systems.",
  auditType: "HR",
  isGlobal: true,
  version: "1.0",
  industryTags: ["general", "government", "healthcare"],
  sections: [
    {
      title: "Domain 1: Moral Transgressions (Commission & Omission)",
      description: "Acts required or permitted that violate personal moral standards. (12 questions)",
      questions: [
        q("MI_D1_01", "I have been asked to do things at work that violated my core personal values.", "Likert", false, 1.5, "moral-transgression", ["moral-injury-recovery", "ethics-realignment"], ["general"]),
        q("MI_D1_02", "I have had to participate in decisions I believed were morally wrong.", "Likert", false, 1.5, "moral-transgression", ["moral-injury-recovery"], ["general"]),
        q("MI_D1_03", "I have failed to act when I knew action was morally required of me.", "Likert", false, 1.4, "moral-transgression", ["moral-injury-recovery"], ["general"]),
        q("MI_D1_04", "How often are you required to do things at work that conflict with your moral compass?", "Frequency", false, 1.4, "moral-transgression", ["moral-injury-recovery", "ethics-realignment"], ["general"]),
        q("MI_D1_05", "How severe is the moral harm caused by decisions or actions required of you?", "Severity", false, 1.5, "moral-injury", ["moral-injury-recovery"], ["general"]),
        q("MI_D1_06", "Our organization pressures employees to meet targets in ways that compromise ethics.", "HiddenTrigger", false, 1.5, "ethical-misalignment", ["ethics-realignment"], ["general"]),
        q("MI_D1_07", "You are instructed by leadership to take an action you believe is unethical but legal. What do you do?", "Scenario", false, 1.5, "moral-transgression", ["moral-injury-recovery", "ethics-realignment"], ["general"], [
          { letter: "A", text: "Escalate through formal channels before taking action", score: 100 },
          { letter: "B", text: "Comply while privately documenting your concerns", score: 60 },
          { letter: "C", text: "Comply to avoid consequences, suppressing your concerns", score: 20 },
          { letter: "D", text: "Comply without question — it is not your responsibility", score: 0 },
        ]),
        q("MI_D1_08", "I have witnessed ethical violations that were not reported because of fear of consequences.", "HiddenTrigger", false, 1.4, "reporting-fear", ["reporting-safety", "retaliation-prevention"], ["general"]),
        q("MI_D1_09", "There are clear, safe, and trusted channels to raise ethical concerns.", "Evidence", false, 1.1, "reporting-fear", ["reporting-safety"], ["general"], undefined, true, true),
        q("MI_D1_10", "I believe the harms I witness or participate in here will have lasting consequences.", "HiddenTrigger", false, 1.4, "moral-injury", ["moral-injury-recovery"], ["general"]),
        q("MI_D1_11", "How confident are you that ethical violations will be addressed if reported?", "Confidence", false, 1.3, "reporting-fear", ["reporting-safety"], ["general"]),
        q("MI_D1_12", "Describe a situation where you were required to act against your values. What was the impact?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 2: Betrayal & Leadership Failures",
      description: "Betrayal by leadership, institutions, or colleagues that shattered moral expectations. (12 questions)",
      questions: [
        q("MI_D2_01", "I feel that leadership has betrayed the trust of employees through their decisions or inactions.", "Likert", false, 1.5, "betrayal", ["moral-injury-recovery", "leadership-integrity-program"], ["general"]),
        q("MI_D2_02", "People in authority here failed to prevent harm they had the power to prevent.", "Likert", false, 1.5, "betrayal", ["moral-injury-recovery"], ["general"]),
        q("MI_D2_03", "Colleagues I trusted have acted in ways that violated my trust or caused harm.", "Likert", false, 1.3, "betrayal", ["moral-injury-recovery"], ["general"]),
        q("MI_D2_04", "How often has institutional betrayal — being let down by the organization itself — affected your wellbeing?", "Frequency", false, 1.4, "betrayal", ["moral-injury-recovery"], ["general"]),
        q("MI_D2_05", "How severe has the impact of organizational betrayal been on your sense of trust?", "Severity", false, 1.5, "betrayal", ["moral-injury-recovery"], ["general"]),
        q("MI_D2_06", "I feel abandoned by leadership when facing serious professional or ethical challenges.", "Likert", false, 1.4, "betrayal", ["moral-injury-recovery", "leadership-integrity-program"], ["general"]),
        q("MI_D2_07", "A leader knew about serious misconduct and failed to act. How does the organization typically respond?", "Scenario", false, 1.5, "betrayal", ["moral-injury-recovery"], ["general"], [
          { letter: "A", text: "The inaction is addressed and the leader is held accountable", score: 100 },
          { letter: "B", text: "A formal inquiry is held but the leader remains in place", score: 50 },
          { letter: "C", text: "The situation is managed quietly to protect reputation", score: 15 },
          { letter: "D", text: "The misconduct and the inaction are both buried", score: 0 },
        ]),
        q("MI_D2_08", "How often does leadership's betrayal of stated principles cause lasting damage to morale?", "Frequency", false, 1.3, "betrayal", ["moral-injury-recovery"], ["general"]),
        q("MI_D2_09", "The organization takes visible responsibility when institutional betrayal occurs.", "Likert", false, 1.3, "accountability", ["leadership-integrity-program"], ["general"]),
        q("MI_D2_10", "I have lost significant trust in this organization due to how it has handled serious situations.", "HiddenTrigger", false, 1.5, "betrayal", ["moral-injury-recovery", "culture-trust-rebuild"], ["general"]),
        q("MI_D2_11", "How confident are you that leadership would genuinely protect employees from institutional harm?", "Confidence", false, 1.3, "betrayal", ["moral-injury-recovery"], ["general"]),
        q("MI_D2_12", "What specific act of betrayal has most deeply damaged trust in your organization?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 3: Guilt, Shame & Existential Conflict",
      description: "Emotional and existential impact of moral injury — guilt, shame, anger, and loss of meaning. (12 questions)",
      questions: [
        q("MI_D3_01", "How often do you experience guilt about things that happen at work?", "Frequency", false, 1.4, "guilt-shame", ["moral-injury-recovery"], ["general"]),
        q("MI_D3_02", "How often do you feel shame about decisions made by your organization or colleagues?", "Frequency", false, 1.4, "guilt-shame", ["moral-injury-recovery"], ["general"]),
        q("MI_D3_03", "How often do you feel anger about ethical failures or injustices in this organization?", "Frequency", false, 1.3, "guilt-shame", ["moral-injury-recovery"], ["general"]),
        q("MI_D3_04", "How severe is the existential conflict you feel about the meaning and purpose of your work?", "Severity", false, 1.4, "existential-conflict", ["moral-injury-recovery"], ["general"]),
        q("MI_D3_05", "I struggle to find meaning in my work because of what I have witnessed or participated in.", "Likert", false, 1.4, "existential-conflict", ["moral-injury-recovery"], ["general"]),
        q("MI_D3_06", "I feel morally responsible for harms that resulted from organizational decisions I was part of.", "Likert", false, 1.3, "guilt-shame", ["moral-injury-recovery"], ["general"]),
        q("MI_D3_07", "The moral weight of my work affects my sleep, relationships, or physical health.", "HiddenTrigger", false, 1.5, "moral-injury", ["moral-injury-recovery", "burnout-recovery"], ["general"]),
        q("MI_D3_08", "I have disconnected emotionally from my work to protect myself from moral distress.", "Likert", false, 1.4, "depersonalization", ["moral-injury-recovery", "burnout-recovery"], ["general"]),
        q("MI_D3_09", "I still feel genuine moral distress about specific past events at this organization.", "HiddenTrigger", false, 1.4, "moral-injury", ["moral-injury-recovery"], ["general"]),
        q("MI_D3_10", "How confident are you that you can process or heal from moral injury experienced here?", "Confidence", false, 1.2, "moral-injury", ["moral-injury-recovery"], ["general"]),
        q("MI_D3_11", "I have access to support — peer, professional, or structured — for processing moral distress.", "Likert", false, 1.3, "moral-injury", ["moral-injury-recovery"], ["general"]),
        q("MI_D3_12", "Describe how moral distress has impacted your well-being, identity, or commitment to this work.", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 4: Organizational Value Misalignment",
      description: "When what the organization says it values diverges from what it actually practices or rewards. (10 questions)",
      questions: [
        q("MI_D4_01", "There is a significant gap between this organization's stated values and daily operational reality.", "Contradiction", false, 1.4, "values-violated", ["ethics-realignment"], ["general"]),
        q("MI_D4_02", "The behaviors that are actually rewarded here contradict what is officially promoted.", "HiddenTrigger", false, 1.5, "values-conflict", ["ethics-realignment"], ["general"]),
        q("MI_D4_03", "Our values are posted on the wall but not practiced in the room.", "HiddenTrigger", false, 1.4, "values-stated", ["ethics-realignment"], ["general"]),
        q("MI_D4_04", "How often do organizational decisions violate the values that are publicly promoted?", "Frequency", false, 1.4, "values-conflict", ["ethics-realignment"], ["general"]),
        q("MI_D4_05", "How severe is the misalignment between what your organization says and what it does?", "Severity", false, 1.5, "ethical-misalignment", ["ethics-realignment"], ["general"]),
        q("MI_D4_06", "Our organization takes real action to close the gap between stated and lived values.", "Likert", false, 1.3, "values-stated", ["ethics-realignment"], ["general"]),
        q("MI_D4_07", "I can clearly articulate our organization's values AND see them practiced consistently.", "Likert", false, 1.2, "values-stated", ["ethics-realignment"], ["general"]),
        q("MI_D4_08", "The mission that drew me to this organization is still reflected in how it operates today.", "Likert", false, 1.3, "values-conflict", ["moral-injury-recovery"], ["general"]),
        q("MI_D4_09", "How confident are you that this organization's values will be meaningfully acted on?", "Confidence", false, 1.2, "values-stated", ["ethics-realignment"], ["general"]),
        q("MI_D4_10", "What specific value misalignment causes the most moral distress in your organization?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 5: Recovery & Support Systems",
      description: "Organizational resources and culture for healing from moral injury. (9 questions)",
      questions: [
        q("MI_D5_01", "Our organization provides structured support for employees experiencing moral distress.", "Likert", false, 1.3, "moral-injury", ["moral-injury-recovery"], ["general"]),
        q("MI_D5_02", "Which moral injury support systems currently exist in your organization?", "Evidence", false, 1.0, "moral-injury", ["moral-injury-recovery"], ["general"], undefined, true, true),
        q("MI_D5_03", "Employees can discuss moral distress openly without fear of being labeled as weak or problematic.", "Likert", false, 1.3, "psychological-safety", ["psych-safety-infrastructure", "moral-injury-recovery"], ["general"]),
        q("MI_D5_04", "How often do you feel genuinely supported when processing difficult moral or ethical experiences?", "Frequency", false, 1.2, "moral-injury", ["moral-injury-recovery"], ["general"]),
        q("MI_D5_05", "Leadership acknowledges and takes responsibility for organizational actions that caused moral harm.", "Likert", false, 1.4, "accountability", ["leadership-integrity-program", "moral-injury-recovery"], ["general"]),
        q("MI_D5_06", "How confident are you that this organization will take real steps to prevent future moral harm?", "Confidence", false, 1.3, "moral-injury", ["moral-injury-recovery", "ethics-realignment"], ["general"]),
        q("MI_D5_07", "Our organization has meaningfully acknowledged past events that caused moral harm to employees.", "Likert", false, 1.3, "accountability", ["moral-injury-recovery"], ["general"]),
        q("MI_D5_08", "I am aware of and trust the resources available to me for moral or ethical distress.", "Likert", false, 1.1, "moral-injury", ["moral-injury-recovery"], ["general"]),
        q("MI_D5_09", "What one support system would most help employees recover from moral injury in this organization?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATE 7: NEUROINCLUSION DEEP-DIVE (58q)
// ─────────────────────────────────────────────────────────────────────────────

const NEUROINCLUSION_DEEP_DIVE: WvwAuditTemplate = {
  name: "WVW Neuroinclusion Deep-Dive Audit™",
  description: "58-question neuroinclusion audit covering stigma reduction, accommodation access, sensory/processing support, career inclusion, and organizational policy. Industry-adapted for Government/Defense, Tech, and Healthcare.",
  auditType: "HR",
  isGlobal: true,
  version: "1.0",
  industryTags: ["general", "government", "tech", "healthcare"],
  sections: [
    {
      title: "Domain 1: Awareness & Stigma Reduction",
      description: "Whether neurodivergent employees feel safe, seen, and free from stigma. (12 questions)",
      questions: [
        q("NI_D1_01", "In my organization, neurodivergent employees (ADHD, autism, dyslexia, etc.) feel safe disclosing their needs.", "Likert", false, 1.25, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D1_02", "Neurodivergent colleagues are sometimes viewed as 'difficult' or 'less reliable.'", "Likert", true, 1.3, "neurodivergent-stigma", ["neuroinclusion-package"], ["general"]),
        q("NI_D1_03", "How confident are you that requesting neurodivergent accommodations will not negatively impact your career?", "Confidence", false, 1.2, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("NI_D1_04", "A team member with ADHD requests written agendas and quieter meeting options. What most likely happens?", "Scenario", false, 1.4, "neuroinclusion", ["neuroinclusion-package"], ["general"], [
          { letter: "A", text: "Fully supported — accommodations are implemented without comment", score: 100 },
          { letter: "B", text: "Politely acknowledged but inconsistently followed", score: 60 },
          { letter: "C", text: "Viewed as 'special treatment' by some colleagues", score: 25 },
          { letter: "D", text: "Subtle career or social consequences follow", score: 0 },
        ]),
        q("NI_D1_05", "Which neuroinclusion support structures currently exist and actually work?", "Evidence", false, 1.0, "neuroinclusion", ["neuroinclusion-package"], ["general"], undefined, true, true),
        q("NI_D1_06", "Managers in our organization are trained to recognize and support neurodivergent employees.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D1_07", "Neurodivergent employees are visibly represented in leadership and senior roles.", "Likert", false, 1.1, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D1_08", "How often are neurodivergent differences discussed openly and positively in your organization?", "Frequency", false, 1.1, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D1_09", "How severe is the stigma around neurodivergent disclosure in your team or organization?", "Severity", false, 1.4, "neurodivergent-stigma", ["neuroinclusion-package"], ["general"]),
        q("NI_D1_10", "Neurodivergent strengths (pattern recognition, hyperfocus, creative thinking) are actively leveraged here.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["tech"]),
        q("NI_D1_11", "I have personally witnessed or experienced discrimination based on neurodivergence.", "HiddenTrigger", false, 1.5, "neurodivergent-stigma", ["neuroinclusion-package", "dei-reality-intervention"], ["general"]),
        q("NI_D1_12", "Describe your experience of neuroinclusion — positive or negative — in this organization.", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 2: Accommodation Access & Effectiveness",
      description: "Whether formal and informal accommodations are accessible, trusted, and effective. (12 questions)",
      questions: [
        q("NI_D2_01", "The accommodation request process here is straightforward and respectful.", "Likert", false, 1.3, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("NI_D2_02", "How often do employees need to self-advocate repeatedly to receive basic accommodations?", "Frequency", false, 1.4, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("NI_D2_03", "How severe is the burden placed on neurodivergent employees to prove they need accommodations?", "Severity", false, 1.4, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("NI_D2_04", "Accommodations are granted quickly and without unnecessary justification.", "Likert", false, 1.3, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("NI_D2_05", "When accommodations are provided, they are genuinely effective and respected by colleagues.", "Likert", false, 1.3, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("NI_D2_06", "Rate the effectiveness of accommodations at the Team, Leadership, and Organizational levels.", "Matrix", false, 1.1, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("NI_D2_07", "I am aware of the formal accommodation process and feel comfortable using it.", "Likert", false, 1.2, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("NI_D2_08", "How often are accommodations revoked, reduced, or deprioritized due to business pressures?", "Frequency", false, 1.3, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("NI_D2_09", "Our organization tracks and reports accommodation request outcomes and equity.", "Evidence", false, 1.0, "accommodation", ["neuroinclusion-package"], ["general"], undefined, false, false),
        q("NI_D2_10", "Colleagues react positively — or at least neutrally — to accommodation requests.", "Likert", false, 1.2, "neuroinclusion", ["belonging-inclusion"], ["general"]),
        q("NI_D2_11", "How confident are you that your accommodation needs would be met fairly and quickly?", "Confidence", false, 1.2, "accommodation", ["neuroinclusion-package"], ["general"]),
        q("NI_D2_12", "What is the biggest barrier to accessing accommodations in your organization?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 3: Sensory & Processing Support",
      description: "Whether the environment supports diverse cognitive and sensory processing needs. (10 questions)",
      questions: [
        q("NI_D3_01", "Our physical and virtual work environments accommodate diverse sensory needs.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D3_02", "Open-plan offices or constant noise create barriers for neurodivergent employees here.", "HiddenTrigger", false, 1.3, "neuroinclusion", ["neuroinclusion-package"], ["tech"]),
        q("NI_D3_03", "Meetings and communication styles accommodate different processing speeds and learning styles.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D3_04", "How often do sensory or environmental barriers prevent neurodivergent employees from performing at their best?", "Frequency", false, 1.3, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D3_05", "I have access to quiet spaces, asynchronous communication options, or processing time when needed.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D3_06", "Written agendas, clear instructions, and processing time are standard — not special requests.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D3_07", "High-stakes environments (patient-facing, classified, high-pressure) are designed with neurodivergent needs in mind.", "Likert", false, 1.3, "neuroinclusion", ["neuroinclusion-package"], ["healthcare", "government"]),
        q("NI_D3_08", "How severe is the sensory or cognitive load imposed by the physical or digital work environment?", "Severity", false, 1.3, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D3_09", "Our technology and tools are accessible and customizable for diverse cognitive needs.", "Likert", false, 1.1, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D3_10", "What environmental or process change would most improve neuroinclusion in your workplace?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 4: Career Growth & Inclusion",
      description: "Whether neurodivergent employees have equitable access to growth, mentoring, and advancement. (12 questions)",
      questions: [
        q("NI_D4_01", "Neurodivergent employees have equitable access to advancement, mentoring, and development.", "Likert", false, 1.3, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D4_02", "Neurodivergent employees are less likely to be promoted than neurotypical peers with similar performance.", "HiddenTrigger", false, 1.5, "neurodivergent-stigma", ["neuroinclusion-package", "equity-accountability"], ["general"]),
        q("NI_D4_03", "Performance evaluation criteria are fair and accessible for neurodivergent employees.", "Likert", false, 1.3, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D4_04", "I have been penalized in performance reviews for characteristics linked to my neurodivergence.", "HiddenTrigger", false, 1.5, "neurodivergent-stigma", ["neuroinclusion-package", "equity-accountability"], ["general"]),
        q("NI_D4_05", "How often are neurodivergent employees excluded from high-visibility projects or leadership opportunities?", "Frequency", false, 1.3, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D4_06", "A neurodivergent team member consistently delivers results but is passed over for promotion. What most likely happens?", "Scenario", false, 1.5, "neuroinclusion", ["neuroinclusion-package", "equity-accountability"], ["general"], [
          { letter: "A", text: "A fair review leads to promotion and the bias is addressed", score: 100 },
          { letter: "B", text: "Development feedback is given but the pattern continues", score: 55 },
          { letter: "C", text: "Vague reasons are given that mask the real bias", score: 20 },
          { letter: "D", text: "They eventually leave due to the ceiling they face", score: 0 },
        ]),
        q("NI_D4_07", "Our career development programs are designed with neurodivergent employees in mind.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D4_08", "Mentorship is available and accessible for neurodivergent employees.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D4_09", "How confident are you in the equity of career growth for neurodivergent employees here?", "Confidence", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D4_10", "Neurodivergent employees have a visible champion or advocate at the leadership level.", "Evidence", false, 1.0, "neuroinclusion", ["neuroinclusion-package"], ["general"], undefined, false, false),
        q("NI_D4_11", "I feel my neurodivergent traits are seen as strengths rather than liabilities in this organization.", "Likert", false, 1.3, "neuroinclusion", ["neuroinclusion-package", "belonging-inclusion"], ["general"]),
        q("NI_D4_12", "What would most increase career equity for neurodivergent employees in your organization?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 5: Organizational Systems & Policy",
      description: "Formal systems, policies, and accountability for neuroinclusion. (12 questions)",
      questions: [
        q("NI_D5_01", "Our organization has a formal, documented neuroinclusion or neurodiversity policy.", "Evidence", false, 1.1, "neuroinclusion", ["neuroinclusion-package"], ["general"], undefined, true, true),
        q("NI_D5_02", "The neuroinclusion policy is known, accessible, and actively applied — not just posted.", "Likert", false, 1.3, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D5_03", "Neuroinclusion training for all managers is mandatory and regularly updated.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D5_04", "Our HR team has specialized knowledge to support neurodivergent employees.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D5_05", "How often does policy compliance actually translate into meaningful behavioral change?", "Frequency", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D5_06", "How severe is the gap between our neuroinclusion policy and lived daily reality?", "Severity", false, 1.4, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D5_07", "Our organization measures and reports neuroinclusion equity data.", "Evidence", false, 1.0, "neuroinclusion", ["neuroinclusion-package"], ["general"], undefined, false, false),
        q("NI_D5_08", "Security clearance processes, background checks, and classification systems are compatible with neurodivergent disclosure.", "Likert", false, 1.3, "neuroinclusion", ["neuroinclusion-package"], ["government"]),
        q("NI_D5_09", "Shift-work, on-call requirements, and patient-facing roles are designed to minimize neurodivergent barriers.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["healthcare"]),
        q("NI_D5_10", "Our neuroinclusion systems are reviewed and improved based on employee feedback.", "Likert", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D5_11", "How confident are you that neuroinclusion will be meaningfully prioritized in the next 12 months?", "Confidence", false, 1.2, "neuroinclusion", ["neuroinclusion-package"], ["general"]),
        q("NI_D5_12", "What is the single most important neuroinclusion system change your organization should make?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATE 8: DEI REALITY DEEP-DIVE (62q)
// ─────────────────────────────────────────────────────────────────────────────

const DEI_DEEP_DIVE: WvwAuditTemplate = {
  name: "WVW DEI Reality Deep-Dive Audit™",
  description: "62-question audit measuring the lived experience of belonging, equity, voice, representation, and DEI accountability — going beyond performative commitments to operational reality.",
  auditType: "HR",
  isGlobal: true,
  version: "1.0",
  industryTags: ["general", "government", "tech", "healthcare"],
  sections: [
    {
      title: "Domain 1: Belonging & Authenticity",
      description: "Whether all employees can bring their full selves to work without masking, code-switching, or fear. (14 questions)",
      questions: [
        q("DEI_D1_01", "I can bring my whole self to work without hiding parts of my identity.", "Likert", false, 1.3, "belonging", ["belonging-inclusion"], ["general"]),
        q("DEI_D1_02", "I sometimes feel I need to code-switch or mask to fit in at work.", "Likert", true, 1.3, "code-switching", ["belonging-inclusion", "dei-reality-intervention"], ["general"]),
        q("DEI_D1_03", "People from different backgrounds are genuinely welcomed and valued here.", "Likert", false, 1.3, "belonging", ["belonging-inclusion"], ["general"]),
        q("DEI_D1_04", "I feel lonely or isolated at work due to my identity or background.", "HiddenTrigger", false, 1.4, "belonging", ["belonging-inclusion"], ["general"]),
        q("DEI_D1_05", "An employee from an underrepresented group shares a cultural perspective in a meeting. What most likely happens?", "Scenario", false, 1.4, "belonging", ["belonging-inclusion"], ["general"], [
          { letter: "A", text: "The perspective is genuinely valued and incorporated", score: 100 },
          { letter: "B", text: "It is politely acknowledged but not acted upon", score: 60 },
          { letter: "C", text: "It is dismissed or treated as less credible", score: 20 },
          { letter: "D", text: "Negative social or career consequences follow", score: 0 },
        ]),
        q("DEI_D1_06", "How often do you adjust your communication style, appearance, or behavior to fit majority norms?", "Frequency", false, 1.3, "code-switching", ["belonging-inclusion"], ["general"]),
        q("DEI_D1_07", "How severe is the emotional cost of code-switching or masking your identity at work?", "Severity", false, 1.4, "code-switching", ["belonging-inclusion", "dei-reality-intervention"], ["general"]),
        q("DEI_D1_08", "Our culture actively celebrates and integrates diverse identities, perspectives, and lived experiences.", "Likert", false, 1.3, "belonging", ["belonging-inclusion"], ["general"]),
        q("DEI_D1_09", "Does your organization have active, resourced Employee Resource Groups with real leadership access?", "Evidence", false, 1.0, "belonging", ["dei-systems-build"], ["general"], undefined, false, true),
        q("DEI_D1_10", "Our belonging culture extends to race, gender, disability, neurotype, age, and sexual orientation equally.", "Likert", false, 1.2, "belonging", ["belonging-inclusion"], ["general"]),
        q("DEI_D1_11", "I feel that my cultural background and lived experience are an asset here — not something to hide.", "Likert", false, 1.3, "belonging", ["belonging-inclusion"], ["general"]),
        q("DEI_D1_12", "Belonging is measured and reported as a business metric in our organization.", "Evidence", false, 1.0, "belonging", ["dei-systems-build"], ["general"], undefined, false, false),
        q("DEI_D1_13", "How confident are you that all employees feel they truly belong here?", "Confidence", false, 1.2, "belonging", ["belonging-inclusion"], ["general"]),
        q("DEI_D1_14", "Describe a time when you felt you truly belonged — or did not — in this organization.", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 2: Equity & Opportunity",
      description: "Whether access to opportunity is genuinely fair and equitable across all identity dimensions. (12 questions)",
      questions: [
        q("DEI_D2_01", "Promotion and growth opportunities are distributed fairly regardless of gender, race, disability, or neurotype.", "Likert", false, 1.4, "equity", ["equity-accountability"], ["general"]),
        q("DEI_D2_02", "There are identifiable patterns of inequity in who gets promoted, funded, or recognized here.", "HiddenTrigger", false, 1.5, "equity", ["equity-accountability", "performative-dei"], ["general"]),
        q("DEI_D2_03", "Compensation is equitable across identity groups for equivalent roles and performance.", "Likert", false, 1.4, "equity", ["equity-accountability"], ["general"]),
        q("DEI_D2_04", "How often do identity factors (race, gender, disability) visibly affect access to opportunity?", "Frequency", false, 1.4, "equity", ["equity-accountability"], ["general"]),
        q("DEI_D2_05", "How severe is the inequity of access to high-profile projects or leadership development?", "Severity", false, 1.4, "equity", ["equity-accountability"], ["general"]),
        q("DEI_D2_06", "Rank the top 3 barriers to equity in your organization.", "Ranking", false, 0.5, null, [], ["general"]),
        q("DEI_D2_07", "Our organization conducts and acts on pay equity analyses.", "Evidence", false, 1.1, "equity", ["equity-accountability"], ["general"], undefined, false, false),
        q("DEI_D2_08", "Sponsorship and advocacy are distributed equitably across identity groups.", "Likert", false, 1.3, "equity", ["equity-accountability"], ["general"]),
        q("DEI_D2_09", "We say we value diversity in leadership — yet our leadership pipeline remains homogeneous.", "Contradiction", false, 1.4, "performative-dei", ["performative-dei-intervention"], ["general"]),
        q("DEI_D2_10", "Performance evaluation criteria are free from cultural bias.", "Likert", false, 1.3, "bias", ["dei-reality-intervention"], ["general"]),
        q("DEI_D2_11", "How confident are you that equity outcomes are genuinely improving in this organization?", "Confidence", false, 1.2, "equity", ["equity-accountability"], ["general"]),
        q("DEI_D2_12", "What one change would most improve equitable access to opportunity in your organization?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 3: Voice & Influence",
      description: "Whether all employees have meaningful voice and influence in decisions. (12 questions)",
      questions: [
        q("DEI_D3_01", "Employees from underrepresented groups have real influence on important decisions here.", "Likert", false, 1.3, "voice-safety", ["voice-inclusion"], ["general"]),
        q("DEI_D3_02", "Ideas from underrepresented employees are taken as seriously as ideas from dominant groups.", "Likert", false, 1.4, "voice-safety", ["voice-inclusion"], ["general"]),
        q("DEI_D3_03", "I have experienced or witnessed credit for an idea being taken by someone of a more dominant identity.", "HiddenTrigger", false, 1.4, "voice-safety", ["voice-inclusion", "dei-reality-intervention"], ["general"]),
        q("DEI_D3_04", "How often are underrepresented employees overlooked or interrupted in meetings?", "Frequency", false, 1.3, "voice-safety", ["voice-inclusion"], ["general"]),
        q("DEI_D3_05", "How severe is the silencing of marginalized voices in team and leadership spaces?", "Severity", false, 1.4, "voice-safety", ["voice-inclusion"], ["general"]),
        q("DEI_D3_06", "Our decision-making processes actively include and amplify underrepresented voices.", "Likert", false, 1.3, "voice-safety", ["voice-inclusion"], ["general"]),
        q("DEI_D3_07", "We say we listen to all voices — yet the same demographic continues to dominate decisions.", "Contradiction", false, 1.4, "performative-dei", ["performative-dei-intervention"], ["general"]),
        q("DEI_D3_08", "I feel safe expressing a dissenting view as a member of an underrepresented group.", "Likert", false, 1.4, "voice-safety", ["voice-inclusion", "psych-safety-infrastructure"], ["general"]),
        q("DEI_D3_09", "Formal mechanisms exist to amplify underrepresented voices in our organization.", "Evidence", false, 1.0, "voice-safety", ["voice-inclusion"], ["general"], undefined, false, false),
        q("DEI_D3_10", "How confident are you that your voice has real influence on this organization's direction?", "Confidence", false, 1.2, "voice-safety", ["voice-inclusion"], ["general"]),
        q("DEI_D3_11", "How often do underrepresented employees disengage from participation due to feeling unheard?", "Frequency", false, 1.3, "voice-safety", ["retention", "voice-inclusion"], ["general"]),
        q("DEI_D3_12", "What would most increase the voice and influence of underrepresented groups in your organization?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 4: Representation & Leadership",
      description: "Whether representation at all levels matches the organization's diversity commitments. (12 questions)",
      questions: [
        q("DEI_D4_01", "Our senior leadership meaningfully represents the diversity of our workforce and communities we serve.", "Likert", false, 1.3, "equity", ["equity-accountability"], ["general"]),
        q("DEI_D4_02", "Diverse representation exists at entry level but not at leadership — a clear ceiling remains.", "HiddenTrigger", false, 1.5, "equity", ["performative-dei-intervention", "equity-accountability"], ["general"]),
        q("DEI_D4_03", "Diverse candidates are actively recruited and retained at all organizational levels.", "Likert", false, 1.2, "equity", ["talent-pipeline"], ["general"]),
        q("DEI_D4_04", "How often do diverse hires leave within 2 years — signaling inclusion failure rather than recruitment success?", "Frequency", false, 1.4, "retention", ["recognition-retention", "dei-reality-intervention"], ["general"]),
        q("DEI_D4_05", "How severe is the gap between the organization's stated diversity commitments and leadership demographics?", "Severity", false, 1.4, "equity", ["performative-dei-intervention"], ["general"]),
        q("DEI_D4_06", "Our recruiting and hiring processes are free from identifiable bias.", "Likert", false, 1.3, "bias", ["dei-reality-intervention"], ["general"]),
        q("DEI_D4_07", "Succession planning actively identifies and develops diverse talent for leadership roles.", "Evidence", false, 1.0, "equity", ["talent-pipeline"], ["general"], undefined, false, false),
        q("DEI_D4_08", "Visible leaders from underrepresented groups are set up to succeed — not tokenized.", "Likert", false, 1.3, "belonging", ["belonging-inclusion", "equity-accountability"], ["general"]),
        q("DEI_D4_09", "How confident are you that representation at senior levels will meaningfully improve in 3 years?", "Confidence", false, 1.2, "equity", ["equity-accountability"], ["general"]),
        q("DEI_D4_10", "Mentorship and sponsorship programs specifically target underrepresented talent.", "Evidence", false, 1.0, "equity", ["talent-pipeline"], ["general"], undefined, false, false),
        q("DEI_D4_11", "We measure and publicly report on representation goals and progress.", "Likert", false, 1.1, "equity", ["equity-accountability", "dei-systems-build"], ["general"]),
        q("DEI_D4_12", "What structural change would most meaningfully improve diversity in leadership in your organization?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
    {
      title: "Domain 5: DEI Systems & Accountability",
      description: "Whether DEI commitments are backed by real systems, data, and consequences. (12 questions)",
      questions: [
        q("DEI_D5_01", "Our DEI commitments are backed by real budget, staffing, and structural investment.", "Likert", false, 1.4, "performative-dei", ["dei-systems-build"], ["general"]),
        q("DEI_D5_02", "We have DEI goals that are measured, reported, and tied to leadership accountability.", "Evidence", false, 1.1, "equity", ["equity-accountability", "dei-systems-build"], ["general"], undefined, true, true),
        q("DEI_D5_03", "Leaders are held accountable for DEI outcomes in performance evaluations.", "Likert", false, 1.4, "accountability", ["performance-accountability", "dei-systems-build"], ["general"]),
        q("DEI_D5_04", "Our DEI strategy moves beyond awareness training to structural change.", "Likert", false, 1.3, "performative-dei", ["dei-systems-build", "performative-dei-intervention"], ["general"]),
        q("DEI_D5_05", "How often does our DEI effort produce visible, measurable behavior change?", "Frequency", false, 1.3, "performative-dei", ["dei-systems-build"], ["general"]),
        q("DEI_D5_06", "How severe is the gap between our DEI rhetoric and our operational investment?", "Severity", false, 1.5, "performative-dei", ["performative-dei-intervention"], ["general"]),
        q("DEI_D5_07", "We say we are committed to DEI — yet investment in DEI programs is the first cut when budgets tighten.", "Contradiction", false, 1.5, "performative-dei", ["performative-dei-intervention"], ["general"]),
        q("DEI_D5_08", "Psychological safety exists equitably — employees across all identity groups feel equally safe.", "Likert", false, 1.4, "inclusion", ["belonging-inclusion", "psych-safety-infrastructure"], ["general"]),
        q("DEI_D5_09", "Our DEI efforts are co-created with the communities they are intended to serve.", "Likert", false, 1.2, "equity", ["dei-systems-build"], ["general"]),
        q("DEI_D5_10", "Microaggressions and exclusionary behavior are addressed swiftly and consistently.", "Likert", false, 1.3, "bias", ["dei-reality-intervention"], ["general"]),
        q("DEI_D5_11", "How confident are you that our organization is serious about closing its DEI gaps?", "Confidence", false, 1.3, "performative-dei", ["dei-systems-build"], ["general"]),
        q("DEI_D5_12", "What would you need to see to believe that this organization is genuinely committed to DEI equity?", "OpenEnded", false, 0.5, null, [], ["general"]),
      ],
    },
  ],
};

// ─── Export all templates ─────────────────────────────────────────────────────

export const WVW_AUDIT_TEMPLATES: WvwAuditTemplate[] = [
  ENTRY_AUDIT,
  CORE_AUDIT,
  PSYCH_SAFETY_DEEP_DIVE,
  BURNOUT_DEEP_DIVE,
  LEADERSHIP_DEEP_DIVE,
  MORAL_INJURY_DEEP_DIVE,
  NEUROINCLUSION_DEEP_DIVE,
  DEI_DEEP_DIVE,
];
