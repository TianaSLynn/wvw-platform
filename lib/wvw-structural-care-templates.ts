// WVW Intelligence Audit Engine™ — Structural Care & Neuroinclusion Audit Suite
// Six modules assessing structural conditions for Black workers, CHWs, and
// neurodivergent staff against the Surgeon General's Essentials for Workplace
// Mental Health & Well-Being and anti-racist governance practice.
import type { WvwTemplate } from "./wvw-templates";

export const WVW_STRUCTURAL_CARE_TEMPLATES: WvwTemplate[] = [
  // ── 1. Structural Mental Health & Safety Audit ─────────────────────────────
  {
    name: "Structural Mental Health & Safety Audit",
    slug: "structural-mental-health-safety",
    description:
      "Assesses organizational alignment with the Surgeon General's five Essentials for Workplace Mental Health & Well-Being: Protection from Harm, Connection & Community, Work-Life Harmony, Mattering at Work, and Opportunities for Growth.",
    type: "HR",
    sections: [
      {
        title: "Protection from Harm",
        description: "Physical and psychological safety, including freedom from discrimination and harassment.",
        items: [
          { question: "An anti-racism and anti-discrimination policy exists, is documented, and is actively enforced.", riskWeight: 2.0, evidenceRequired: true },
          { question: "I feel safe reporting racism, discrimination, or harassment without fear of retaliation.", riskWeight: 2.0 },
          { question: "Workloads and schedules are designed to prevent chronic stress and burnout.", riskWeight: 1.6 },
          { question: "There are clear, trusted channels for reporting safety concerns, and reports are acted on.", riskWeight: 1.8 },
          { question: "Physical workspaces are safe and free of hazards relevant to the role.", riskWeight: 1.3 },
        ],
      },
      {
        title: "Connection & Community",
        description: "Belonging, social support, and a culture of inclusion.",
        items: [
          { question: "I feel a genuine sense of belonging with my colleagues and team.", riskWeight: 1.5 },
          { question: "The organization actively builds opportunities for authentic connection across teams and levels.", riskWeight: 1.2 },
          { question: "Diversity, equity, and inclusion are treated as operating principles, not optics.", riskWeight: 1.7 },
          { question: "New employees are integrated into the community quickly and intentionally during onboarding.", riskWeight: 1.0 },
        ],
      },
      {
        title: "Work-Life Harmony",
        description: "Autonomy, flexibility, and protection of rest.",
        items: [
          { question: "I have meaningful control over how, when, and where my work gets done.", riskWeight: 1.6 },
          { question: "Taking earned time off does not result in guilt, backlash, or a punishing workload on return.", riskWeight: 1.6 },
          { question: "Leadership models healthy boundaries around availability outside of working hours.", riskWeight: 1.3 },
          { question: "Staffing levels are adequate for the volume and intensity of the work.", riskWeight: 1.5 },
        ],
      },
      {
        title: "Mattering at Work",
        description: "Dignity, recognition, and meaningful voice in decisions.",
        items: [
          { question: "My contributions are recognized and valued by my organization.", riskWeight: 1.4 },
          { question: "I understand how my role connects to the organization's broader mission and impact.", riskWeight: 1.0 },
          { question: "I have a real voice in decisions that affect my work and well-being.", riskWeight: 1.7 },
          { question: "Compensation and benefits reflect a living wage and the value of the work performed.", riskWeight: 1.8, evidenceRequired: true },
        ],
      },
      {
        title: "Opportunities for Growth",
        description: "Equitable access to learning, advancement, and skill development.",
        items: [
          { question: "I have access to training and development opportunities relevant to my growth.", riskWeight: 1.2 },
          { question: "Promotion and advancement criteria are clear, consistent, and equitably applied.", riskWeight: 1.6, evidenceRequired: true },
          { question: "Feedback on my performance is constructive, timely, and helps me improve.", riskWeight: 1.1 },
          { question: "There is a documented succession or career-pathing process available to all staff.", riskWeight: 1.0, evidenceRequired: true },
        ],
      },
    ],
  },

  // ── 2. Black Structural Care Audit ──────────────────────────────────────────
  {
    name: "Black Structural Care Audit",
    slug: "black-structural-care",
    description:
      "Measures whether organizational structures treat Black mental health and economic security as infrastructure — not a perk — across pay equity, representation, voice, and harm response. Produces the Black Structural Care Index.",
    type: "CUSTOM",
    sections: [
      {
        title: "Pay Equity & Economic Security",
        description: "Whether compensation structures are reviewed and corrected for racial disparity.",
        items: [
          { question: "A race-disaggregated pay equity review has been conducted within the last 12 months.", riskWeight: 2.0, evidenceRequired: true },
          { question: "I believe pay is equitable across races for employees in similar roles and tenure.", riskWeight: 1.8 },
          { question: "Identified pay gaps are remediated on a documented timeline, not left unaddressed.", riskWeight: 1.8, evidenceRequired: true },
          { question: "Economic security benefits (healthcare, retirement match, paid leave) are equitably accessible to Black staff at all levels.", riskWeight: 1.5 },
        ],
      },
      {
        title: "Representation & Power",
        description: "Whether Black staff hold proportional representation in leadership and decision-making.",
        items: [
          { question: "Black staff representation in senior leadership is proportional to overall workforce representation.", riskWeight: 1.8, evidenceRequired: true },
          { question: "I see people who share my racial identity represented in decision-making roles.", riskWeight: 1.6 },
          { question: "Hiring and promotion pipelines are tracked for racial disparities at each stage.", riskWeight: 1.6, evidenceRequired: true },
          { question: "Black leaders are given real authority and budget, not symbolic titles.", riskWeight: 1.7 },
        ],
      },
      {
        title: "Black Worker Control & Voice",
        description: "Mechanisms for Black staff to shape policy and be heard.",
        items: [
          { question: "There are formal structures (councils, ERGs, advisory committees) for Black workers to influence policy.", riskWeight: 1.5, evidenceRequired: true },
          { question: "My feedback as a Black worker leads to visible, tracked changes in organizational practice.", riskWeight: 1.8 },
          { question: "Black staff are compensated or given protected time for DEI and advisory labor, rather than relying on unpaid volunteerism.", riskWeight: 1.6 },
        ],
      },
      {
        title: "Harm & Incident Response",
        description: "How the organization responds when racial harm occurs.",
        items: [
          { question: "There is a documented, trusted process for reporting racial harm that is independent of the alleged offender's chain of command.", riskWeight: 2.0, evidenceRequired: true },
          { question: "Reports of racial harm are investigated promptly and result in meaningful accountability.", riskWeight: 2.0 },
          { question: "Staff who report racial harm are protected from retaliation, and that protection is monitored.", riskWeight: 1.9 },
          { question: "The organization tracks incident patterns over time to identify systemic, not just individual, harm.", riskWeight: 1.5, evidenceRequired: true },
        ],
      },
    ],
  },

  // ── 3. CHW Structural Care Audit ────────────────────────────────────────────
  {
    name: "CHW Structural Care Audit",
    slug: "chw-structural-care",
    description:
      "Assesses the structural conditions of Community Health Worker (CHW) labor and training — caseload design, trauma-informed supervision, safety, and governance — against CHW employer best-practice standards.",
    type: "HR",
    sections: [
      {
        title: "Caseload & Workload Design",
        description: "Whether caseloads are designed and monitored for sustainability.",
        items: [
          { question: "Caseload standards are clearly defined, documented, and actively monitored.", riskWeight: 1.8, evidenceRequired: true },
          { question: "My caseload is realistically manageable within my contracted hours.", riskWeight: 1.8 },
          { question: "Caseload assignments account for case complexity and acuity, not just volume.", riskWeight: 1.5 },
          { question: "There is a documented process to rebalance caseloads when they become unsustainable.", riskWeight: 1.4, evidenceRequired: true },
        ],
      },
      {
        title: "Trauma-Informed Supervision",
        description: "Whether supervision practices are reflective, supportive, and trauma-informed.",
        items: [
          { question: "Supervisors receive formal training in trauma-informed supervision.", riskWeight: 1.7, evidenceRequired: true },
          { question: "My supervisor actively supports my emotional well-being, not only my task output.", riskWeight: 1.7 },
          { question: "Supervision sessions occur at a predictable, adequate cadence (not ad hoc or skipped).", riskWeight: 1.3 },
          { question: "Reflective supervision is distinct from disciplinary or performance-management conversations.", riskWeight: 1.4 },
        ],
      },
      {
        title: "Safety & Decompression",
        description: "Protections and structured time for processing high-trauma work.",
        items: [
          { question: "Structured debriefs are held after high-trauma client encounters or critical incidents.", riskWeight: 1.8, evidenceRequired: true },
          { question: "I have protected time and support to decompress after emotionally difficult cases.", riskWeight: 1.8 },
          { question: "Field safety protocols exist for home visits and community-based work.", riskWeight: 1.6, evidenceRequired: true },
          { question: "Secondary/vicarious trauma is recognized and addressed as an occupational risk, not an individual failing.", riskWeight: 1.5 },
        ],
      },
      {
        title: "Training Environment & Governance",
        description: "Protections within CHW training and certification pipelines.",
        items: [
          { question: "Protocols exist to prevent exploitation or abuse of CHWs and CHW trainees in training placements.", riskWeight: 1.8, evidenceRequired: true },
          { question: "CHWs and trainees have a trusted, independent mechanism to report training harm and be taken seriously.", riskWeight: 1.9 },
          { question: "Training curricula are co-developed with practicing CHWs, not designed without their input.", riskWeight: 1.2 },
          { question: "Pathways from training/certification into stable, paid employment are clearly defined.", riskWeight: 1.3, evidenceRequired: true },
        ],
      },
    ],
  },

  // ── 4. Neuroinclusion Audit ─────────────────────────────────────────────────
  {
    name: "Neuroinclusion Audit",
    slug: "neuroinclusion",
    description:
      "Assesses whether the organization supports and includes neurodivergent workers — with particular attention to Black neurodivergent staff — across governance, culture, accommodations, hiring, and management practice.",
    type: "HR",
    sections: [
      {
        title: "Accountability & Governance",
        description: "Organizational ownership of neuroinclusion outcomes.",
        items: [
          { question: "A senior leader is formally accountable for neuroinclusion outcomes.", riskWeight: 1.5, evidenceRequired: true },
          { question: "Neuroinclusion goals are documented and reviewed on a regular cadence.", riskWeight: 1.4, evidenceRequired: true },
          { question: "Neuroinclusion data (accommodation requests, retention, engagement) is tracked and reported to leadership.", riskWeight: 1.4, evidenceRequired: true },
        ],
      },
      {
        title: "Awareness & Culture",
        description: "Organizational understanding of and attitudes toward neurodiversity.",
        items: [
          { question: "People in my organization understand neurodiversity and avoid stigmatizing language.", riskWeight: 1.5 },
          { question: "Internal communications and training proactively address neuroinclusion.", riskWeight: 1.2, evidenceRequired: true },
          { question: "Disclosure of a neurodivergent identity is met with support rather than suspicion or penalty.", riskWeight: 1.7 },
        ],
      },
      {
        title: "Reasonable Adjustments & Environment",
        description: "Physical, sensory, and process accommodations.",
        items: [
          { question: "Sensory-friendly spaces or accommodations (lighting, noise control, quiet rooms) are available.", riskWeight: 1.3, evidenceRequired: true },
          { question: "My neurodivergent needs are respected and accommodated without requiring excessive justification.", riskWeight: 1.7 },
          { question: "Requesting an adjustment does not require disclosing a diagnosis to multiple layers of management.", riskWeight: 1.4 },
        ],
      },
      {
        title: "Recruitment & Performance Processes",
        description: "Whether hiring and evaluation processes account for neurodivergent candidates and staff.",
        items: [
          { question: "Recruitment processes offer adjustments (alternative formats, extended time, alternatives to panel interviews).", riskWeight: 1.4, evidenceRequired: true },
          { question: "Performance reviews do not penalize neurodivergent traits such as communication style, focus patterns, or sensory needs.", riskWeight: 1.7 },
          { question: "Job descriptions distinguish essential functions from preferred-but-non-essential traits.", riskWeight: 1.1 },
        ],
      },
      {
        title: "Leadership & Management Training",
        description: "Manager readiness to support neurodivergent staff.",
        items: [
          { question: "Managers are trained in neuroinclusive management practices.", riskWeight: 1.5, evidenceRequired: true },
          { question: "My manager is open to adapting expectations and workflows to my neurodivergent needs.", riskWeight: 1.6 },
          { question: "Managers know how to escalate accommodation requests without unnecessary delay.", riskWeight: 1.2 },
        ],
      },
    ],
  },

  // ── 5. Mental Health Infrastructure & Equity Audit ──────────────────────────
  {
    name: "Mental Health Infrastructure & Equity Audit",
    slug: "mental-health-infrastructure-equity",
    description:
      "Assesses the access, equity, and quality of mental health support infrastructure — benefits design, timeliness of access, utilization and outcome disparities, and manager capacity as an equity multiplier.",
    type: "HR",
    sections: [
      {
        title: "Benefits & Provider Networks",
        description: "Whether mental health benefits are robust and culturally appropriate.",
        items: [
          { question: "The provider network includes a meaningful number of Black and culturally competent clinicians.", riskWeight: 1.7, evidenceRequired: true },
          { question: "Therapy and medication management are covered at a level sufficient for sustained care, not just crisis response.", riskWeight: 1.6, evidenceRequired: true },
          { question: "Mental health benefits are communicated clearly and proactively, not buried in onboarding paperwork.", riskWeight: 1.1 },
        ],
      },
      {
        title: "Access & Timeliness",
        description: "How quickly and easily staff can get care.",
        items: [
          { question: "Time to first available appointment is tracked and is reasonably short (days, not weeks).", riskWeight: 1.6, evidenceRequired: true },
          { question: "I can access mental health care quickly when I need it.", riskWeight: 1.6 },
          { question: "Mental health support is accessible to remote, hourly, and field-based staff, not just office-based salaried staff.", riskWeight: 1.5 },
        ],
      },
      {
        title: "Equity in Utilization & Outcomes",
        description: "Whether access and outcomes differ by race, role, or gender.",
        items: [
          { question: "Utilization of mental health benefits is segmented and reviewed by race, role, and gender.", riskWeight: 1.7, evidenceRequired: true },
          { question: "Outcomes (symptom reduction, retention, satisfaction) are reviewed for disparities across groups.", riskWeight: 1.7, evidenceRequired: true },
          { question: "Barriers to utilization identified by underrepresented groups are addressed with specific action plans.", riskWeight: 1.6, evidenceRequired: true },
        ],
      },
      {
        title: "Manager Capacity as Equity Multipliers",
        description: "Whether managers are equipped to support mental health equitably.",
        items: [
          { question: "Managers receive training on mental health equity, not just generic mental health awareness.", riskWeight: 1.5, evidenceRequired: true },
          { question: "My manager responds supportively, not punitively, when I disclose a mental health need.", riskWeight: 1.7 },
          { question: "Managers are evaluated, in part, on team well-being indicators they have influence over.", riskWeight: 1.2 },
        ],
      },
    ],
  },

  // ── 6. Policy & Governance / Anti-Racist Framework Audit ───────────────────
  {
    name: "Policy & Governance Audit",
    slug: "policy-governance-anti-racist",
    description:
      "Assesses whether organizational policy, governance, and leadership practice are structurally aligned with anti-racist, trauma-informed, and neuroinclusive principles — and whether that alignment is monitored and improved over time.",
    type: "COMPLIANCE",
    sections: [
      {
        title: "Policy Alignment",
        description: "Whether written policy explicitly addresses racial equity, mental health, and neuroinclusion.",
        items: [
          { question: "Organizational policies explicitly reference racial equity commitments, not just general DEI language.", riskWeight: 1.6, evidenceRequired: true },
          { question: "Mental health and neuroinclusion are addressed in formal HR policy, not left to informal practice.", riskWeight: 1.4, evidenceRequired: true },
          { question: "There is a documented process to update policy in response to audit or incident findings.", riskWeight: 1.5, evidenceRequired: true },
        ],
      },
      {
        title: "Governance Practices",
        description: "Whether leadership actively reviews and acts on equity and well-being data.",
        items: [
          { question: "Senior leadership reviews mental health and equity data on a regular, scheduled cadence.", riskWeight: 1.7, evidenceRequired: true },
          { question: "Action plans from audit findings have named owners and tracked deadlines.", riskWeight: 1.7, evidenceRequired: true },
          { question: "Board or governing-body oversight includes accountability for racial equity and well-being outcomes.", riskWeight: 1.5, evidenceRequired: true },
        ],
      },
      {
        title: "Stakeholder Voice & Participation",
        description: "Whether affected groups have real seats in governance.",
        items: [
          { question: "Black staff, CHWs, and neurodivergent staff have direct representation in decision-making bodies.", riskWeight: 1.7, evidenceRequired: true },
          { question: "Policy changes affecting these groups are reviewed with their input before implementation, not after.", riskWeight: 1.6 },
        ],
      },
      {
        title: "Continuous Improvement & Monitoring",
        description: "Whether the organization treats equity and well-being as an ongoing practice, not a one-time event.",
        items: [
          { question: "There is an established cycle for repeating structural care audits and tracking progress over time.", riskWeight: 1.5, evidenceRequired: true },
          { question: "Progress on prior audit recommendations is reported back to staff, not just to leadership.", riskWeight: 1.4 },
          { question: "The organization benchmarks its progress against external standards (e.g., Surgeon General's Essentials).", riskWeight: 1.1 },
        ],
      },
    ],
  },
];
