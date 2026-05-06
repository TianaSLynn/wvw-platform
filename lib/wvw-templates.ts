// WVW Intelligence Audit Engine™ — 15 Proprietary Wellness Audit Templates
// "Care with expectations. Soft in appearance. Uncompromising in practice."

export interface WvwTemplateItem {
  question: string;
  guidance?: string;
  riskWeight?: number;
  evidenceRequired?: boolean;
}

export interface WvwTemplateSection {
  title: string;
  description?: string;
  items: WvwTemplateItem[];
}

export interface WvwTemplate {
  name: string;
  slug: string;
  description: string;
  type: "HR" | "COMPLIANCE" | "OPERATIONAL" | "RISK" | "INTERNAL" | "CUSTOM";
  sections: WvwTemplateSection[];
}

export const WVW_TEMPLATES: WvwTemplate[] = [
  {
    name: "Organizational Wellness Assessment",
    slug: "organizational-wellness",
    description:
      "A comprehensive review of the organization's overall wellness posture — culture, systems, leadership, and people practices.",
    type: "HR",
    sections: [
      {
        title: "Mission & Values Alignment",
        items: [
          { question: "The organization's stated values are visible and reinforced in day-to-day operations.", riskWeight: 1.5 },
          { question: "Leadership consistently models the organization's stated values.", riskWeight: 1.5 },
          { question: "Staff can articulate the organization's mission and how their work connects to it.", riskWeight: 1.2 },
          { question: "Performance reviews include an assessment of values alignment, not just output.", riskWeight: 1.0 },
        ],
      },
      {
        title: "Structural Health",
        items: [
          { question: "Roles and responsibilities are clearly defined and communicated across teams.", riskWeight: 1.2 },
          { question: "Decision-making authority is distributed at appropriate levels of the organization.", riskWeight: 1.3 },
          { question: "Org chart reflects actual power structures and accountabilities.", riskWeight: 1.0 },
          { question: "Workflows are documented and accessible to the people who need them.", riskWeight: 1.0 },
          { question: "Teams have the resources (budget, tools, headcount) to accomplish their goals.", riskWeight: 1.4 },
        ],
      },
      {
        title: "Communication Systems",
        items: [
          { question: "Leadership shares organizational updates regularly and transparently.", riskWeight: 1.3 },
          { question: "Staff have reliable channels to escalate concerns without fear of retaliation.", riskWeight: 2.0 },
          { question: "Cross-departmental communication is effective and intentional.", riskWeight: 1.0 },
          { question: "Meeting cadences are purposeful and do not contribute to meeting fatigue.", riskWeight: 0.8 },
        ],
      },
      {
        title: "People & Culture Systems",
        items: [
          { question: "Hiring practices are equitable and reflect the organization's DEI commitments.", riskWeight: 1.5 },
          { question: "Onboarding sets new employees up with the context and connections they need to thrive.", riskWeight: 1.2 },
          { question: "Offboarding is conducted with dignity and used to capture institutional knowledge.", riskWeight: 1.0 },
          { question: "There are clear pathways for professional growth within the organization.", riskWeight: 1.3 },
          { question: "Employee feedback is collected regularly and results in visible action.", riskWeight: 1.5 },
        ],
      },
    ],
  },

  {
    name: "Workplace Culture Audit",
    slug: "workplace-culture",
    description:
      "An in-depth examination of the lived culture — behaviors, norms, unspoken rules, and their alignment with the desired culture.",
    type: "HR",
    sections: [
      {
        title: "Cultural Norms & Behaviors",
        items: [
          { question: "The culture feels psychologically safe — people share ideas without fear of ridicule.", riskWeight: 2.0 },
          { question: "Mistakes are treated as learning opportunities rather than grounds for blame.", riskWeight: 1.5 },
          { question: "Unhealthy competition between colleagues is actively discouraged.", riskWeight: 1.3 },
          { question: "The pace of work is sustainable for most employees most of the time.", riskWeight: 1.5 },
          { question: "Humor and informality exist without marginalizing any group.", riskWeight: 1.2 },
        ],
      },
      {
        title: "Unspoken Rules & Hidden Culture",
        items: [
          { question: "What is publicly stated about culture matches what employees actually experience.", riskWeight: 2.0 },
          { question: "There are no informal 'in-groups' that control access to information or opportunity.", riskWeight: 1.8 },
          { question: "Overwork is not celebrated or treated as a badge of honor.", riskWeight: 1.5 },
          { question: "People feel free to take time off without guilt or professional consequence.", riskWeight: 1.4 },
        ],
      },
      {
        title: "Recognition & Appreciation",
        items: [
          { question: "Contributions from all levels of the organization are recognized, not just senior roles.", riskWeight: 1.3 },
          { question: "Recognition is timely, specific, and genuine.", riskWeight: 1.2 },
          { question: "Recognition practices are equitable across demographics.", riskWeight: 1.5 },
          { question: "Peer-to-peer appreciation is encouraged and normalized.", riskWeight: 1.0 },
        ],
      },
      {
        title: "Conflict & Accountability",
        items: [
          { question: "Conflict is addressed directly and constructively rather than suppressed.", riskWeight: 1.5 },
          { question: "Accountability applies equally regardless of seniority.", riskWeight: 2.0 },
          { question: "There is a clear, accessible process for raising interpersonal concerns.", riskWeight: 1.8 },
          { question: "Toxic behaviors are addressed promptly and consistently.", riskWeight: 2.0 },
        ],
      },
    ],
  },

  {
    name: "Leadership Effectiveness Review",
    slug: "leadership-effectiveness",
    description:
      "Evaluates the practices, habits, and impact of leaders at all levels — from executives to first-time managers.",
    type: "HR",
    sections: [
      {
        title: "Vision & Direction Setting",
        items: [
          { question: "Leaders articulate a clear, compelling vision that motivates the team.", riskWeight: 1.5 },
          { question: "Strategic priorities are communicated clearly and updated when they change.", riskWeight: 1.3 },
          { question: "Leaders help the team understand how their work connects to organizational goals.", riskWeight: 1.2 },
        ],
      },
      {
        title: "People Development",
        items: [
          { question: "Leaders invest regular time in the professional growth of their direct reports.", riskWeight: 1.5 },
          { question: "Feedback is given frequently, specifically, and with care.", riskWeight: 1.5 },
          { question: "Leaders advocate for their team's needs and growth opportunities.", riskWeight: 1.4 },
          { question: "Leadership development is resourced and prioritized across the organization.", riskWeight: 1.3 },
        ],
      },
      {
        title: "Decision-Making & Accountability",
        items: [
          { question: "Leaders make timely decisions without creating unnecessary bottlenecks.", riskWeight: 1.3 },
          { question: "Leaders take responsibility for outcomes rather than deflecting to their teams.", riskWeight: 1.8 },
          { question: "Leaders involve the right people in decisions at the right time.", riskWeight: 1.2 },
        ],
      },
      {
        title: "Emotional Intelligence & Presence",
        items: [
          { question: "Leaders demonstrate empathy and care for their team's wellbeing.", riskWeight: 1.5 },
          { question: "Leaders regulate their own stress without burdening the team.", riskWeight: 1.4 },
          { question: "Leaders create space for honest conversations, even when the news is difficult.", riskWeight: 1.6 },
          { question: "Leaders are accessible and present, not just available on paper.", riskWeight: 1.3 },
        ],
      },
    ],
  },

  {
    name: "Team Dynamics Assessment",
    slug: "team-dynamics",
    description:
      "A focused look at how a team functions together — trust, roles, collaboration, and collective performance.",
    type: "HR",
    sections: [
      {
        title: "Trust & Psychological Safety",
        items: [
          { question: "Team members trust each other to follow through on commitments.", riskWeight: 1.8 },
          { question: "People feel safe disagreeing or raising concerns within the team.", riskWeight: 2.0 },
          { question: "There is no scapegoating or blame-shifting when things go wrong.", riskWeight: 1.8 },
        ],
      },
      {
        title: "Role Clarity & Collaboration",
        items: [
          { question: "Each team member understands their role and how it relates to others.", riskWeight: 1.3 },
          { question: "Collaboration is the norm, not the exception.", riskWeight: 1.2 },
          { question: "Work is distributed fairly across team members.", riskWeight: 1.4 },
          { question: "The team has a shared understanding of quality and what 'done' looks like.", riskWeight: 1.2 },
        ],
      },
      {
        title: "Team Communication",
        items: [
          { question: "Team meetings are productive, inclusive, and have clear outcomes.", riskWeight: 1.0 },
          { question: "Information flows freely within the team without unnecessary gatekeeping.", riskWeight: 1.3 },
          { question: "Disagreements are navigated respectfully and resolved in a timely manner.", riskWeight: 1.5 },
        ],
      },
      {
        title: "Team Resilience & Morale",
        items: [
          { question: "The team maintains morale and effectiveness during periods of high pressure.", riskWeight: 1.5 },
          { question: "Wins are celebrated and setbacks are processed together.", riskWeight: 1.0 },
          { question: "The team proactively surfaces risks rather than waiting for problems to escalate.", riskWeight: 1.4 },
        ],
      },
    ],
  },

  {
    name: "Employee Wellbeing Audit",
    slug: "employee-wellbeing",
    description:
      "Examines the physical, mental, and emotional wellbeing infrastructure the organization provides and how it is experienced by employees.",
    type: "HR",
    sections: [
      {
        title: "Mental Health Support",
        items: [
          { question: "The organization provides access to mental health resources (EAP, counseling, etc.).", riskWeight: 1.8, evidenceRequired: true },
          { question: "Mental health resources are promoted regularly and without stigma.", riskWeight: 1.5 },
          { question: "Managers are trained to recognize signs of distress and respond with care.", riskWeight: 1.8 },
          { question: "The organization has a defined crisis response protocol for employee mental health emergencies.", riskWeight: 2.0, evidenceRequired: true },
        ],
      },
      {
        title: "Physical Wellbeing",
        items: [
          { question: "The physical work environment supports employee health and safety.", riskWeight: 1.5 },
          { question: "Remote or hybrid employees have adequate workspace support.", riskWeight: 1.2 },
          { question: "Health benefits are comprehensive, accessible, and clearly communicated.", riskWeight: 1.5, evidenceRequired: true },
        ],
      },
      {
        title: "Workload & Energy Management",
        items: [
          { question: "Workloads are regularly reviewed to prevent chronic overload.", riskWeight: 1.8 },
          { question: "Employees feel empowered to set boundaries around their availability.", riskWeight: 1.5 },
          { question: "Deadlines are realistic and adjusted when circumstances change.", riskWeight: 1.4 },
          { question: "There are organizational norms around after-hours communication.", riskWeight: 1.3 },
        ],
      },
      {
        title: "Financial Wellbeing",
        items: [
          { question: "Compensation is reviewed regularly against market benchmarks.", riskWeight: 1.5 },
          { question: "Employees have access to financial wellness tools or education.", riskWeight: 1.0 },
          { question: "Pay equity across gender, race, and role level is assessed and addressed.", riskWeight: 2.0, evidenceRequired: true },
        ],
      },
    ],
  },

  {
    name: "Work-Life Balance Assessment",
    slug: "work-life-balance",
    description:
      "Assesses whether the organization's policies, culture, and practices genuinely support sustainable work-life integration.",
    type: "HR",
    sections: [
      {
        title: "Time & Flexibility Policies",
        items: [
          { question: "The organization offers flexible scheduling options that meet diverse employee needs.", riskWeight: 1.5 },
          { question: "Time off policies are generous, clearly communicated, and actually used.", riskWeight: 1.5 },
          { question: "Parental leave policies are equitable and support all types of families.", riskWeight: 1.8, evidenceRequired: true },
          { question: "There is no implicit penalty for using approved leave or flexibility options.", riskWeight: 2.0 },
        ],
      },
      {
        title: "Boundary Culture",
        items: [
          { question: "Leadership models healthy boundaries around work hours and availability.", riskWeight: 2.0 },
          { question: "Employees are not expected to respond to non-emergency communications outside core hours.", riskWeight: 1.8 },
          { question: "The organization has an explicit 'right to disconnect' norm or policy.", riskWeight: 1.5 },
        ],
      },
      {
        title: "Life Events & Caregiving",
        items: [
          { question: "Employees with caregiving responsibilities are supported without professional penalty.", riskWeight: 1.8 },
          { question: "The organization accommodates major life events (illness, loss, relocation) with flexibility and compassion.", riskWeight: 1.5 },
          { question: "Emergency leave options exist and are communicated clearly.", riskWeight: 1.5, evidenceRequired: true },
        ],
      },
      {
        title: "Recovery & Restoration",
        items: [
          { question: "Employees are encouraged to fully disconnect during vacation.", riskWeight: 1.5 },
          { question: "There are micro-recovery opportunities built into the workday (breaks, transitions).", riskWeight: 1.0 },
          { question: "Sabbatical or extended leave options exist for long-tenured employees.", riskWeight: 1.0 },
        ],
      },
    ],
  },

  {
    name: "DEI & Belonging Audit",
    slug: "dei-belonging",
    description:
      "A rigorous assessment of diversity, equity, inclusion, and belonging practices — from hiring to daily experience.",
    type: "COMPLIANCE",
    sections: [
      {
        title: "Representation & Hiring",
        items: [
          { question: "Hiring processes include structured, bias-mitigating practices.", riskWeight: 1.8, evidenceRequired: true },
          { question: "Job descriptions use inclusive language and are reviewed for exclusionary requirements.", riskWeight: 1.5 },
          { question: "Interview panels are diverse in background and perspective.", riskWeight: 1.5 },
          { question: "Workforce demographics are tracked and used to inform recruitment strategy.", riskWeight: 1.5, evidenceRequired: true },
        ],
      },
      {
        title: "Equity in Systems & Processes",
        items: [
          { question: "Promotion and advancement criteria are transparent and consistently applied.", riskWeight: 2.0 },
          { question: "Pay equity is assessed and any gaps are addressed with a timeline and accountability.", riskWeight: 2.0, evidenceRequired: true },
          { question: "Performance evaluation rubrics are reviewed for bias.", riskWeight: 1.8 },
          { question: "High-visibility opportunities (projects, speaking, recognition) are distributed equitably.", riskWeight: 1.5 },
        ],
      },
      {
        title: "Inclusion & Belonging",
        items: [
          { question: "Employees from all backgrounds feel they belong and can bring their whole selves to work.", riskWeight: 2.0 },
          { question: "The organization actively solicits and acts on feedback from underrepresented groups.", riskWeight: 1.8 },
          { question: "Affinity groups or Employee Resource Groups (ERGs) are supported with time and budget.", riskWeight: 1.3 },
          { question: "Cultural and religious observances are accommodated without burdening the employee.", riskWeight: 1.5 },
        ],
      },
      {
        title: "Education & Accountability",
        items: [
          { question: "DEI training is mandatory, evidence-based, and regularly refreshed — not a one-time event.", riskWeight: 1.5, evidenceRequired: true },
          { question: "Leadership is held accountable for DEI outcomes through goals and measurement.", riskWeight: 2.0 },
          { question: "The organization publicly reports on DEI progress.", riskWeight: 1.3 },
        ],
      },
    ],
  },

  {
    name: "Psychological Safety Audit",
    slug: "psychological-safety",
    description:
      "Evaluates whether employees feel safe to speak up, take risks, and be themselves without fear of punishment or humiliation.",
    type: "HR",
    sections: [
      {
        title: "Voice & Contribution",
        items: [
          { question: "Employees freely share ideas, questions, or concerns in meetings.", riskWeight: 2.0 },
          { question: "Dissenting opinions are welcomed and explored rather than dismissed.", riskWeight: 1.8 },
          { question: "Quiet or introverted employees have alternative channels to contribute.", riskWeight: 1.3 },
        ],
      },
      {
        title: "Risk-Taking & Innovation",
        items: [
          { question: "Employees feel safe to experiment and try new approaches.", riskWeight: 1.8 },
          { question: "Failure is discussed openly as a source of learning.", riskWeight: 1.5 },
          { question: "No one is punished or embarrassed for making honest mistakes.", riskWeight: 2.0 },
          { question: "Employees volunteer for stretch assignments without fearing failure.", riskWeight: 1.3 },
        ],
      },
      {
        title: "Interpersonal Safety",
        items: [
          { question: "Interruptions, dismissals, or talking over others are addressed in real time.", riskWeight: 1.5 },
          { question: "Employees from underrepresented groups experience the same safety as majority groups.", riskWeight: 2.0 },
          { question: "Leaders do not use shame, sarcasm, or public criticism as management tools.", riskWeight: 2.0 },
        ],
      },
      {
        title: "Reporting Without Fear",
        items: [
          { question: "Employees trust that reporting problems will not result in retaliation.", riskWeight: 2.0, evidenceRequired: true },
          { question: "Anonymous reporting channels are available and their use is protected.", riskWeight: 1.8, evidenceRequired: true },
          { question: "Past reports have been handled promptly and appropriately.", riskWeight: 2.0 },
        ],
      },
    ],
  },

  {
    name: "Communication & Collaboration Audit",
    slug: "communication-collaboration",
    description:
      "Assesses how information flows, how decisions are made and shared, and how well people work across teams and functions.",
    type: "OPERATIONAL",
    sections: [
      {
        title: "Internal Communication Quality",
        items: [
          { question: "Organizational announcements reach all staff in a timely and consistent manner.", riskWeight: 1.3 },
          { question: "Critical decisions are explained — not just announced — with context and rationale.", riskWeight: 1.5 },
          { question: "Communication tools are not overwhelming or duplicative.", riskWeight: 1.0 },
          { question: "Important information is archived and searchable, not siloed in inboxes.", riskWeight: 1.0 },
        ],
      },
      {
        title: "Meeting Culture",
        items: [
          { question: "Meetings have clear agendas and outcomes, not just standing time on calendars.", riskWeight: 1.2 },
          { question: "Decision-making meetings result in documented decisions and owners.", riskWeight: 1.3 },
          { question: "There are meeting-free windows that protect focus work.", riskWeight: 1.0 },
          { question: "Participation in meetings is actively facilitated — not dominated by a few voices.", riskWeight: 1.2 },
        ],
      },
      {
        title: "Cross-Functional Collaboration",
        items: [
          { question: "Teams across departments share context and coordinate without unnecessary friction.", riskWeight: 1.3 },
          { question: "Siloing of information between departments is actively addressed.", riskWeight: 1.5 },
          { question: "Shared projects have clear ownership and escalation paths.", riskWeight: 1.3 },
        ],
      },
      {
        title: "Feedback Culture",
        items: [
          { question: "Feedback flows in all directions — not just top-down.", riskWeight: 1.5 },
          { question: "Upward feedback to leadership is encouraged and results in visible change.", riskWeight: 1.8 },
          { question: "Constructive feedback is seen as a gift, not a threat.", riskWeight: 1.5 },
        ],
      },
    ],
  },

  {
    name: "Benefits & Wellness Programs Review",
    slug: "benefits-wellness-programs",
    description:
      "Reviews the comprehensiveness, accessibility, and actual utilization of employee benefits and wellness programming.",
    type: "HR",
    sections: [
      {
        title: "Benefits Comprehensiveness",
        items: [
          { question: "Health insurance options adequately cover employees' diverse healthcare needs.", riskWeight: 1.8, evidenceRequired: true },
          { question: "Dental and vision coverage is included in standard offerings.", riskWeight: 1.2 },
          { question: "Mental health benefits are at parity with physical health benefits.", riskWeight: 2.0, evidenceRequired: true },
          { question: "Retirement savings plans with employer contributions are offered.", riskWeight: 1.5, evidenceRequired: true },
        ],
      },
      {
        title: "Benefits Accessibility & Communication",
        items: [
          { question: "Benefits are clearly communicated during onboarding and open enrollment.", riskWeight: 1.3 },
          { question: "Benefits materials are written in plain language, not just legal/HR jargon.", riskWeight: 1.0 },
          { question: "Benefits usage data is reviewed to identify underutilization and address barriers.", riskWeight: 1.3 },
        ],
      },
      {
        title: "Wellness Programming",
        items: [
          { question: "Wellness programming goes beyond physical health to include mental, emotional, and social wellbeing.", riskWeight: 1.5 },
          { question: "Wellness programs are designed with input from employees, not just leadership.", riskWeight: 1.3 },
          { question: "Participation in wellness programming is voluntary and not tied to insurance discounts that penalize non-participants.", riskWeight: 1.5 },
          { question: "Wellness initiatives are culturally competent and relevant to a diverse workforce.", riskWeight: 1.5 },
        ],
      },
      {
        title: "Special Circumstances Support",
        items: [
          { question: "Disability accommodations are handled with care, confidentiality, and without delay.", riskWeight: 2.0, evidenceRequired: true },
          { question: "Bereavement leave covers a range of losses, not just immediate family.", riskWeight: 1.5 },
          { question: "Fertility, adoption, and family-forming benefits exist and are equitable.", riskWeight: 1.5 },
        ],
      },
    ],
  },

  {
    name: "Manager Effectiveness Assessment",
    slug: "manager-effectiveness",
    description:
      "A targeted review of frontline and mid-level managers — the make-or-break layer of employee experience.",
    type: "HR",
    sections: [
      {
        title: "Clarity & Direction",
        items: [
          { question: "Managers set clear expectations for performance and behavior.", riskWeight: 1.5 },
          { question: "Managers translate organizational strategy into actionable priorities for their team.", riskWeight: 1.3 },
          { question: "Team goals are clearly defined, tracked, and revisited regularly.", riskWeight: 1.3 },
        ],
      },
      {
        title: "Coaching & Development",
        items: [
          { question: "Managers hold regular, meaningful 1:1s that go beyond status updates.", riskWeight: 1.5 },
          { question: "Managers actively sponsor and advocate for their reports' growth.", riskWeight: 1.5 },
          { question: "Managers provide specific, actionable feedback — not just annual reviews.", riskWeight: 1.5 },
          { question: "Managers support employees who are struggling, not just those who are excelling.", riskWeight: 1.8 },
        ],
      },
      {
        title: "Workload & Resource Management",
        items: [
          { question: "Managers protect their team from unnecessary work or organizational chaos.", riskWeight: 1.5 },
          { question: "Managers advocate for adequate resources and escalate when the team is under-resourced.", riskWeight: 1.5 },
          { question: "Managers monitor and adjust workloads to prevent burnout.", riskWeight: 1.8 },
        ],
      },
      {
        title: "Wellbeing Stewardship",
        items: [
          { question: "Managers check in on employee wellbeing as a standard practice, not just when crises arise.", riskWeight: 1.5 },
          { question: "Managers normalize and encourage the use of leave and flexibility policies.", riskWeight: 1.5 },
          { question: "Managers are trained in psychological first aid or mental health awareness.", riskWeight: 1.8, evidenceRequired: true },
        ],
      },
    ],
  },

  {
    name: "Onboarding Experience Audit",
    slug: "onboarding-experience",
    description:
      "Examines the quality, consistency, and long-term effectiveness of the employee onboarding experience.",
    type: "HR",
    sections: [
      {
        title: "Pre-Boarding",
        items: [
          { question: "New hires receive a welcome communication before their first day.", riskWeight: 1.0 },
          { question: "Equipment, access, and workspace are fully ready on day one.", riskWeight: 1.5 },
          { question: "The schedule for the first week is shared in advance.", riskWeight: 1.0 },
        ],
      },
      {
        title: "First 30 Days",
        items: [
          { question: "New hires are introduced to the team, culture, and values in a structured way.", riskWeight: 1.5 },
          { question: "A buddy or onboarding partner is assigned and engaged.", riskWeight: 1.3 },
          { question: "New hires have clarity on their role, team expectations, and 90-day goals.", riskWeight: 1.5 },
          { question: "Administrative and compliance requirements are completed without overwhelming the new hire.", riskWeight: 1.2 },
        ],
      },
      {
        title: "First 90 Days",
        items: [
          { question: "Check-ins with manager and HR occur at 30, 60, and 90 days.", riskWeight: 1.3 },
          { question: "New hire feedback on the onboarding experience is systematically collected.", riskWeight: 1.3 },
          { question: "Early performance issues are addressed constructively, not ignored.", riskWeight: 1.5 },
          { question: "The new hire feels connected to their team and confident in their role.", riskWeight: 1.8 },
        ],
      },
      {
        title: "Onboarding Equity",
        items: [
          { question: "The onboarding experience is consistent across roles, departments, and locations.", riskWeight: 1.5 },
          { question: "Remote and hybrid onboarding receives equivalent investment to in-person.", riskWeight: 1.3 },
          { question: "Onboarding materials are accessible and available in multiple formats.", riskWeight: 1.2 },
        ],
      },
    ],
  },

  {
    name: "Burnout Risk Assessment",
    slug: "burnout-risk",
    description:
      "Identifies systemic risk factors for employee burnout — workload, autonomy, recognition, fairness, community, and values alignment.",
    type: "RISK",
    sections: [
      {
        title: "Workload & Capacity",
        items: [
          { question: "Current workload is sustainable for most employees.", riskWeight: 2.0 },
          { question: "Workload has not materially increased in the past 6 months without additional resources.", riskWeight: 1.8 },
          { question: "Employees can complete their work within reasonable working hours.", riskWeight: 2.0 },
          { question: "There are mechanisms to flag and address workload concerns proactively.", riskWeight: 1.8 },
        ],
      },
      {
        title: "Autonomy & Control",
        items: [
          { question: "Employees have meaningful control over how they do their work.", riskWeight: 1.8 },
          { question: "Employees have input into decisions that directly affect them.", riskWeight: 1.5 },
          { question: "Micromanagement is not the default leadership style.", riskWeight: 1.8 },
        ],
      },
      {
        title: "Recognition & Reward",
        items: [
          { question: "Effort and results are recognized in a timely and meaningful way.", riskWeight: 1.5 },
          { question: "Compensation is competitive and reviewed regularly.", riskWeight: 1.5 },
          { question: "High performers are not rewarded with simply more work.", riskWeight: 2.0 },
        ],
      },
      {
        title: "Fairness & Community",
        items: [
          { question: "The workplace feels fair — policies are applied consistently.", riskWeight: 2.0 },
          { question: "Employees experience genuine camaraderie and connection with colleagues.", riskWeight: 1.5 },
          { question: "Values conflicts between the individual and the organization are rare.", riskWeight: 1.8 },
          { question: "Employees report high levels of meaning and purpose in their work.", riskWeight: 1.5 },
        ],
      },
    ],
  },

  {
    name: "Retention & Engagement Audit",
    slug: "retention-engagement",
    description:
      "Evaluates what is driving retention and engagement — and what risks are pushing employees toward disengagement or departure.",
    type: "HR",
    sections: [
      {
        title: "Engagement Indicators",
        items: [
          { question: "Employees report high levels of energy and enthusiasm for their work.", riskWeight: 1.8 },
          { question: "Discretionary effort is common — employees go beyond the minimum.", riskWeight: 1.5 },
          { question: "Employee engagement is measured regularly with a validated tool.", riskWeight: 1.3, evidenceRequired: true },
          { question: "Engagement data is analyzed by team, department, and demographic group.", riskWeight: 1.5 },
        ],
      },
      {
        title: "Retention Risk Factors",
        items: [
          { question: "Voluntary turnover rate is within acceptable benchmarks for the industry.", riskWeight: 1.8, evidenceRequired: true },
          { question: "Exit interviews are conducted and findings are used to improve the organization.", riskWeight: 1.5, evidenceRequired: true },
          { question: "Stay interviews are conducted to understand what is keeping high performers.", riskWeight: 1.3 },
          { question: "Regrettable turnover (the loss of high-impact people) is tracked and addressed.", riskWeight: 2.0 },
        ],
      },
      {
        title: "Career & Growth",
        items: [
          { question: "Employees see a future for themselves within the organization.", riskWeight: 1.8 },
          { question: "Internal mobility is encouraged and supported.", riskWeight: 1.5 },
          { question: "Learning and development opportunities are available and actively promoted.", riskWeight: 1.3 },
        ],
      },
      {
        title: "Belonging & Connection",
        items: [
          { question: "Employees feel a genuine sense of belonging — not just inclusion in name.", riskWeight: 2.0 },
          { question: "Remote and distributed employees feel as connected as in-office peers.", riskWeight: 1.5 },
          { question: "Social connection is supported without being forced or performative.", riskWeight: 1.0 },
        ],
      },
    ],
  },

  {
    name: "HR Policy Compliance Review",
    slug: "hr-policy-compliance",
    description:
      "A systematic review of HR policies, documentation, and practices for legal compliance and alignment with current employment law.",
    type: "COMPLIANCE",
    sections: [
      {
        title: "Policy Documentation",
        items: [
          { question: "An up-to-date employee handbook exists and is accessible to all staff.", riskWeight: 1.8, evidenceRequired: true },
          { question: "The handbook has been reviewed by legal counsel within the past 2 years.", riskWeight: 1.8, evidenceRequired: true },
          { question: "Policies clearly outline employee rights as well as responsibilities.", riskWeight: 1.5 },
          { question: "Acknowledgement of key policies is documented and on file for each employee.", riskWeight: 1.5, evidenceRequired: true },
        ],
      },
      {
        title: "Anti-Discrimination & Anti-Harassment",
        items: [
          { question: "The organization has a comprehensive anti-harassment and anti-discrimination policy.", riskWeight: 2.0, evidenceRequired: true },
          { question: "A clear complaint procedure exists and is communicated to all employees.", riskWeight: 2.0, evidenceRequired: true },
          { question: "Investigations are conducted promptly, confidentially, and impartially.", riskWeight: 2.0 },
          { question: "Anti-harassment training is mandatory and documented.", riskWeight: 1.8, evidenceRequired: true },
        ],
      },
      {
        title: "Wage & Hour Compliance",
        items: [
          { question: "Employee classification (exempt vs. non-exempt) is correctly applied under applicable law.", riskWeight: 2.0, evidenceRequired: true },
          { question: "Overtime is tracked, approved, and compensated in accordance with applicable law.", riskWeight: 2.0, evidenceRequired: true },
          { question: "Pay stubs and wage statements meet statutory requirements.", riskWeight: 1.8 },
        ],
      },
      {
        title: "Leave & Accommodation",
        items: [
          { question: "FMLA (or equivalent) procedures are documented and correctly administered.", riskWeight: 2.0, evidenceRequired: true },
          { question: "The interactive accommodation process is followed for all disability requests.", riskWeight: 2.0, evidenceRequired: true },
          { question: "Leave records are maintained confidentially and separately from personnel files.", riskWeight: 1.8, evidenceRequired: true },
          { question: "State and local leave laws are tracked and incorporated into policies.", riskWeight: 1.8, evidenceRequired: true },
        ],
      },
    ],
  },
];
