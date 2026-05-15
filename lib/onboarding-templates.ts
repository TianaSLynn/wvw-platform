export type OnboardingStepTemplate = {
  title:                string;
  description:          string;
  category:             string;
  sortOrder:            number;
  blockedBySortOrder?:  number;
  documentRequired?:    boolean;
  documentLabel?:       string;
};

// ─── Entity types ─────────────────────────────────────────────────────────────
export type OnboardingEntityType = "EMPLOYEE" | "CLIENT" | "STUDENT" | "INSTRUCTOR";

// ─────────────────────────────────────────────────────────────────────────────
//  EMPLOYEE ONBOARDING — 30 steps across 6 phases
//  Phase 1: Legal (steps 1–2)
//  Phase 2: HR setup (steps 3–7)
//  Phase 3: IT setup (steps 8–11)
//  Phase 4: Welcome & first day (steps 12–14)
//  Phase 5: WVW Methodology 2-Week Training (steps 15–24)
//  Phase 6: 30 / 60 / 90-day milestones (steps 25–30)
// ─────────────────────────────────────────────────────────────────────────────
export const EMPLOYEE_ONBOARDING_STEPS: OnboardingStepTemplate[] = [

  // ── Phase 1: Legal ──────────────────────────────────────────────────────────
  { sortOrder: 1,  category: "LEGAL",    title: "Sign offer letter / employment agreement",
    description: "Confirm signed copy is on file before start date.",
    documentRequired: true, documentLabel: "Signed offer letter" },

  { sortOrder: 2,  category: "LEGAL",    title: "Sign NDA and confidentiality agreement",
    description: "Route through DocuSign or manual signature. Store signed copy in employee Documents.",
    blockedBySortOrder: 1,
    documentRequired: true, documentLabel: "Signed NDA" },

  // ── Phase 2: HR Setup ───────────────────────────────────────────────────────
  { sortOrder: 3,  category: "HR",       title: "Complete I-9 employment eligibility verification",
    description: "Verify Section 1 (employee) and Section 2 (employer). Upload ID copies to employee record.",
    blockedBySortOrder: 2,
    documentRequired: true, documentLabel: "I-9 form + supporting ID copies" },

  { sortOrder: 4,  category: "HR",       title: "Collect direct deposit / payroll authorization",
    description: "Secure bank routing and account info. Submit to payroll by Friday of start week.",
    blockedBySortOrder: 3,
    documentRequired: true, documentLabel: "Direct deposit authorization form" },

  { sortOrder: 5,  category: "HR",       title: "Collect emergency contact information",
    description: "Name, relationship, and phone number for at least one emergency contact.",
    blockedBySortOrder: 3,
    documentRequired: true, documentLabel: "Emergency contact form" },

  { sortOrder: 6,  category: "HR",       title: "Benefits enrollment (health, dental, 401k)",
    description: "Provide benefits portal access. Enrollment window is 30 days from start date.",
    blockedBySortOrder: 3,
    documentRequired: true, documentLabel: "Signed benefits enrollment forms" },

  { sortOrder: 7,  category: "HR",       title: "Send Employee Handbook for acknowledgement",
    description: "Send via policy acknowledgement flow in WVW Intelligence. Track completion in the employee's policy tab.",
    blockedBySortOrder: 3,
    documentRequired: true, documentLabel: "Signed handbook acknowledgement" },

  // ── Phase 3: IT Setup ───────────────────────────────────────────────────────
  { sortOrder: 8,  category: "IT",       title: "Add employee to HR system and org chart",
    description: "Create full employee record: department, manager, title, start date.",
    blockedBySortOrder: 7 },

  { sortOrder: 9,  category: "IT",       title: "Create email account and calendar",
    description: "Set up @wvwconsulting.com email. Add to relevant team calendars and distribution lists.",
    blockedBySortOrder: 8 },

  { sortOrder: 10, category: "IT",       title: "Grant WVW Intelligence platform access",
    description: "Invite via Clerk. Assign correct role (CONSULTANT, MANAGER, etc.). Confirm login works.",
    blockedBySortOrder: 9 },

  { sortOrder: 11, category: "IT",       title: "Set up laptop, software, and tool access",
    description: "Configure machine with required tools. Confirm VPN, security, and backup. Provide Slack, Notion, and shared drive access.",
    blockedBySortOrder: 10 },

  // ── Phase 4: Welcome & First Day ────────────────────────────────────────────
  { sortOrder: 12, category: "HR",       title: "Send welcome email with first-day details",
    description: "Include start time, dress code, parking/entry instructions, and first-day agenda.",
    blockedBySortOrder: 11 },

  { sortOrder: 13, category: "CULTURE",  title: "Assign onboarding buddy",
    description: "Pair new hire with a peer buddy for informal questions and culture integration.",
    blockedBySortOrder: 12 },

  { sortOrder: 14, category: "CULTURE",  title: "Schedule Day 1 kickoff 1:1 with direct manager",
    description: "30-minute check-in: first-week expectations, 30/60/90 plan overview, open Q&A.",
    blockedBySortOrder: 12 },

  // ── Phase 5: WVW Methodology 2-Week Training ────────────────────────────────
  // Week 1: Fundamentals
  { sortOrder: 15, category: "TRAINING", title: "WVW Day 1 — Mission, Values & Culture Immersion",
    description: "Full-day orientation: WVW's founding story, core values, service lines, client philosophy, and team culture. Includes leadership Q&A session.",
    blockedBySortOrder: 14 },

  { sortOrder: 16, category: "TRAINING", title: "WVW Day 2 — HR Consulting Methodology Overview",
    description: "WVW's 5-phase HR consulting model: Discovery, Assessment, Findings, Remediation, Monitoring. Review 3 anonymized client case studies.",
    blockedBySortOrder: 15 },

  { sortOrder: 17, category: "TRAINING", title: "WVW Day 3 — Audit Execution & Compliance Framework",
    description: "End-to-end audit process: scoping, fieldwork, evidence collection, checklist execution. Deep dive into EEOC, FLSA, ADA, FMLA requirements.",
    blockedBySortOrder: 16 },

  { sortOrder: 18, category: "TRAINING", title: "WVW Day 4 — DEI, Wellness & Organizational Health Frameworks",
    description: "WVW's DEI audit lens, organizational wellness scoring, neurodivergence accommodation standards, and psychological safety assessment methods.",
    blockedBySortOrder: 17 },

  { sortOrder: 19, category: "TRAINING", title: "WVW Day 5 — Client Engagement, Communication & Ethics Standards",
    description: "Client relationship protocols, professional communication standards, escalation paths, conflict-of-interest policy, and WVW code of ethics.",
    blockedBySortOrder: 18,
    documentRequired: true, documentLabel: "Signed WVW Code of Ethics acknowledgement" },

  // Week 2: Applied Practice
  { sortOrder: 20, category: "TRAINING", title: "WVW Day 6 — WVW Intelligence Platform Deep Training",
    description: "Full platform walkthrough: clients, audits, findings, evidence, invoicing, AI command center, reporting, and workflows. Complete hands-on exercises.",
    blockedBySortOrder: 19 },

  { sortOrder: 21, category: "TRAINING", title: "WVW Day 7 — Live Audit Shadowing (Fieldwork)",
    description: "Observe a senior consultant conducting live or simulated fieldwork. Take notes and debrief. Document key observations.",
    blockedBySortOrder: 20 },

  { sortOrder: 22, category: "TRAINING", title: "WVW Day 8 — Findings Documentation & Report Writing",
    description: "Practice drafting findings, risk scores, root cause analysis, and remediation recommendations. Review report templates and WVW writing standards.",
    blockedBySortOrder: 21 },

  { sortOrder: 23, category: "TRAINING", title: "WVW Day 9 — Client Presentation & Delivery Practice",
    description: "Present a findings deck to internal team. Receive structured feedback. Practice handling challenging client questions.",
    blockedBySortOrder: 22 },

  { sortOrder: 24, category: "TRAINING", title: "WVW Day 10 — Methodology Certification & Role Assignment",
    description: "Complete WVW Methodology assessment (passing score 80%). Receive certification. Meet with manager to confirm first client assignment.",
    blockedBySortOrder: 23,
    documentRequired: true, documentLabel: "WVW Methodology Certification (passing score sheet)" },

  // ── Phase 6: Milestones ─────────────────────────────────────────────────────
  { sortOrder: 25, category: "CULTURE",  title: "Intro post in team community",
    description: "Encourage new hire to post a brief intro in the team Announcements space.",
    blockedBySortOrder: 24 },

  { sortOrder: 26, category: "TRAINING", title: "Complete mandatory Academy modules (DEI, Culture, Role-specific)",
    description: "Assign and confirm completion of all mandatory WVW Academy courses within 30 days.",
    blockedBySortOrder: 24 },

  { sortOrder: 27, category: "CULTURE",  title: "30-day check-in: onboarding review",
    description: "Structured 1:1 with manager — review first month, surface blockers, assess cultural fit. Document outcomes.",
    blockedBySortOrder: 26 },

  { sortOrder: 28, category: "HR",       title: "Background check — initiate and review results",
    description: "Initiate background check (if applicable, per role). Review and document results per WVW hiring policy.",
    blockedBySortOrder: 27,
    documentRequired: true, documentLabel: "Background check results / clearance confirmation" },

  { sortOrder: 29, category: "CULTURE",  title: "60-day performance touchpoint",
    description: "Review initial work product, set OKRs for next 30 days. Update employee record with notes.",
    blockedBySortOrder: 27 },

  { sortOrder: 30, category: "CULTURE",  title: "90-day review and role confirmation",
    description: "Formal 90-day review. Confirm role continuation, adjust title/level if needed. Archive onboarding workflow.",
    blockedBySortOrder: 29 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  EMPLOYEE OFFBOARDING
// ─────────────────────────────────────────────────────────────────────────────
export const EMPLOYEE_OFFBOARDING_STEPS: OnboardingStepTemplate[] = [
  { sortOrder: 1,  category: "HR",      title: "Confirm last day and calculate final pay",
    description: "Verify last working day, calculate PTO payout, confirm final paycheck date with payroll.",
    documentRequired: true, documentLabel: "Final pay calculation sheet" },

  { sortOrder: 2,  category: "HR",      title: "Send separation paperwork",
    description: "Provide COBRA notice, final paycheck info, and any severance documentation.",
    blockedBySortOrder: 1,
    documentRequired: true, documentLabel: "Separation agreement / COBRA notice (signed)" },

  { sortOrder: 3,  category: "HR",      title: "Conduct exit interview",
    description: "Schedule 30-minute exit interview. Document feedback and flag any retention insights.",
    blockedBySortOrder: 1,
    documentRequired: true, documentLabel: "Exit interview notes / survey responses" },

  { sortOrder: 4,  category: "GENERAL", title: "Transition all active client accounts",
    description: "Assign all active client engagements, audits, and open tasks to new owner. Notify clients.",
    blockedBySortOrder: 1 },

  { sortOrder: 5,  category: "GENERAL", title: "Close or reassign all open tasks and milestones",
    description: "Review all open tasks. Reassign to active team members or close with documentation.",
    blockedBySortOrder: 4 },

  { sortOrder: 6,  category: "IT",      title: "Transfer files and institutional knowledge",
    description: "Ensure all project files, client contacts, and institutional knowledge are transferred to designated successor.",
    blockedBySortOrder: 4 },

  { sortOrder: 7,  category: "IT",      title: "Revoke all platform and system access",
    description: "Disable WVW Intelligence login, email, Slack, shared drives, and any client portals on last day.",
    blockedBySortOrder: 6 },

  { sortOrder: 8,  category: "IT",      title: "Retrieve all company equipment",
    description: "Arrange return of laptop, badge, and any other company property.",
    blockedBySortOrder: 7,
    documentRequired: true, documentLabel: "Equipment return checklist (signed)" },

  { sortOrder: 9,  category: "IT",      title: "Set email forwarding or auto-reply",
    description: "Set up email forwarding or out-of-office for 30 days post-departure. Notify key clients.",
    blockedBySortOrder: 7 },

  { sortOrder: 10, category: "HR",      title: "Update employee status to TERMINATED",
    description: "Change employment status in workforce tracker. Update org chart.",
    blockedBySortOrder: 8 },

  { sortOrder: 11, category: "HR",      title: "Remove from org chart and active payroll",
    description: "Update reporting structure. Remove from active payroll after final pay.",
    blockedBySortOrder: 10 },

  { sortOrder: 12, category: "CULTURE", title: "Post farewell announcement",
    description: "Post in team Announcements. Celebrate contributions.",
    blockedBySortOrder: 10 },

  { sortOrder: 13, category: "CULTURE", title: "Send farewell gift or card",
    description: "Coordinate team card or farewell gesture in alignment with WVW culture values.",
    blockedBySortOrder: 12 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  CLIENT ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────
export const CLIENT_ONBOARDING_STEPS: OnboardingStepTemplate[] = [
  { sortOrder: 1,  category: "LEGAL",   title: "Execute master services agreement (MSA)",
    description: "Send MSA, collect signatures from all required parties. No consulting work begins until signed.",
    documentRequired: true, documentLabel: "Signed MSA" },

  { sortOrder: 2,  category: "LEGAL",   title: "Execute NDA / confidentiality agreement",
    description: "Confirm NDA is signed by all relevant parties and stored in client Documents.",
    blockedBySortOrder: 1,
    documentRequired: true, documentLabel: "Signed NDA" },

  { sortOrder: 3,  category: "LEGAL",   title: "Collect certificate of insurance / liability docs",
    description: "Request client's COI if applicable per scope. Store in client Documents.",
    blockedBySortOrder: 2,
    documentRequired: true, documentLabel: "Certificate of insurance (if required)" },

  { sortOrder: 4,  category: "GENERAL", title: "Create full client record in WVW Intelligence",
    description: "Complete company profile: industry, size, EIN, billing info, primary contact, website, health score baseline.",
    blockedBySortOrder: 3 },

  { sortOrder: 5,  category: "GENERAL", title: "Collect key contacts and organizational chart",
    description: "Gather names, roles, and contact info for HR lead, legal, finance, and any stakeholders involved in the engagement.",
    blockedBySortOrder: 4,
    documentRequired: true, documentLabel: "Key contacts list / org chart" },

  { sortOrder: 6,  category: "GENERAL", title: "Assign account owner and consulting team",
    description: "Set the lead consultant and any supporting team members on the client record.",
    blockedBySortOrder: 5 },

  { sortOrder: 7,  category: "GENERAL", title: "Set up billing and invoicing",
    description: "Configure billing email, payment terms, and default rate. Create first invoice if retainer applies.",
    blockedBySortOrder: 6,
    documentRequired: true, documentLabel: "Billing authorization / W-9 (if required)" },

  { sortOrder: 8,  category: "GENERAL", title: "Send welcome email and client portal access",
    description: "Send client welcome email with portal link and assigned consultant's contact info.",
    blockedBySortOrder: 7 },

  { sortOrder: 9,  category: "GENERAL", title: "Conduct kickoff meeting",
    description: "60-minute kickoff: scope, timeline, deliverables, key contacts, communication cadence. Record and distribute notes.",
    blockedBySortOrder: 8,
    documentRequired: true, documentLabel: "Signed kickoff meeting notes / scope confirmation" },

  { sortOrder: 10, category: "GENERAL", title: "Collect intake questionnaire / organizational needs assessment",
    description: "Send WVW intake form: goals, pain points, compliance gaps, workforce size, current HR policies.",
    blockedBySortOrder: 9,
    documentRequired: true, documentLabel: "Completed intake questionnaire" },

  { sortOrder: 11, category: "GENERAL", title: "Collect existing HR policies and employee handbook",
    description: "Request current employee handbook, job descriptions, compensation structure, and any existing compliance documentation.",
    blockedBySortOrder: 10,
    documentRequired: true, documentLabel: "Existing HR policy documents / handbook" },

  { sortOrder: 12, category: "GENERAL", title: "Schedule and launch initial audit or assessment",
    description: "Book first formal audit or gap assessment. Create audit record in WVW Intelligence and assign checklist.",
    blockedBySortOrder: 11 },

  { sortOrder: 13, category: "GENERAL", title: "Establish communication and reporting cadence",
    description: "Agree on meeting frequency, preferred channels, and reporting format. Add standing meetings to shared calendar.",
    blockedBySortOrder: 12 },

  { sortOrder: 14, category: "GENERAL", title: "30-day relationship check-in",
    description: "Review early engagement satisfaction, address any friction, and confirm scope alignment.",
    blockedBySortOrder: 13 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  STUDENT ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────
export const STUDENT_ONBOARDING_STEPS: OnboardingStepTemplate[] = [
  { sortOrder: 1,  category: "GENERAL", title: "Confirm enrollment and collect registration information",
    description: "Verify full name, email, employer (if applicable), and payment status.",
    documentRequired: true, documentLabel: "Completed registration form" },

  { sortOrder: 2,  category: "LEGAL",   title: "Collect signed program agreement / terms",
    description: "Obtain signed acknowledgement of program expectations, refund policy, and code of conduct.",
    blockedBySortOrder: 1,
    documentRequired: true, documentLabel: "Signed program agreement" },

  { sortOrder: 3,  category: "HR",      title: "Verify identity and collect photo ID",
    description: "Government-issued photo ID required for credentialed programs.",
    blockedBySortOrder: 2,
    documentRequired: true, documentLabel: "Photo ID (scanned copy)" },

  { sortOrder: 4,  category: "HR",      title: "Collect emergency contact information",
    description: "Name, relationship, and phone number for in-person programs.",
    blockedBySortOrder: 2,
    documentRequired: true, documentLabel: "Emergency contact form" },

  { sortOrder: 5,  category: "HR",      title: "Confirm payment and collect receipt",
    description: "Verify payment received. Issue payment confirmation.",
    blockedBySortOrder: 2,
    documentRequired: true, documentLabel: "Payment confirmation / receipt" },

  { sortOrder: 6,  category: "IT",      title: "Grant Academy / LMS access",
    description: "Create learner account and enroll in assigned cohort courses.",
    blockedBySortOrder: 5 },

  { sortOrder: 7,  category: "GENERAL", title: "Send welcome packet and orientation materials",
    description: "Send welcome packet: schedule, facilitator contacts, platform guide, and first assignment.",
    blockedBySortOrder: 6 },

  { sortOrder: 8,  category: "TRAINING", title: "Complete Academy platform orientation module",
    description: "Student completes the Academy orientation module before accessing course content.",
    blockedBySortOrder: 7 },

  { sortOrder: 9,  category: "CULTURE", title: "Assign cohort buddy or peer learning group",
    description: "Pair student with a peer for accountability and community.",
    blockedBySortOrder: 8 },

  { sortOrder: 10, category: "GENERAL", title: "30-day progress check-in",
    description: "Review course progress, engagement, and any barriers to completion.",
    blockedBySortOrder: 9 },

  { sortOrder: 11, category: "TRAINING", title: "Mid-program assessment",
    description: "Administer mid-program quiz or practical assessment.",
    blockedBySortOrder: 10 },

  { sortOrder: 12, category: "TRAINING", title: "Final assessment / capstone submission",
    description: "Student submits final project or completes final exam.",
    blockedBySortOrder: 11,
    documentRequired: true, documentLabel: "Final assessment / capstone submission" },

  { sortOrder: 13, category: "GENERAL", title: "Issue WVW credential / certificate of completion",
    description: "Generate and deliver WVW issued credential upon passing final assessment.",
    blockedBySortOrder: 12,
    documentRequired: true, documentLabel: "Issued credential record" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  INSTRUCTOR / TRAINER ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────
export const INSTRUCTOR_ONBOARDING_STEPS: OnboardingStepTemplate[] = [
  { sortOrder: 1,  category: "LEGAL",   title: "Execute instructor / trainer services agreement",
    description: "Send, collect signatures on, and file the instructor services agreement before any engagement begins.",
    documentRequired: true, documentLabel: "Signed instructor services agreement" },

  { sortOrder: 2,  category: "LEGAL",   title: "Sign NDA / confidentiality agreement",
    description: "Covers all WVW proprietary methodology, client data, and curriculum.",
    blockedBySortOrder: 1,
    documentRequired: true, documentLabel: "Signed NDA" },

  { sortOrder: 3,  category: "HR",      title: "Collect credentials, certifications, and bio",
    description: "Resume, teaching certifications, subject-matter expertise documentation, and professional bio for program materials.",
    blockedBySortOrder: 2,
    documentRequired: true, documentLabel: "CV/resume, certifications, and instructor bio" },

  { sortOrder: 4,  category: "HR",      title: "Collect W-9 or international payment documentation",
    description: "Required for compensation processing. Store securely in instructor record.",
    blockedBySortOrder: 2,
    documentRequired: true, documentLabel: "W-9 or equivalent payment form" },

  { sortOrder: 5,  category: "HR",      title: "Background check (if required by program)",
    description: "Initiate background check per WVW credentialing program requirements.",
    blockedBySortOrder: 3,
    documentRequired: true, documentLabel: "Background check clearance" },

  { sortOrder: 6,  category: "IT",      title: "Grant WVW Intelligence and Academy platform access",
    description: "Create instructor account with INSTRUCTOR role. Confirm access to assigned courses and cohorts.",
    blockedBySortOrder: 4 },

  { sortOrder: 7,  category: "TRAINING", title: "WVW Methodology orientation for instructors",
    description: "Review WVW's core consulting and training methodology. Instructors must understand WVW's frameworks to ensure curriculum alignment.",
    blockedBySortOrder: 6,
    documentRequired: true, documentLabel: "Signed WVW Methodology alignment acknowledgement" },

  { sortOrder: 8,  category: "GENERAL", title: "Collect and review course materials / curriculum submission",
    description: "Instructor submits slides, exercises, assessments, and reading list for WVW curriculum review.",
    blockedBySortOrder: 7,
    documentRequired: true, documentLabel: "Course materials package (slides, exercises, assessments)" },

  { sortOrder: 9,  category: "GENERAL", title: "Curriculum review and approval",
    description: "WVW academic team reviews submitted materials. Provide feedback and approve for delivery.",
    blockedBySortOrder: 8,
    documentRequired: true, documentLabel: "Curriculum approval sign-off" },

  { sortOrder: 10, category: "CULTURE", title: "Instructor welcome and team introduction",
    description: "Introduce instructor to relevant team members. Post welcome in team community.",
    blockedBySortOrder: 9 },

  { sortOrder: 11, category: "GENERAL", title: "Assign first cohort or course delivery",
    description: "Confirm schedule, cohort roster, and delivery format. Add to shared calendar.",
    blockedBySortOrder: 10 },

  { sortOrder: 12, category: "GENERAL", title: "Post-first-delivery debrief",
    description: "Review learner feedback, co-facilitate debrief with WVW lead. Confirm ongoing engagement terms.",
    blockedBySortOrder: 11 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ROLE CHANGE (no blocking — all tasks run concurrently)
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_CHANGE_STEPS: OnboardingStepTemplate[] = [
  { sortOrder: 1, category: "HR",      title: "Update role in HR system and org chart",
    description: "Update title, department, level, and reporting structure in WVW Intelligence." },
  { sortOrder: 2, category: "IT",      title: "Adjust system access and permissions",
    description: "Review and update platform role, tool access, and shared folder permissions." },
  { sortOrder: 3, category: "CULTURE", title: "Brief team on new responsibilities",
    description: "Post announcement in community. Schedule intro with any new direct reports." },
  { sortOrder: 4, category: "TRAINING",title: "Assign role-specific training modules",
    description: "Enroll in any Academy courses required for the new role." },
  { sortOrder: 5, category: "CULTURE", title: "30-day check-in on new role performance",
    description: "Structured conversation with manager reviewing transition, challenges, and early wins." },
];

// Backwards-compatible alias
export const NEW_HIRE_STEPS = EMPLOYEE_ONBOARDING_STEPS;
