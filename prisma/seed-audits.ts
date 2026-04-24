/**
 * Extends seed data with a full audit library:
 * - Client Discovery / Fit Assessment for every client
 * - Industry-specific compliance and operational audits
 * - Various lifecycle stages (PLANNING → COMPLETED)
 * Run: npx tsx prisma/seed-audits.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🔍 Adding extended audit library...\n");

  const org = await db.organization.findFirst({ where: { slug: "wvw" } });
  if (!org) throw new Error("Run prisma/seed.ts first");

  const lead = await db.user.findFirst({
    where: { orgId: org.id, role: { in: ["SUPER_ADMIN", "ADMIN", "PARTNER"] } },
    orderBy: { createdAt: "asc" },
  });
  if (!lead) throw new Error("No lead user found");

  const users = await db.user.findMany({
    where: { orgId: org.id, deletedAt: null },
    select: { id: true, role: true },
  });

  // Helper to pick a secondary team member
  const secondary = users.find((u) => u.id !== lead.id && u.role === "MANAGER") ?? users[1];
  const auditor   = users.find((u) => u.role === "AUDITOR") ?? users[2];

  const clients = await db.client.findMany({
    where: { orgId: org.id },
    select: { id: true, name: true, industry: true, isActive: true },
  });

  const clientMap = Object.fromEntries(clients.map((c) => [c.name, c]));

  // ── Audit Templates ──────────────────────────────────────────────────────────
  const templateDefs = [
    {
      id: "tpl-client-discovery",
      name: "Client Discovery & Fit Assessment",
      type: "COMPLIANCE" as const,
      description: "Pre-engagement assessment to evaluate client readiness, risk appetite, and strategic fit for WVW services.",
      sections: [
        { title: "Business Overview", items: ["Describe your core business model and primary revenue streams.", "What is your employee headcount and geographic footprint?", "Who are your primary regulators or oversight bodies?"] },
        { title: "Compliance Posture", items: ["What compliance frameworks are you currently subject to?", "When was your last external audit or assessment?", "Do you have a dedicated compliance or risk function?"] },
        { title: "Risk & Readiness", items: ["What are your top 3 operational risks?", "Do you have a formal risk management program?", "Rate your current documentation maturity (1–5).", "Do you have executive buy-in for compliance initiatives?"] },
        { title: "Engagement Fit", items: ["What specific outcomes do you hope to achieve from this engagement?", "What is your anticipated budget range?", "What is your preferred engagement timeline?"] },
      ],
    },
    {
      id: "tpl-onboarding-baseline",
      name: "Onboarding Baseline Assessment",
      type: "OPERATIONAL" as const,
      description: "Comprehensive baseline assessment conducted at the start of every new client engagement to establish current-state benchmarks.",
      sections: [
        { title: "Organizational Controls", items: ["Map all key business processes and control owners.", "Review organizational chart and reporting lines.", "Identify all key policies in place and their review dates."] },
        { title: "Documentation Review", items: ["Collect and catalog all existing policies and procedures.", "Review board minutes and governance documentation.", "Assess document management practices and version control."] },
        { title: "Technology Environment", items: ["Inventory all key systems and data repositories.", "Review access control and identity management practices.", "Assess change management and patch management processes."] },
        { title: "HR & People", items: ["Review hiring, onboarding, and offboarding procedures.", "Assess training and awareness programs.", "Evaluate performance management and compensation practices."] },
      ],
    },
    {
      id: "tpl-soc2-readiness",
      name: "SOC 2 Type II Readiness",
      type: "COMPLIANCE" as const,
      description: "Full Trust Services Criteria assessment covering Security, Availability, Confidentiality, Processing Integrity, and Privacy.",
      sections: [
        { title: "CC1 – Control Environment", items: ["Board and management oversight of internal controls.", "Organizational structure and assignment of authority.", "Commitment to competence and HR policies."] },
        { title: "CC6 – Logical Access", items: ["User access provisioning and deprovisioning process.", "Multi-factor authentication enforcement.", "Privileged access management and review.", "Remote access controls."] },
        { title: "CC7 – System Operations", items: ["Monitoring of system performance and availability.", "Incident detection and response procedures.", "Backup and recovery testing results."] },
        { title: "CC8 – Change Management", items: ["Change authorization and approval process.", "Testing requirements before production deployment.", "Emergency change procedures."] },
      ],
    },
    {
      id: "tpl-hipaa-security",
      name: "HIPAA Security Rule Assessment",
      type: "COMPLIANCE" as const,
      description: "Assessment of administrative, physical, and technical safeguards required under 45 CFR Part 164.",
      sections: [
        { title: "Administrative Safeguards", items: ["Security management process and risk analysis.", "Assigned security responsibility.", "Workforce training and access authorization.", "Contingency plan and disaster recovery."] },
        { title: "Physical Safeguards", items: ["Facility access controls and visitor logs.", "Workstation use and security policies.", "Device and media controls including disposal."] },
        { title: "Technical Safeguards", items: ["Access control and unique user identification.", "Automatic logoff and encryption/decryption.", "Audit controls and integrity controls.", "Transmission security."] },
      ],
    },
    {
      id: "tpl-hr-compliance",
      name: "HR Compliance Audit",
      type: "HR" as const,
      description: "Comprehensive review of hiring practices, employment law compliance, compensation equity, and HR operations.",
      sections: [
        { title: "Hiring & Onboarding", items: ["Job posting review for EEOC compliance.", "I-9 verification and documentation review.", "Background check policies and consistency.", "Offer letter and employment agreement review."] },
        { title: "Compensation & Benefits", items: ["Pay equity analysis by role, gender, and race.", "FLSA exempt/non-exempt classification review.", "Benefits enrollment and ERISA compliance.", "401(k) administration and non-discrimination testing."] },
        { title: "Employee Relations", items: ["Anti-harassment and discrimination policies.", "Performance management documentation.", "Disciplinary process and documentation standards.", "Termination procedures and separation agreements."] },
      ],
    },
    {
      id: "tpl-it-security",
      name: "IT Security & Infrastructure Audit",
      type: "IT" as const,
      description: "Assessment of cybersecurity controls, infrastructure resilience, and technology governance.",
      sections: [
        { title: "Network Security", items: ["Firewall configuration and rule review.", "Network segmentation and DMZ design.", "Intrusion detection and prevention systems.", "VPN and remote access security."] },
        { title: "Endpoint Security", items: ["Antivirus/EDR deployment and coverage.", "Patch management currency and exception handling.", "Mobile device management (MDM) policy.", "USB and removable media controls."] },
        { title: "Identity & Access", items: ["Password policy enforcement.", "Multi-factor authentication rollout.", "Privileged access management (PAM) controls.", "Service account inventory and governance."] },
        { title: "Incident Response", items: ["IR plan existence and annual testing.", "Security event logging and SIEM coverage.", "Breach notification procedure.", "Forensic preservation capability."] },
      ],
    },
    {
      id: "tpl-financial-controls",
      name: "Financial Controls Review",
      type: "FINANCIAL" as const,
      description: "Assessment of internal controls over financial reporting, accounts payable/receivable, and financial close processes.",
      sections: [
        { title: "Revenue Recognition", items: ["Revenue recognition policy compliance with ASC 606.", "Customer contract review and variable consideration.", "Cutoff procedures and period-end entries."] },
        { title: "Expenditure Cycle", items: ["Purchase authorization limits and approval hierarchy.", "Vendor onboarding and conflict of interest controls.", "Accounts payable three-way match process.", "Expense reimbursement policy compliance."] },
        { title: "Financial Reporting", items: ["Month-end close checklist and timeline.", "Reconciliation completeness and timeliness.", "Journal entry authorization and review.", "Management override controls."] },
      ],
    },
    {
      id: "tpl-governance",
      name: "Governance & Board Effectiveness Review",
      type: "COMPLIANCE" as const,
      description: "Assessment of board governance practices, committee structure, and fiduciary responsibilities.",
      sections: [
        { title: "Board Structure", items: ["Director independence and qualification review.", "Committee composition and charter review.", "Board meeting attendance and quorum compliance.", "Director conflict of interest disclosures."] },
        { title: "Oversight & Accountability", items: ["Strategic plan alignment with board oversight.", "CEO/executive performance evaluation process.", "Risk appetite statement and board risk oversight.", "Succession planning for key roles."] },
        { title: "Compliance & Ethics", items: ["Code of conduct and ethics policy.", "Whistleblower protection and hotline effectiveness.", "Related party transaction review.", "Regulatory filing timeliness."] },
      ],
    },
  ];

  for (const tpl of templateDefs) {
    const t = await db.auditTemplate.upsert({
      where: { id: tpl.id },
      update: {},
      create: {
        id: tpl.id,
        orgId: org.id,
        name: tpl.name,
        description: tpl.description,
        type: tpl.type,
        isPublished: true,
        sections: {
          create: tpl.sections.map((s, si) => ({
            title: s.title,
            sortOrder: si,
            items: {
              create: s.items.map((q, qi) => ({
                question: q,
                sortOrder: qi,
                isRequired: true,
                evidenceRequired: qi === 0,
              })),
            },
          })),
        },
      },
    });
    console.log(`  ✓ Template: ${t.name}`);
  }

  // ── Additional Audits ────────────────────────────────────────────────────────
  type AuditStatus = "PLANNING" | "FIELDWORK" | "REVIEW" | "REPORTING" | "COMPLETED" | "DRAFT";
  type AuditType   = "COMPLIANCE" | "HR" | "OPERATIONAL" | "IT" | "FINANCIAL" | "RISK" | "INTERNAL" | "CUSTOM";

  interface AuditDef {
    id: string;
    clientName: string;
    name: string;
    code: string;
    type: AuditType;
    status: AuditStatus;
    scope: string;
    riskScore: number | null;
    fieldworkStart: Date | null;
    fieldworkEnd: Date | null;
    reportDue: Date | null;
    templateId?: string;
    findings?: Array<{
      findingNumber: string;
      title: string;
      description: string;
      severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
      status: "OPEN" | "IN_PROGRESS" | "REMEDIATED" | "CLOSED" | "ACCEPTED_RISK";
      category: string;
      likelihood: string;
      riskScore: number;
      recommendation: string;
      dueDate: Date | null;
    }>;
  }

  const newAudits: AuditDef[] = [
    // ── CLIENT DISCOVERY ASSESSMENTS (every client) ──────────────────────────
    {
      id: "seed-audit-disc-meridian",
      clientName: "Meridian Financial Group",
      name: "Client Discovery & Fit Assessment",
      code: "DISC-2024-001",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Pre-engagement evaluation of compliance maturity, risk posture, and strategic alignment for WVW advisory services.",
      riskScore: 68,
      fieldworkStart: new Date("2024-09-05"),
      fieldworkEnd: new Date("2024-09-12"),
      reportDue: new Date("2024-09-20"),
      templateId: "tpl-client-discovery",
    },
    {
      id: "seed-audit-disc-apex",
      clientName: "Apex Healthcare Partners",
      name: "Client Discovery & Fit Assessment",
      code: "DISC-2024-002",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Pre-engagement evaluation of HIPAA readiness, operational controls, and engagement scope definition.",
      riskScore: 74,
      fieldworkStart: new Date("2024-07-10"),
      fieldworkEnd: new Date("2024-07-18"),
      reportDue: new Date("2024-07-25"),
      templateId: "tpl-client-discovery",
    },
    {
      id: "seed-audit-disc-summit",
      clientName: "Summit Logistics Corp",
      name: "Client Discovery & Fit Assessment",
      code: "DISC-2024-003",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Pre-engagement evaluation of operational risk exposure, supply chain controls, and audit readiness.",
      riskScore: 52,
      fieldworkStart: new Date("2024-08-01"),
      fieldworkEnd: new Date("2024-08-08"),
      reportDue: new Date("2024-08-15"),
      templateId: "tpl-client-discovery",
    },
    {
      id: "seed-audit-disc-nova",
      clientName: "Nova Tech Solutions",
      name: "Client Discovery & Fit Assessment",
      code: "DISC-2024-004",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Pre-engagement evaluation of cybersecurity posture, compliance gaps, and readiness for SOC 2 certification.",
      riskScore: 81,
      fieldworkStart: new Date("2024-10-03"),
      fieldworkEnd: new Date("2024-10-11"),
      reportDue: new Date("2024-10-18"),
      templateId: "tpl-client-discovery",
    },
    {
      id: "seed-audit-disc-cornerstone",
      clientName: "Cornerstone Capital Mgmt",
      name: "Client Discovery & Fit Assessment",
      code: "DISC-2024-005",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Pre-engagement evaluation — client was assessed but engagement not pursued due to budget constraints.",
      riskScore: 58,
      fieldworkStart: new Date("2024-11-04"),
      fieldworkEnd: new Date("2024-11-08"),
      reportDue: new Date("2024-11-15"),
      templateId: "tpl-client-discovery",
    },
    {
      id: "seed-audit-disc-brightview",
      clientName: "Brightview Education Trust",
      name: "Client Discovery & Fit Assessment",
      code: "DISC-2024-006",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Pre-engagement evaluation of nonprofit governance, FERPA compliance posture, and board oversight effectiveness.",
      riskScore: 63,
      fieldworkStart: new Date("2024-05-06"),
      fieldworkEnd: new Date("2024-05-14"),
      reportDue: new Date("2024-05-22"),
      templateId: "tpl-client-discovery",
    },
    {
      id: "seed-audit-disc-pacific",
      clientName: "Pacific Realty Group",
      name: "Client Discovery & Fit Assessment",
      code: "DISC-2024-007",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Pre-engagement evaluation — client assessed but engagement paused pending internal restructuring.",
      riskScore: 44,
      fieldworkStart: new Date("2024-06-10"),
      fieldworkEnd: new Date("2024-06-14"),
      reportDue: new Date("2024-06-20"),
      templateId: "tpl-client-discovery",
    },
    {
      id: "seed-audit-disc-atlas",
      clientName: "Atlas Manufacturing Co",
      name: "Client Discovery & Fit Assessment",
      code: "DISC-2024-008",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Pre-engagement evaluation of ISO 27001 readiness, manufacturing controls, and OT/IT security posture.",
      riskScore: 61,
      fieldworkStart: new Date("2024-12-02"),
      fieldworkEnd: new Date("2024-12-09"),
      reportDue: new Date("2024-12-16"),
      templateId: "tpl-client-discovery",
    },

    // ── ONBOARDING BASELINES ─────────────────────────────────────────────────
    {
      id: "seed-audit-baseline-meridian",
      clientName: "Meridian Financial Group",
      name: "Onboarding Baseline Assessment",
      code: "BASE-2024-001",
      type: "OPERATIONAL",
      status: "COMPLETED",
      scope: "Current-state baseline across all controls, policies, technology systems, and HR practices for Meridian Financial Group.",
      riskScore: 71,
      fieldworkStart: new Date("2024-10-01"),
      fieldworkEnd: new Date("2024-10-22"),
      reportDue: new Date("2024-11-01"),
      templateId: "tpl-onboarding-baseline",
    },
    {
      id: "seed-audit-baseline-apex",
      clientName: "Apex Healthcare Partners",
      name: "Onboarding Baseline Assessment",
      code: "BASE-2024-002",
      type: "OPERATIONAL",
      status: "COMPLETED",
      scope: "Current-state baseline covering clinical operations, ePHI handling, and administrative safeguards for Apex Healthcare Partners.",
      riskScore: 78,
      fieldworkStart: new Date("2024-08-15"),
      fieldworkEnd: new Date("2024-09-05"),
      reportDue: new Date("2024-09-15"),
      templateId: "tpl-onboarding-baseline",
    },
    {
      id: "seed-audit-baseline-summit",
      clientName: "Summit Logistics Corp",
      name: "Onboarding Baseline Assessment",
      code: "BASE-2024-003",
      type: "OPERATIONAL",
      status: "COMPLETED",
      scope: "Baseline assessment of supply chain controls, vendor management, and business continuity for Summit Logistics Corp.",
      riskScore: 49,
      fieldworkStart: new Date("2024-09-02"),
      fieldworkEnd: new Date("2024-09-20"),
      reportDue: new Date("2024-09-30"),
      templateId: "tpl-onboarding-baseline",
    },
    {
      id: "seed-audit-baseline-nova",
      clientName: "Nova Tech Solutions",
      name: "Onboarding Baseline Assessment",
      code: "BASE-2024-004",
      type: "OPERATIONAL",
      status: "COMPLETED",
      scope: "Baseline assessment of software development lifecycle, cloud infrastructure controls, and data governance for Nova Tech Solutions.",
      riskScore: 83,
      fieldworkStart: new Date("2024-11-01"),
      fieldworkEnd: new Date("2024-11-22"),
      reportDue: new Date("2024-12-01"),
      templateId: "tpl-onboarding-baseline",
    },
    {
      id: "seed-audit-baseline-brightview",
      clientName: "Brightview Education Trust",
      name: "Onboarding Baseline Assessment",
      code: "BASE-2024-005",
      type: "OPERATIONAL",
      status: "COMPLETED",
      scope: "Baseline assessment of educational data governance, FERPA compliance, and board oversight for Brightview Education Trust.",
      riskScore: 66,
      fieldworkStart: new Date("2024-06-03"),
      fieldworkEnd: new Date("2024-06-21"),
      reportDue: new Date("2024-07-01"),
      templateId: "tpl-onboarding-baseline",
    },
    {
      id: "seed-audit-baseline-atlas",
      clientName: "Atlas Manufacturing Co",
      name: "Onboarding Baseline Assessment",
      code: "BASE-2025-001",
      type: "OPERATIONAL",
      status: "COMPLETED",
      scope: "Baseline assessment of OT/IT convergence, manufacturing process controls, and supply chain risk for Atlas Manufacturing Co.",
      riskScore: 59,
      fieldworkStart: new Date("2025-01-06"),
      fieldworkEnd: new Date("2025-01-24"),
      reportDue: new Date("2025-02-03"),
      templateId: "tpl-onboarding-baseline",
    },

    // ── MERIDIAN FINANCIAL ───────────────────────────────────────────────────
    {
      id: "seed-audit-meridian-pci",
      clientName: "Meridian Financial Group",
      name: "PCI DSS Level 1 Compliance Assessment",
      code: "AUD-2025-011",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Cardholder data environment scope assessment, network segmentation review, and SAQ-D control validation across all payment processing systems.",
      riskScore: 55,
      fieldworkStart: new Date("2025-03-01"),
      fieldworkEnd: new Date("2025-04-15"),
      reportDue: new Date("2025-05-01"),
      findings: [
        { findingNumber: "F-001", title: "Cardholder Data Stored Beyond Payment Authorization", description: "Full PANs retained in transaction logs for 18 months; PCI DSS requires truncation or tokenization.", severity: "CRITICAL", status: "REMEDIATED", category: "Data Protection", likelihood: "medium", riskScore: 89, recommendation: "Implement tokenization for all stored PANs and purge historical unencrypted records.", dueDate: new Date("2025-03-15") },
        { findingNumber: "F-002", title: "Default Credentials on Network Switch", description: "Two network switches in the CDE still used vendor default credentials.", severity: "HIGH", status: "REMEDIATED", category: "Access Control", likelihood: "high", riskScore: 77, recommendation: "Change all default credentials immediately. Implement credential management policy.", dueDate: new Date("2025-03-10") },
      ],
    },
    {
      id: "seed-audit-meridian-q2review",
      clientName: "Meridian Financial Group",
      name: "Q2 2025 Quarterly Compliance Check-In",
      code: "QTR-2025-002",
      type: "INTERNAL",
      status: "COMPLETED",
      scope: "Quarterly review of remediation progress, control effectiveness, and emerging risks for Meridian Financial Group.",
      riskScore: 48,
      fieldworkStart: new Date("2025-06-15"),
      fieldworkEnd: new Date("2025-06-22"),
      reportDue: new Date("2025-06-30"),
    },
    {
      id: "seed-audit-meridian-q3review",
      clientName: "Meridian Financial Group",
      name: "Q3 2025 Quarterly Compliance Check-In",
      code: "QTR-2025-003",
      type: "INTERNAL",
      status: "COMPLETED",
      scope: "Quarterly progress review focusing on SOC 2 readiness milestones and open findings remediation.",
      riskScore: 41,
      fieldworkStart: new Date("2025-09-15"),
      fieldworkEnd: new Date("2025-09-22"),
      reportDue: new Date("2025-09-30"),
    },
    {
      id: "seed-audit-meridian-vendor",
      clientName: "Meridian Financial Group",
      name: "Third-Party Vendor Risk Assessment",
      code: "AUD-2025-013",
      type: "RISK",
      status: "REVIEW",
      scope: "Risk assessment of top 15 critical vendors including cloud providers, payment processors, and data analytics partners.",
      riskScore: 67,
      fieldworkStart: new Date("2026-02-15"),
      fieldworkEnd: new Date("2026-03-15"),
      reportDue: new Date("2026-04-01"),
      findings: [
        { findingNumber: "F-001", title: "3 Critical Vendors Lack SOC 2 Reports", description: "Three tier-1 vendors providing access to customer financial data cannot produce current SOC 2 Type II reports.", severity: "HIGH", status: "IN_PROGRESS", category: "Vendor Risk", likelihood: "medium", riskScore: 72, recommendation: "Require SOC 2 reports contractually and evaluate vendor alternatives.", dueDate: new Date("2026-05-01") },
      ],
    },

    // ── APEX HEALTHCARE ──────────────────────────────────────────────────────
    {
      id: "seed-audit-apex-privacy",
      clientName: "Apex Healthcare Partners",
      name: "HIPAA Privacy Rule Compliance Audit",
      code: "AUD-2025-004",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Assessment of Privacy Rule requirements including NPP, minimum necessary standard, patient rights, and business associate management.",
      riskScore: 62,
      fieldworkStart: new Date("2025-04-01"),
      fieldworkEnd: new Date("2025-05-15"),
      reportDue: new Date("2025-06-01"),
      findings: [
        { findingNumber: "F-001", title: "Notice of Privacy Practices Not Posted at All Locations", description: "2 of 6 clinic locations did not have current NPP displayed in reception areas.", severity: "MEDIUM", status: "REMEDIATED", category: "Patient Rights", likelihood: "low", riskScore: 42, recommendation: "Post current NPP at all locations and update patient portal.", dueDate: new Date("2025-04-20") },
        { findingNumber: "F-002", title: "Patient Access Request Response Time Exceeds 30 Days", description: "Average response to patient records requests is 38 days, exceeding the 30-day HIPAA requirement.", severity: "HIGH", status: "CLOSED", category: "Patient Rights", likelihood: "high", riskScore: 68, recommendation: "Implement a request tracking system with automated escalation at day 25.", dueDate: new Date("2025-05-01") },
      ],
    },
    {
      id: "seed-audit-apex-telehealth",
      clientName: "Apex Healthcare Partners",
      name: "Telehealth Platform Security Assessment",
      code: "AUD-2026-007",
      type: "IT",
      status: "PLANNING",
      scope: "Security review of telehealth platform covering authentication, video encryption, session recording controls, and ePHI transmission.",
      riskScore: null,
      fieldworkStart: new Date("2026-06-01"),
      fieldworkEnd: new Date("2026-07-15"),
      reportDue: new Date("2026-08-01"),
    },
    {
      id: "seed-audit-apex-q1review",
      clientName: "Apex Healthcare Partners",
      name: "Q1 2026 Compliance Check-In",
      code: "QTR-2026-001",
      type: "INTERNAL",
      status: "FIELDWORK",
      scope: "Quarterly review of HIPAA remediation progress, BAA status, and training completion rates.",
      riskScore: 58,
      fieldworkStart: new Date("2026-03-15"),
      fieldworkEnd: new Date("2026-03-22"),
      reportDue: new Date("2026-03-31"),
    },

    // ── SUMMIT LOGISTICS ─────────────────────────────────────────────────────
    {
      id: "seed-audit-summit-vendor",
      clientName: "Summit Logistics Corp",
      name: "Vendor & Supply Chain Risk Assessment",
      code: "AUD-2026-008",
      type: "RISK",
      status: "FIELDWORK",
      scope: "End-to-end assessment of vendor selection, contracting, monitoring, and offboarding procedures across 42 active logistics partners.",
      riskScore: 61,
      fieldworkStart: new Date("2026-03-01"),
      fieldworkEnd: new Date("2026-04-15"),
      reportDue: new Date("2026-05-01"),
      findings: [
        { findingNumber: "F-001", title: "No Formal Vendor Tiering or Risk Classification", description: "All 42 vendors are treated uniformly regardless of criticality or data access level.", severity: "HIGH", status: "OPEN", category: "Vendor Management", likelihood: "high", riskScore: 71, recommendation: "Implement a 3-tier vendor risk classification model with differentiated controls.", dueDate: new Date("2026-06-01") },
      ],
    },
    {
      id: "seed-audit-summit-bcp",
      clientName: "Summit Logistics Corp",
      name: "Business Continuity & DR Assessment",
      code: "AUD-2026-009",
      type: "OPERATIONAL",
      status: "PLANNING",
      scope: "Review of business continuity plan, disaster recovery procedures, and tabletop exercise program.",
      riskScore: null,
      fieldworkStart: new Date("2026-07-01"),
      fieldworkEnd: new Date("2026-08-15"),
      reportDue: new Date("2026-09-01"),
    },

    // ── NOVA TECH ────────────────────────────────────────────────────────────
    {
      id: "seed-audit-nova-soc2-r1",
      clientName: "Nova Tech Solutions",
      name: "SOC 2 Type I Readiness Assessment",
      code: "AUD-2025-009",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Point-in-time review of controls designed to meet SOC 2 Security and Availability Trust Services Criteria.",
      riskScore: 73,
      fieldworkStart: new Date("2025-06-01"),
      fieldworkEnd: new Date("2025-07-31"),
      reportDue: new Date("2025-08-15"),
      templateId: "tpl-soc2-readiness",
      findings: [
        { findingNumber: "F-001", title: "No Formal Vendor Risk Management Program", description: "Nova Tech uses 12 sub-processors with access to customer data but has no formal vendor review process.", severity: "HIGH", status: "REMEDIATED", category: "Vendor Risk", likelihood: "medium", riskScore: 69, recommendation: "Establish VRM program with annual reviews, security questionnaires, and contract requirements.", dueDate: new Date("2025-07-01") },
        { findingNumber: "F-002", title: "Vulnerability Scanning Not Performed Regularly", description: "Internal and external vulnerability scans are not performed on a defined schedule.", severity: "HIGH", status: "REMEDIATED", category: "Vulnerability Management", likelihood: "medium", riskScore: 67, recommendation: "Implement weekly internal and monthly external scanning with remediation SLAs.", dueDate: new Date("2025-07-15") },
        { findingNumber: "F-003", title: "Security Awareness Training Completion at 54%", description: "Only 54% of engineers have completed annual security awareness training.", severity: "MEDIUM", status: "REMEDIATED", category: "Training", likelihood: "medium", riskScore: 51, recommendation: "Mandate completion within 60 days and automate annual renewals.", dueDate: new Date("2025-08-01") },
      ],
    },
    {
      id: "seed-audit-nova-privacy",
      clientName: "Nova Tech Solutions",
      name: "Data Privacy & CCPA Compliance Review",
      code: "AUD-2025-010",
      type: "COMPLIANCE",
      status: "REVIEW",
      scope: "Assessment of CCPA/CPRA compliance including data mapping, consumer request handling, and privacy notice requirements.",
      riskScore: 69,
      fieldworkStart: new Date("2026-01-15"),
      fieldworkEnd: new Date("2026-02-28"),
      reportDue: new Date("2026-03-31"),
      findings: [
        { findingNumber: "F-001", title: "Data Inventory Not Complete — 40% of Systems Unmapped", description: "No formal data mapping exists for 40% of production systems, making CCPA compliance verification impossible for those components.", severity: "CRITICAL", status: "IN_PROGRESS", category: "Data Governance", likelihood: "high", riskScore: 85, recommendation: "Complete data inventory within 90 days using automated discovery tooling.", dueDate: new Date("2026-04-30") },
        { findingNumber: "F-002", title: "Consumer Request (DSAR) Process Not Documented", description: "No formal process exists for handling data subject access requests. Current process is ad-hoc.", severity: "HIGH", status: "OPEN", category: "Consumer Rights", likelihood: "medium", riskScore: 70, recommendation: "Document and test a DSAR process with 45-day response target. Assign ownership.", dueDate: new Date("2026-05-01") },
      ],
    },

    // ── BRIGHTVIEW EDUCATION ─────────────────────────────────────────────────
    {
      id: "seed-audit-brightview-ferpa",
      clientName: "Brightview Education Trust",
      name: "FERPA Compliance Audit",
      code: "AUD-2025-006",
      type: "COMPLIANCE",
      status: "COMPLETED",
      scope: "Assessment of FERPA requirements including education records management, disclosure authorizations, and directory information practices.",
      riskScore: 56,
      fieldworkStart: new Date("2025-08-01"),
      fieldworkEnd: new Date("2025-09-15"),
      reportDue: new Date("2025-10-01"),
      findings: [
        { findingNumber: "F-001", title: "Annual FERPA Notification Not Issued in Current Academic Year", description: "Required annual notification to students of their FERPA rights was not issued for the current academic year.", severity: "HIGH", status: "REMEDIATED", category: "Notification & Disclosure", likelihood: "medium", riskScore: 64, recommendation: "Issue FERPA rights notice immediately and establish annual issuance process.", dueDate: new Date("2025-08-31") },
        { findingNumber: "F-002", title: "Directory Information Definition Not Reviewed Since 2019", description: "The school's definition of directory information has not been updated to reflect current data practices.", severity: "MEDIUM", status: "REMEDIATED", category: "Policy", likelihood: "low", riskScore: 41, recommendation: "Update directory information policy and publish in student handbook.", dueDate: new Date("2025-09-15") },
      ],
    },
    {
      id: "seed-audit-brightview-cybersec",
      clientName: "Brightview Education Trust",
      name: "Student Data Security Assessment",
      code: "AUD-2026-006",
      type: "IT",
      status: "PLANNING",
      scope: "Security assessment of student information systems, learning management platforms, and K-12 data protection practices.",
      riskScore: null,
      fieldworkStart: new Date("2026-07-15"),
      fieldworkEnd: new Date("2026-08-30"),
      reportDue: new Date("2026-09-15"),
    },

    // ── ATLAS MANUFACTURING ──────────────────────────────────────────────────
    {
      id: "seed-audit-atlas-osha",
      clientName: "Atlas Manufacturing Co",
      name: "OSHA Safety & Compliance Audit",
      code: "AUD-2025-012",
      type: "OPERATIONAL",
      status: "COMPLETED",
      scope: "Assessment of workplace safety controls, OSHA recordkeeping, hazard communication, and injury prevention programs.",
      riskScore: 53,
      fieldworkStart: new Date("2025-05-01"),
      fieldworkEnd: new Date("2025-06-15"),
      reportDue: new Date("2025-07-01"),
      findings: [
        { findingNumber: "F-001", title: "OSHA 300 Log Not Accurately Maintained", description: "Recordable incidents from Q4 2024 not recorded within the required 7-day window.", severity: "HIGH", status: "REMEDIATED", category: "Recordkeeping", likelihood: "medium", riskScore: 63, recommendation: "Designate a recordkeeping officer and implement a 3-day internal reporting SLA.", dueDate: new Date("2025-05-20") },
        { findingNumber: "F-002", title: "Safety Data Sheets Missing for 8 Chemicals", description: "SDS documents are missing for 8 chemicals in active use on the manufacturing floor.", severity: "HIGH", status: "REMEDIATED", category: "Hazard Communication", likelihood: "medium", riskScore: 66, recommendation: "Obtain and post SDS for all chemicals. Conduct inventory quarterly.", dueDate: new Date("2025-05-15") },
        { findingNumber: "F-003", title: "Emergency Evacuation Plan Not Posted in All Areas", description: "2 of 5 manufacturing zones do not have evacuation plans posted.", severity: "MEDIUM", status: "CLOSED", category: "Emergency Preparedness", likelihood: "low", riskScore: 38, recommendation: "Post evacuation plans in all zones and conduct annual drills.", dueDate: new Date("2025-06-01") },
      ],
    },
    {
      id: "seed-audit-atlas-supply",
      clientName: "Atlas Manufacturing Co",
      name: "Supply Chain Integrity Assessment",
      code: "AUD-2026-010",
      type: "RISK",
      status: "PLANNING",
      scope: "Assessment of materials sourcing controls, counterfeit parts detection, supplier qualification, and customs compliance.",
      riskScore: null,
      fieldworkStart: new Date("2026-08-01"),
      fieldworkEnd: new Date("2026-09-15"),
      reportDue: new Date("2026-10-01"),
    },
    {
      id: "seed-audit-atlas-ops",
      clientName: "Atlas Manufacturing Co",
      name: "Operational Excellence Review",
      code: "AUD-2025-014",
      type: "OPERATIONAL",
      status: "REVIEW",
      scope: "Review of production efficiency controls, quality management system, ISO 9001 alignment, and continuous improvement program.",
      riskScore: 44,
      fieldworkStart: new Date("2026-02-01"),
      fieldworkEnd: new Date("2026-03-15"),
      reportDue: new Date("2026-04-15"),
    },
  ];

  let created = 0;
  let findingsCreated = 0;

  for (const a of newAudits) {
    const client = clientMap[a.clientName];
    if (!client) { console.warn(`  ⚠ Client not found: ${a.clientName}`); continue; }

    const audit = await db.audit.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        orgId: org.id,
        clientId: client.id,
        name: a.name,
        code: a.code,
        type: a.type,
        status: a.status,
        scope: a.scope,
        overallRiskScore: a.riskScore,
        fieldworkStartDate: a.fieldworkStart,
        fieldworkEndDate: a.fieldworkEnd,
        reportDueDate: a.reportDue,
        templateId: a.templateId,
        members: {
          create: [
            { userId: lead.id, role: "lead" },
            ...(secondary && secondary.id !== lead.id ? [{ userId: secondary.id, role: "auditor" }] : []),
            ...(auditor && auditor.id !== lead.id && auditor.id !== secondary?.id ? [{ userId: auditor.id, role: "auditor" }] : []),
          ],
        },
      },
    });
    created++;

    // Add findings if defined
    if (a.findings) {
      for (const f of a.findings) {
        const fid = `${a.id}-${f.findingNumber}`;
        await db.auditFinding.upsert({
          where: { id: fid },
          update: {},
          create: {
            id: fid,
            auditId: audit.id,
            findingNumber: f.findingNumber,
            title: f.title,
            description: f.description,
            severity: f.severity,
            status: f.status,
            category: f.category,
            likelihood: f.likelihood,
            riskScore: f.riskScore,
            recommendation: f.recommendation,
            dueDate: f.dueDate,
          },
        });
        findingsCreated++;
      }
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   ${created} audits added`);
  console.log(`   ${findingsCreated} additional findings added`);
  console.log(`   ${templateDefs.length} audit templates created`);

  const total = await db.audit.count({ where: { orgId: org.id } });
  console.log(`\n📊 Total audits in platform: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
