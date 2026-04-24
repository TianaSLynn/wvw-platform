/**
 * Seeds WVW's proprietary organizational audit templates.
 * These are survey-style assessments using 5-point Likert scales.
 * Run: npx tsx prisma/seed-wvw-audits.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ── Types ──────────────────────────────────────────────────────────────────────
type QuestionSeed = {
  questionCode: string;
  prompt: string;
  helpText?: string;
  responseType: "likert";
  scaleMin: number;
  scaleMax: number;
  reverseScored: boolean;
  weight: number;
  required: boolean;
  active: boolean;
  benchmarkTag?: string;
  riskTag?: string;
};

type DomainSeed = {
  name: string;
  orderIndex: number;
  questions: QuestionSeed[];
};

type AuditSeed = {
  slug: string;
  name: string;
  tier: 0 | 1 | 2 | 3;
  domains: DomainSeed[];
};

// ── Audit Definitions ─────────────────────────────────────────────────────────

const audit1Readiness: AuditSeed = {
  slug: "organizational-readiness",
  name: "Organizational Readiness Audit",
  tier: 0,
  domains: [
    {
      name: "Leadership Commitment",
      orderIndex: 1,
      questions: [
        { questionCode: "ORA_LC_01", prompt: "Senior leaders are willing to have their own practices assessed.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true, riskTag: "readiness" },
        { questionCode: "ORA_LC_02", prompt: "Senior leaders are prepared to hear findings that may be unfavorable.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true, riskTag: "readiness" },
        { questionCode: "ORA_LC_03", prompt: "This engagement is being approached as a change process, not a validation exercise.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true, riskTag: "readiness" },
      ],
    },
    {
      name: "Budget & Resourcing",
      orderIndex: 2,
      questions: [
        { questionCode: "ORA_BR_01", prompt: "Resources are available to act on high-priority findings.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true, riskTag: "investment" },
        { questionCode: "ORA_BR_02", prompt: "Decision-makers with spending authority are involved in this engagement.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true, riskTag: "investment" },
        { questionCode: "ORA_BR_03", prompt: "The organization can support implementation work beyond the assessment phase.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
    {
      name: "Change Readiness",
      orderIndex: 3,
      questions: [
        { questionCode: "ORA_CR_01", prompt: "Leaders understand that meaningful improvement may require structural change.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "ORA_CR_02", prompt: "The organization is prepared to revisit policies, practices, or workflows if harm is identified.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true, riskTag: "policy-change" },
        { questionCode: "ORA_CR_03", prompt: "Teams are likely to participate in follow-through after findings are shared.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
    {
      name: "Accountability",
      orderIndex: 4,
      questions: [
        { questionCode: "ORA_AC_01", prompt: "There is a clear process for assigning ownership of post-audit actions.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "ORA_AC_02", prompt: "Leadership is prepared to make visible commitments after findings are reviewed.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
    {
      name: "Alignment with WVW Approach",
      orderIndex: 5,
      questions: [
        { questionCode: "ORA_WVW_01", prompt: "Confidentiality is treated as essential to obtaining accurate findings.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "ORA_WVW_02", prompt: "The organization is prepared for a process that goes beyond a one-time presentation.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
  ],
};

const audit2Leadership: AuditSeed = {
  slug: "leadership-power-structure",
  name: "Leadership & Power Structure Audit",
  tier: 1,
  domains: [
    {
      name: "Accountability",
      orderIndex: 1,
      questions: [
        { questionCode: "LPS_AC_01", prompt: "Leaders are held accountable when their behavior causes harm.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true, riskTag: "accountability" },
        { questionCode: "LPS_AC_02", prompt: "Standards of conduct are applied to leaders as consistently as they are to staff.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true, riskTag: "fairness" },
        { questionCode: "LPS_AC_03", prompt: "Staff can report leadership-related concerns without fear of penalty.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "retaliation" },
      ],
    },
    {
      name: "Decision-Making Clarity",
      orderIndex: 2,
      questions: [
        { questionCode: "LPS_DC_01", prompt: "Staff understand who has final decision-making authority in key areas.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "LPS_DC_02", prompt: "Important decisions are explained in a way staff can understand.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "LPS_DC_03", prompt: "The reasons behind major organizational decisions are communicated clearly.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
    {
      name: "Leadership Accessibility",
      orderIndex: 3,
      questions: [
        { questionCode: "LPS_LA_01", prompt: "Leaders are visible outside of crisis situations.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 0.9, required: true, active: true },
        { questionCode: "LPS_LA_02", prompt: "Staff can raise concerns to leadership through accessible channels.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "LPS_LA_03", prompt: "Leadership responds to significant concerns within a reasonable timeframe.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Delegation & Power Distribution",
      orderIndex: 4,
      questions: [
        { questionCode: "LPS_PD_01", prompt: "Managers have appropriate authority to make decisions within their roles.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "LPS_PD_02", prompt: "Decision-making is not overly concentrated in a small number of people.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.2, required: true, active: true, riskTag: "power-concentration" },
        { questionCode: "LPS_PD_03", prompt: "Escalation pathways are clear when decisions cannot be made at lower levels.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 0.9, required: true, active: true },
      ],
    },
    {
      name: "Ethical Leadership",
      orderIndex: 5,
      questions: [
        { questionCode: "LPS_EL_01", prompt: "Leadership behavior is aligned with the organization's stated values.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "LPS_EL_02", prompt: "Promotions and opportunities are based on transparent criteria.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true, riskTag: "favoritism" },
        { questionCode: "LPS_EL_03", prompt: "Staff can respectfully question decisions without damaging their standing.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "voice-risk" },
      ],
    },
  ],
};

const audit3PsychSafety: AuditSeed = {
  slug: "psychological-safety",
  name: "Psychological Safety Audit",
  tier: 1,
  domains: [
    {
      name: "Speaking Up",
      orderIndex: 1,
      questions: [
        { questionCode: "PSY_SU_01", prompt: "People can raise concerns without fear of retaliation.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "retaliation" },
        { questionCode: "PSY_SU_02", prompt: "It is safe to share a dissenting view in this organization.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "PSY_SU_03", prompt: "Staff can name problems before they become crises.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Conflict Handling",
      orderIndex: 2,
      questions: [
        { questionCode: "PSY_CH_01", prompt: "Disagreement is handled respectfully.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "PSY_CH_02", prompt: "Difficult conversations are addressed rather than avoided.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "PSY_CH_03", prompt: "Concerns are worked through instead of being ignored.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
    {
      name: "Trust",
      orderIndex: 3,
      questions: [
        { questionCode: "PSY_TR_01", prompt: "Managers listen without becoming defensive when concerns are raised.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "PSY_TR_02", prompt: "Sensitive issues are handled fairly across people and teams.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "PSY_TR_03", prompt: "People who speak honestly are treated with respect.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Learning Culture",
      orderIndex: 4,
      questions: [
        { questionCode: "PSY_LC_01", prompt: "Mistakes are used to improve systems, not just assign blame.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "PSY_LC_02", prompt: "People can admit when they need help or do not know something.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "PSY_LC_03", prompt: "Feedback across levels is welcomed and used constructively.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
    {
      name: "Retaliation Risk",
      orderIndex: 5,
      questions: [
        { questionCode: "PSY_RR_01", prompt: "Speaking up does not threaten a person's reputation or opportunities.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "retaliation" },
        { questionCode: "PSY_RR_02", prompt: "Employees are not sidelined after raising concerns.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "retaliation" },
        { questionCode: "PSY_RR_03", prompt: "Psychological safety is visible in daily practice, not only in messaging.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
  ],
};

const audit4Burnout: AuditSeed = {
  slug: "burnout-moral-injury",
  name: "Burnout & Moral Injury Audit",
  tier: 1,
  domains: [
    {
      name: "Workload Sustainability",
      orderIndex: 1,
      questions: [
        { questionCode: "BMI_WS_01", prompt: "Work demands are sustainable for most people in this role.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, benchmarkTag: "workload" },
        { questionCode: "BMI_WS_02", prompt: "Chronic workload pressure makes it difficult to do quality work.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.3, required: true, active: true, riskTag: "overload" },
        { questionCode: "BMI_WS_03", prompt: "Staffing levels are sufficient to meet core responsibilities.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Emotional Exhaustion",
      orderIndex: 2,
      questions: [
        { questionCode: "BMI_EE_01", prompt: "I feel emotionally depleted because of how work is structured.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.3, required: true, active: true, riskTag: "burnout" },
        { questionCode: "BMI_EE_02", prompt: "High-demand periods are followed by enough recovery time.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "BMI_EE_03", prompt: "The emotional demands of work are recognized and accounted for.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Staffing & Capacity",
      orderIndex: 3,
      questions: [
        { questionCode: "BMI_SC_01", prompt: "Understaffing creates avoidable strain in this organization.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.3, required: true, active: true, riskTag: "understaffing" },
        { questionCode: "BMI_SC_02", prompt: "Teams have enough capacity to meet expectations effectively.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "BMI_SC_03", prompt: "Work is distributed in a way that feels realistic.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
    {
      name: "Ethical Strain",
      orderIndex: 4,
      questions: [
        { questionCode: "BMI_ES_01", prompt: "I am asked to work in ways that conflict with my values.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.4, required: true, active: true, riskTag: "moral-injury" },
        { questionCode: "BMI_ES_02", prompt: "Pressure to keep things moving sometimes outweighs doing what is right.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.3, required: true, active: true, riskTag: "moral-injury" },
        { questionCode: "BMI_ES_03", prompt: "Structural conditions create moral distress for staff.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.3, required: true, active: true, riskTag: "moral-injury" },
      ],
    },
    {
      name: "Recovery & Support",
      orderIndex: 5,
      questions: [
        { questionCode: "BMI_RS_01", prompt: "I can take needed time off without backlash.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "time-off" },
        { questionCode: "BMI_RS_02", prompt: "I have meaningful support when work becomes overwhelming.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "BMI_RS_03", prompt: "Burnout is addressed here as a systems issue, not an individual weakness.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
  ],
};

const audit5Culture: AuditSeed = {
  slug: "culture-employee-experience",
  name: "Culture & Employee Experience Audit",
  tier: 1,
  domains: [
    {
      name: "Recognition",
      orderIndex: 1,
      questions: [
        { questionCode: "CEE_RC_01", prompt: "Contributions are recognized in a timely way.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "CEE_RC_02", prompt: "Recognition reflects the value of the contribution, not just visibility.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "CEE_RC_03", prompt: "Invisible or behind-the-scenes labor is acknowledged.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "invisible-labor" },
      ],
    },
    {
      name: "Belonging",
      orderIndex: 2,
      questions: [
        { questionCode: "CEE_BE_01", prompt: "I feel respected as a person in this organization.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "CEE_BE_02", prompt: "People like me can belong here without diminishing parts of themselves.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "belonging" },
        { questionCode: "CEE_BE_03", prompt: "Team environments support inclusion, not just participation.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Communication",
      orderIndex: 3,
      questions: [
        { questionCode: "CEE_CM_01", prompt: "Important updates are shared clearly and in time to be useful.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "CEE_CM_02", prompt: "Employees understand the reasoning behind major changes.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "CEE_CM_03", prompt: "Communication is consistent across teams and levels.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 0.9, required: true, active: true },
      ],
    },
    {
      name: "Morale",
      orderIndex: 4,
      questions: [
        { questionCode: "CEE_MO_01", prompt: "Morale is generally healthy on my team.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "CEE_MO_02", prompt: "Day-to-day work conditions support energy more than depletion.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "CEE_MO_03", prompt: "Cynicism or disengagement is common here.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.3, required: true, active: true, riskTag: "disengagement" },
      ],
    },
    {
      name: "Value Alignment",
      orderIndex: 5,
      questions: [
        { questionCode: "CEE_VA_01", prompt: "The culture described by leadership matches day-to-day experience.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "CEE_VA_02", prompt: "The organization's stated values are reflected in operational decisions.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "CEE_VA_03", prompt: "Employee experience differs sharply depending on team or manager.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.3, required: true, active: true, riskTag: "inconsistency" },
      ],
    },
  ],
};

const audit6DEI: AuditSeed = {
  slug: "dei-equity-belonging",
  name: "DEI, Equity & Belonging Audit",
  tier: 1,
  domains: [
    {
      name: "Representation",
      orderIndex: 1,
      questions: [
        { questionCode: "DEI_RE_01", prompt: "Leadership reflects key demographics of the communities served.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true, benchmarkTag: "representation" },
        { questionCode: "DEI_RE_02", prompt: "Teams include people from a range of identities and backgrounds.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "DEI_RE_03", prompt: "Clients and communities see themselves reflected in visible roles here.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 0.9, required: true, active: true },
      ],
    },
    {
      name: "Inclusion",
      orderIndex: 2,
      questions: [
        { questionCode: "DEI_IN_01", prompt: "Diverse voices influence real decisions, not just discussions.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "performative" },
        { questionCode: "DEI_IN_02", prompt: "I can bring my full identity to work without hiding important parts of myself.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "covering" },
        { questionCode: "DEI_IN_03", prompt: "Cultural differences are respected rather than pathologized or dismissed.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Advancement Equity",
      orderIndex: 3,
      questions: [
        { questionCode: "DEI_AE_01", prompt: "Advancement opportunities are accessible to people from different backgrounds.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "advancement-gap" },
        { questionCode: "DEI_AE_02", prompt: "Performance criteria for promotion are clear and consistently applied.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "DEI_AE_03", prompt: "Identity-based patterns in advancement are examined and addressed.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Cultural Competence",
      orderIndex: 4,
      questions: [
        { questionCode: "DEI_CC_01", prompt: "Leaders demonstrate competence in navigating identity-related topics.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "DEI_CC_02", prompt: "Bias and microaggressions are addressed when they appear.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "unaddressed-bias" },
        { questionCode: "DEI_CC_03", prompt: "Equity conversations connect to concrete changes in policy or practice.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
      ],
    },
    {
      name: "Tokenization Risk",
      orderIndex: 5,
      questions: [
        { questionCode: "DEI_TR_01", prompt: "Staff from underrepresented groups are not expected to carry equity work alone.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "emotional-labor" },
        { questionCode: "DEI_TR_02", prompt: "People from underrepresented groups are not used as symbols without real power.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "tokenization" },
        { questionCode: "DEI_TR_03", prompt: "Identity-based harm is handled seriously and followed through to resolution.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "identity-harm" },
      ],
    },
  ],
};

const audit7Ops: AuditSeed = {
  slug: "operations-workflow",
  name: "Operations & Workflow Audit",
  tier: 1,
  domains: [
    {
      name: "Role Clarity",
      orderIndex: 1,
      questions: [
        { questionCode: "OPS_RC_01", prompt: "I understand what is expected in my role.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, benchmarkTag: "role-clarity" },
        { questionCode: "OPS_RC_02", prompt: "I know who is responsible for key decisions related to my work.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "OPS_RC_03", prompt: "Expectations for my role do not change unpredictably.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
    {
      name: "Process Clarity",
      orderIndex: 2,
      questions: [
        { questionCode: "OPS_PC_01", prompt: "Key workflows are documented in a way that people actually use.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "tribal-knowledge" },
        { questionCode: "OPS_PC_02", prompt: "We are not constantly reinventing the wheel for routine work.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "OPS_PC_03", prompt: "Staff can find the information they need to do their work effectively.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
      ],
    },
    {
      name: "Tool Effectiveness",
      orderIndex: 3,
      questions: [
        { questionCode: "OPS_TE_01", prompt: "Our tools and systems support efficiency rather than adding friction.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "OPS_TE_02", prompt: "People are not forced to rely on workarounds because systems are inadequate.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.2, required: true, active: true, riskTag: "workaround" },
        { questionCode: "OPS_TE_03", prompt: "Meetings are purposeful and not excessive for the work we do.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 0.9, required: true, active: true },
      ],
    },
    {
      name: "Cross-Team Coordination",
      orderIndex: 4,
      questions: [
        { questionCode: "OPS_CT_01", prompt: "Cross-team communication is functional and timely.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "OPS_CT_02", prompt: "Hand-offs between teams are smooth and clearly owned.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "OPS_CT_03", prompt: "Operational confusion between teams contributes to stress here.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.2, required: true, active: true, riskTag: "coordination-stress" },
      ],
    },
    {
      name: "Duplication / Drag",
      orderIndex: 5,
      questions: [
        { questionCode: "OPS_DD_01", prompt: "Duplicate work is common here.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.3, required: true, active: true, riskTag: "duplication" },
        { questionCode: "OPS_DD_02", prompt: "Approvals do not create unnecessary bottlenecks.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "OPS_DD_03", prompt: "Staff are not forced to rely on informal 'tribal knowledge' alone to get work done.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "tribal-knowledge" },
      ],
    },
  ],
};

const audit8Compliance: AuditSeed = {
  slug: "compliance-policy",
  name: "Compliance & Policy Audit",
  tier: 1,
  domains: [
    {
      name: "Policy Existence",
      orderIndex: 1,
      questions: [
        { questionCode: "COM_PE_01", prompt: "Core policies are current and kept up to date with regulations and best practice.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "COM_PE_02", prompt: "Policies are accessible in a central, easy-to-find location for staff.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Policy Awareness",
      orderIndex: 2,
      questions: [
        { questionCode: "COM_PA_01", prompt: "Staff understand the policies that apply to their roles.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "COM_PA_02", prompt: "Managers receive specific training on policy expectations and updates.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "COM_PA_03", prompt: "Staff know how to access guidance when they are unsure about a policy.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 0.9, required: true, active: true },
      ],
    },
    {
      name: "Enforcement Consistency",
      orderIndex: 3,
      questions: [
        { questionCode: "COM_EC_01", prompt: "Policy violations are addressed consistently, regardless of role or status.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "unequal-enforcement" },
        { questionCode: "COM_EC_02", prompt: "Practice generally matches written policy in day-to-day work.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "COM_EC_03", prompt: "Policy enforcement does not depend on who is involved.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "favoritism" },
      ],
    },
    {
      name: "Documentation",
      orderIndex: 4,
      questions: [
        { questionCode: "COM_DO_01", prompt: "Documentation practices are clear and reinforced for staff who handle records.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "COM_DO_02", prompt: "Required documentation is completed accurately and on time in most cases.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "COM_DO_03", prompt: "Documentation gaps are tracked and addressed before they become compliance issues.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Risk Exposure",
      orderIndex: 5,
      questions: [
        { questionCode: "COM_RE_01", prompt: "Compliance issues are tracked and analyzed rather than ignored or minimized.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "compliance-exposure" },
        { questionCode: "COM_RE_02", prompt: "Risk areas (e.g., safety, privacy, harassment) are proactively reviewed on a regular schedule.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "COM_RE_03", prompt: "Staff know how to report concerns safely and trust the process will be taken seriously.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "reporting-safety" },
      ],
    },
  ],
};

const audit12Recognition: AuditSeed = {
  slug: "recognition-rewards",
  name: "Recognition & Rewards Audit",
  tier: 2,
  domains: [
    {
      name: "Frequency",
      orderIndex: 1,
      questions: [
        { questionCode: "RR_FR_01", prompt: "Recognition for good work happens consistently, not just during crises or campaigns.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "RR_FR_02", prompt: "Appreciation is built into everyday culture, not only formal events.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
    {
      name: "Fairness",
      orderIndex: 2,
      questions: [
        { questionCode: "RR_FA_01", prompt: "Rewards and recognition are distributed fairly across roles and teams.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "inequitable-rewards" },
        { questionCode: "RR_FA_02", prompt: "Recognition is not reserved only for high-visibility or client-facing roles.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
      ],
    },
    {
      name: "Meaningfulness",
      orderIndex: 3,
      questions: [
        { questionCode: "RR_ME_01", prompt: "Recognition feels specific and meaningful, not generic or scripted.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "RR_ME_02", prompt: "Rewards match the level and impact of contributions made.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Cultural Relevance",
      orderIndex: 4,
      questions: [
        { questionCode: "RR_CR_01", prompt: "Recognition practices reflect different identities and cultures in this organization.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "RR_CR_02", prompt: "People are asked what types of recognition are meaningful to them.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
      ],
    },
    {
      name: "Reward Equity",
      orderIndex: 5,
      questions: [
        { questionCode: "RR_RE_01", prompt: "Recognition and rewards do not systematically overlook lower-paid or support roles.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "classism" },
        { questionCode: "RR_RE_02", prompt: "People understand what behaviors and contributions are valued and recognized here.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
  ],
};

const audit9Voice: AuditSeed = {
  slug: "employee-voice-feedback",
  name: "Employee Voice & Feedback Audit",
  tier: 1,
  domains: [
    {
      name: "Listening Systems",
      orderIndex: 1,
      questions: [
        { questionCode: "VOI_LS_01", prompt: "Leadership asks for feedback in ways that feel meaningful, not performative.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "performative-feedback" },
        { questionCode: "VOI_LS_02", prompt: "Feedback systems (surveys, listening sessions, etc.) are easy to access and use.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1, required: true, active: true },
        { questionCode: "VOI_LS_03", prompt: "People are invited to provide feedback beyond annual or one-time surveys.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 0.9, required: true, active: true },
      ],
    },
    {
      name: "Action on Feedback",
      orderIndex: 2,
      questions: [
        { questionCode: "VOI_AF_01", prompt: "Staff see evidence that feedback leads to concrete changes or decisions.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "feedback-futility" },
        { questionCode: "VOI_AF_02", prompt: "Leadership explains what will and will not change in response to feedback.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "VOI_AF_03", prompt: "Employees are informed about changes made in response to concerns raised.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Transparency",
      orderIndex: 3,
      questions: [
        { questionCode: "VOI_TR_01", prompt: "Leadership is transparent about how feedback data is used and protected.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "VOI_TR_02", prompt: "People know what happens after concerns are raised, even if outcomes take time.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "VOI_TR_03", prompt: "Leaders communicate honestly about constraints that affect how feedback can be addressed.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 0.9, required: true, active: true },
      ],
    },
    {
      name: "Anonymous Reporting",
      orderIndex: 4,
      questions: [
        { questionCode: "VOI_AR_01", prompt: "Anonymous reporting options feel genuinely safe and confidential.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "retaliation" },
        { questionCode: "VOI_AR_02", prompt: "Anonymous reports are taken seriously and not dismissed due to anonymity.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "VOI_AR_03", prompt: "People who use anonymous channels do not experience informal backlash or suspicion.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
      ],
    },
    {
      name: "Trust",
      orderIndex: 5,
      questions: [
        { questionCode: "VOI_TRU_01", prompt: "Feedback is not used against employees who speak honestly about problems.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "retaliation" },
        { questionCode: "VOI_TRU_02", prompt: "It feels worth the effort to give honest feedback here.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "VOI_TRU_03", prompt: "Staff do not feel ignored after speaking up about serious issues.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.3, required: true, active: true, riskTag: "voice-silencing" },
      ],
    },
  ],
};

const audit10Neuro: AuditSeed = {
  slug: "neurodiversity-cognitive-inclusion",
  name: "Neurodiversity & Cognitive Inclusion Audit",
  tier: 2,
  domains: [
    {
      name: "Environmental Accommodations",
      orderIndex: 1,
      questions: [
        { questionCode: "NEU_EA_01", prompt: "The physical and digital work environment accommodates diverse sensory needs.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "access-barrier" },
        { questionCode: "NEU_EA_02", prompt: "Quiet spaces or low-stimulation work areas are available when needed.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "NEU_EA_03", prompt: "The accommodation request process is straightforward and non-stigmatizing.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "disclosure-barrier" },
      ],
    },
    {
      name: "Communication Flexibility",
      orderIndex: 2,
      questions: [
        { questionCode: "NEU_CF_01", prompt: "Information is communicated in multiple formats (written, verbal, visual).", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "NEU_CF_02", prompt: "Meeting norms accommodate different communication styles (e.g., time to prepare, written input options).", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "NEU_CF_03", prompt: "People are penalized — formally or informally — for communication styles that differ from the norm.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.4, required: true, active: true, riskTag: "neurotypical-bias" },
      ],
    },
    {
      name: "Performance Evaluation Equity",
      orderIndex: 3,
      questions: [
        { questionCode: "NEU_PE_01", prompt: "Performance evaluation criteria are based on outcomes, not conformity to neurotypical norms.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "eval-bias" },
        { questionCode: "NEU_PE_02", prompt: "Managers are trained to distinguish between performance issues and unmet accommodation needs.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true },
        { questionCode: "NEU_PE_03", prompt: "Promotion pathways do not disadvantage people who work, communicate, or process differently.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true, riskTag: "advancement-equity" },
      ],
    },
    {
      name: "Onboarding & Training Design",
      orderIndex: 4,
      questions: [
        { questionCode: "NEU_OT_01", prompt: "Onboarding materials are available in accessible formats.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "NEU_OT_02", prompt: "Training and learning systems do not rely on a single modality.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
      ],
    },
    {
      name: "Leadership Awareness & Culture",
      orderIndex: 5,
      questions: [
        { questionCode: "NEU_LA_01", prompt: "Leaders understand the value neurodivergent employees bring to teams.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "NEU_LA_02", prompt: "Neurodivergent employees feel they can bring their full cognitive style to work.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.4, required: true, active: true, riskTag: "belonging" },
        { questionCode: "NEU_LA_03", prompt: "There is organizational stigma around mental health diagnoses or learning differences.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.5, required: true, active: true, riskTag: "stigma" },
      ],
    },
  ],
};

const audit11Pipeline: AuditSeed = {
  slug: "leadership-pipeline-succession",
  name: "Leadership Pipeline & Succession Audit",
  tier: 2,
  domains: [
    {
      name: "Identification & Development",
      orderIndex: 1,
      questions: [
        { questionCode: "PIPE_ID_01", prompt: "High-potential employees are actively identified and developed at all levels.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "PIPE_ID_02", prompt: "Development opportunities are connected to a clear leadership pathway.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "PIPE_ID_03", prompt: "Leadership development is an informal, ad hoc process rather than a structured program.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.3, required: true, active: true, riskTag: "pipeline-gap" },
      ],
    },
    {
      name: "Equity in Advancement",
      orderIndex: 2,
      questions: [
        { questionCode: "PIPE_EA_01", prompt: "People from underrepresented groups are as likely to be identified as high-potential as others.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.5, required: true, active: true, riskTag: "advancement-inequity" },
        { questionCode: "PIPE_EA_02", prompt: "Leadership demographics reflect the diversity of the broader workforce.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.4, required: true, active: true, riskTag: "representation" },
        { questionCode: "PIPE_EA_03", prompt: "Informal networks and relationships drive who gets promoted more than formal processes do.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.4, required: true, active: true, riskTag: "sponsorship-bias" },
      ],
    },
    {
      name: "Succession Planning",
      orderIndex: 3,
      questions: [
        { questionCode: "PIPE_SP_01", prompt: "Critical leadership roles have identified successors.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "continuity-risk" },
        { questionCode: "PIPE_SP_02", prompt: "Succession planning extends below the senior leadership level.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "PIPE_SP_03", prompt: "The departure of a single leader would create significant operational disruption.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: true, weight: 1.4, required: true, active: true, riskTag: "key-person-risk" },
      ],
    },
    {
      name: "Mentorship & Sponsorship",
      orderIndex: 4,
      questions: [
        { questionCode: "PIPE_MS_01", prompt: "Formal mentorship is available and utilized across the organization.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "PIPE_MS_02", prompt: "Senior leaders actively sponsor (not just mentor) employees from underrepresented groups.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "equity-sponsorship" },
      ],
    },
    {
      name: "Promotion Transparency",
      orderIndex: 5,
      questions: [
        { questionCode: "PIPE_PT_01", prompt: "Employees understand what it takes to advance in this organization.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true },
        { questionCode: "PIPE_PT_02", prompt: "Promotion decisions are communicated clearly with documented rationale.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "PIPE_PT_03", prompt: "Promotion criteria are applied consistently regardless of identity or relationships.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.4, required: true, active: true, riskTag: "favoritism" },
      ],
    },
  ],
};

const audit13Client: AuditSeed = {
  slug: "client-experience-satisfaction",
  name: "Client Experience & Satisfaction Audit",
  tier: 3,
  domains: [
    {
      name: "Communication Quality",
      orderIndex: 1,
      questions: [
        { questionCode: "CLI_CQ_01", prompt: "Our team communicates clearly and proactively throughout the engagement.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "CLI_CQ_02", prompt: "Clients receive timely updates without needing to follow up.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true, riskTag: "communication-gap" },
        { questionCode: "CLI_CQ_03", prompt: "Deliverables are explained in language that is accessible and actionable for the client.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
      ],
    },
    {
      name: "Engagement Process",
      orderIndex: 2,
      questions: [
        { questionCode: "CLI_EP_01", prompt: "The scope and process of the engagement were clearly established before work began.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "CLI_EP_02", prompt: "The client understands each phase of the audit process and what to expect.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "CLI_EP_03", prompt: "Timelines were realistic and largely adhered to.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true, riskTag: "timeline-risk" },
      ],
    },
    {
      name: "Value Delivery",
      orderIndex: 3,
      questions: [
        { questionCode: "CLI_VD_01", prompt: "The findings we surfaced were genuinely useful and actionable for the client.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.4, required: true, active: true, benchmarkTag: "value" },
        { questionCode: "CLI_VD_02", prompt: "The client feels they received value commensurate with the investment.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.4, required: true, active: true, benchmarkTag: "roi" },
        { questionCode: "CLI_VD_03", prompt: "Recommendations were specific to the client's context, not generic.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true },
      ],
    },
    {
      name: "Relationship & Trust",
      orderIndex: 4,
      questions: [
        { questionCode: "CLI_RT_01", prompt: "The client felt treated with respect and professionalism throughout.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true },
        { questionCode: "CLI_RT_02", prompt: "The client trusts that WVW handled their sensitive information with care.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.5, required: true, active: true, riskTag: "data-trust" },
        { questionCode: "CLI_RT_03", prompt: "The client would engage WVW again or refer WVW to other organizations.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.4, required: true, active: true, benchmarkTag: "nps-proxy" },
      ],
    },
    {
      name: "Responsiveness & Follow-Through",
      orderIndex: 5,
      questions: [
        { questionCode: "CLI_RF_01", prompt: "Questions and concerns raised by the client were addressed promptly.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.2, required: true, active: true },
        { questionCode: "CLI_RF_02", prompt: "Post-engagement support was available when needed.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.1, required: true, active: true },
        { questionCode: "CLI_RF_03", prompt: "The client felt supported in implementing findings, not left to figure it out alone.", responseType: "likert", scaleMin: 1, scaleMax: 5, reverseScored: false, weight: 1.3, required: true, active: true },
      ],
    },
  ],
};

// ── Tier → AuditType mapping ──────────────────────────────────────────────────
function tierToType(tier: number): "COMPLIANCE" | "HR" | "OPERATIONAL" | "CUSTOM" {
  if (tier === 0) return "OPERATIONAL";   // Readiness (pre-engagement)
  if (tier === 1) return "HR";             // Core organizational health
  if (tier === 2) return "HR";             // Specialty HR
  return "CUSTOM";
}

// ── Guidance builder — encodes metadata for scoring engine ───────────────────
function buildGuidance(q: QuestionSeed): string {
  const parts: string[] = [`code:${q.questionCode}`];
  if (q.reverseScored) parts.push("reverse:true");
  if (q.riskTag)       parts.push(`risk:${q.riskTag}`);
  if (q.benchmarkTag)  parts.push(`benchmark:${q.benchmarkTag}`);
  parts.push(`scale:${q.scaleMin}-${q.scaleMax}`);
  return parts.join(" | ");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding WVW proprietary audit templates...\n");

  const org = await db.organization.findFirst({ where: { slug: "wvw" } });
  if (!org) throw new Error("Run prisma/seed.ts first — org not found");

  const allAudits: AuditSeed[] = [
    audit1Readiness,
    audit2Leadership,
    audit3PsychSafety,
    audit4Burnout,
    audit5Culture,
    audit6DEI,
    audit7Ops,
    audit8Compliance,
    audit9Voice,
    audit10Neuro,
    audit11Pipeline,
    audit12Recognition,
    audit13Client,
  ];

  let templateCount = 0;
  let sectionCount  = 0;
  let questionCount = 0;

  for (const audit of allAudits) {
    const tplId = `wvw-tpl-${audit.slug}`;

    // Delete existing so sections/items don't duplicate on re-run
    await db.auditTemplate.deleteMany({ where: { id: tplId } });

    const totalQuestions = audit.domains.reduce((s, d) => s + d.questions.length, 0);
    const description = `Tier ${audit.tier} | ${audit.domains.length} domains | ${totalQuestions} questions | Likert 1–5`;

    await db.auditTemplate.create({
      data: {
        id:          tplId,
        orgId:       org.id,
        name:        audit.name,
        description,
        type:        tierToType(audit.tier),
        version:     `tier-${audit.tier}`,
        isPublished: true,
        sections: {
          create: audit.domains.map((domain) => ({
            title:     domain.name,
            sortOrder: domain.orderIndex,
            items: {
              create: domain.questions.map((q, qi) => ({
                question:         q.prompt,
                guidance:         buildGuidance(q),
                riskWeight:       q.weight,
                isRequired:       q.required,
                evidenceRequired: false,
                sortOrder:        qi + 1,
              })),
            },
          })),
        },
      },
    });

    sectionCount  += audit.domains.length;
    questionCount += audit.domains.reduce((s, d) => s + d.questions.length, 0);
    templateCount++;
    console.log(`  ✓ [Tier ${audit.tier}] ${audit.name} — ${audit.domains.length} domains, ${audit.domains.reduce((s, d) => s + d.questions.length, 0)} questions`);
  }

  console.log(`\n✅ Done!`);
  console.log(`   ${templateCount} WVW audit templates`);
  console.log(`   ${sectionCount} domains/sections`);
  console.log(`   ${questionCount} Likert questions`);
  console.log(`   All 13 WVW proprietary audit templates seeded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
