import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding WVW Intelligence Platform...\n");

  // ── Organization ────────────────────────────────────────────────────────────
  const org = await db.organization.upsert({
    where: { slug: "wvw" },
    update: {},
    create: {
      name: "Wholistic Vibes Wellness",
      slug: "wvw",
      industry: "Consulting / Wellness",
      timezone: "America/New_York",
      currency: "USD",
      settings: { features: { academy: true, employeeExperience: true, riskIntelligence: true } },
    },
  });
  console.log(`✓ Organization: ${org.name}`);

  // ── Compliance Frameworks ────────────────────────────────────────────────────
  const fwData = [
    { name: "SOC 2 Type II", type: "SOC2" as const, version: "2017" },
    { name: "ISO 27001",     type: "ISO27001" as const, version: "2022" },
    { name: "HIPAA",         type: "HIPAA" as const, version: "2013" },
    { name: "NIST CSF",      type: "NIST" as const, version: "1.1" },
  ];
  const fws: Record<string, string> = {};
  for (const fw of fwData) {
    const f = await db.complianceFramework.upsert({
      where: { id: `${org.id}-${fw.type}` },
      update: {},
      create: { id: `${org.id}-${fw.type}`, orgId: org.id, name: fw.name, type: fw.type, version: fw.version, isActive: true },
    });
    fws[fw.type] = f.id;
  }
  console.log(`✓ ${fwData.length} compliance frameworks`);

  // ── Clients ──────────────────────────────────────────────────────────────────
  const clientsData = [
    { name: "Meridian Financial Group",   industry: "Finance",       isActive: true,  healthScore: 82, onboarded: true },
    { name: "Apex Healthcare Partners",   industry: "Healthcare",    isActive: true,  healthScore: 71, onboarded: true },
    { name: "Summit Logistics Corp",      industry: "Logistics",     isActive: true,  healthScore: 91, onboarded: true },
    { name: "Nova Tech Solutions",        industry: "Technology",    isActive: true,  healthScore: 65, onboarded: true },
    { name: "Cornerstone Capital Mgmt",   industry: "Finance",       isActive: false, healthScore: null, onboarded: false },
    { name: "Brightview Education Trust", industry: "Education",     isActive: true,  healthScore: 78, onboarded: true },
    { name: "Pacific Realty Group",       industry: "Real Estate",   isActive: false, healthScore: null, onboarded: false },
    { name: "Atlas Manufacturing Co",     industry: "Manufacturing", isActive: true,  healthScore: 88, onboarded: true },
  ];

  const clients: Record<string, string> = {};
  for (const c of clientsData) {
    const cl = await db.client.upsert({
      where: { id: `seed-${c.name.replace(/\s+/g, "-").toLowerCase()}` },
      update: {},
      create: {
        id: `seed-${c.name.replace(/\s+/g, "-").toLowerCase()}`,
        orgId: org.id,
        name: c.name,
        industry: c.industry,
        isActive: c.isActive,
        healthScore: c.healthScore,
        onboardedAt: c.onboarded ? new Date("2024-01-15") : null,
        paymentTerms: 30,
        defaultRate: 250,
      },
    });
    clients[c.name] = cl.id;
    // Add a primary contact
    await db.contact.upsert({
      where: { id: `seed-contact-${cl.id}` },
      update: {},
      create: {
        id: `seed-contact-${cl.id}`,
        clientId: cl.id,
        firstName: ["James", "Sarah", "Michael", "Emily", "David", "Lisa", "Robert", "Jennifer"][clientsData.indexOf(c) % 8]!,
        lastName: ["Wilson", "Chen", "Thompson", "Rodriguez", "Park", "Martinez", "Johnson", "Lee"][clientsData.indexOf(c) % 8]!,
        email: `contact@${c.name.replace(/\s+/g, "").toLowerCase()}.com`,
        title: "Chief Financial Officer",
        isPrimary: true,
        isDecisionMaker: true,
      },
    });
  }
  console.log(`✓ ${clientsData.length} clients`);

  // ── Get or create the seeded user ───────────────────────────────────────────
  let seedUser = await db.user.findFirst({ where: { orgId: org.id } });
  if (!seedUser) {
    console.log("  ⚠ No user found — run the app and sign in first, then re-run seed");
    await db.$disconnect();
    return;
  }
  console.log(`✓ Using user: ${seedUser.firstName} ${seedUser.lastName}`);

  // Update user to SUPER_ADMIN with proper details
  seedUser = await db.user.update({
    where: { id: seedUser.id },
    data: {
      role: "SUPER_ADMIN",
      title: "Managing Partner",
      department: "Leadership",
      billableRate: 350,
    },
  });

  // ── Additional team members ─────────────────────────────────────────────────
  const teamData = [
    { firstName: "Marcus",   lastName: "Webb",      role: "PARTNER" as const,     title: "Senior Partner",         dept: "Leadership",  rate: 300 },
    { firstName: "Aisha",    lastName: "Patel",     role: "MANAGER" as const,     title: "Audit Manager",          dept: "Audit",       rate: 200 },
    { firstName: "Tyler",    lastName: "Nguyen",    role: "CONSULTANT" as const,  title: "Senior Auditor",         dept: "Audit",       rate: 175 },
    { firstName: "Priya",    lastName: "Sharma",    role: "CONSULTANT" as const,  title: "HR Compliance Auditor",  dept: "HR",          rate: 160 },
    { firstName: "Devon",    lastName: "Brooks",    role: "AUDITOR" as const,     title: "IT Security Auditor",    dept: "IT",          rate: 165 },
    { firstName: "Camille",  lastName: "Laurent",   role: "CONSULTANT" as const,  title: "Financial Analyst",      dept: "Finance",     rate: 170 },
    { firstName: "Jordan",   lastName: "Hayes",     role: "ADMIN" as const,       title: "Operations Director",    dept: "Operations",  rate: 225 },
  ];

  const teamMembers: string[] = [seedUser.id];
  for (const t of teamData) {
    const existing = await db.user.findFirst({ where: { orgId: org.id, firstName: t.firstName, lastName: t.lastName } });
    if (!existing) {
      const m = await db.user.create({
        data: {
          orgId: org.id,
          clerkUserId: `seed-clerk-${t.firstName.toLowerCase()}-${t.lastName.toLowerCase()}`,
          email: `${t.firstName.toLowerCase()}.${t.lastName.toLowerCase()}@wvwconsulting.com`,
          firstName: t.firstName,
          lastName: t.lastName,
          role: t.role,
          title: t.title,
          department: t.dept,
          billableRate: t.rate,
          status: "ACTIVE",
        },
      });
      teamMembers.push(m.id);
    } else {
      teamMembers.push(existing.id);
    }
  }
  console.log(`✓ ${teamData.length + 1} team members`);

  // ── Projects ────────────────────────────────────────────────────────────────
  const projectsData = [
    { clientName: "Meridian Financial Group",   name: "Q1 2026 SOC 2 Type II Audit",     type: "AUDIT" as const,      status: "ACTIVE" as const,    budget: 85000 },
    { clientName: "Apex Healthcare Partners",   name: "HIPAA Compliance Program",        type: "AUDIT" as const,      status: "ACTIVE" as const,    budget: 62000 },
    { clientName: "Summit Logistics Corp",      name: "Operational Risk Assessment",      type: "ASSESSMENT" as const, status: "COMPLETED" as const, budget: 38000 },
    { clientName: "Nova Tech Solutions",        name: "IT Security Framework Build",      type: "CONSULTING" as const, status: "ACTIVE" as const,    budget: 120000 },
    { clientName: "Brightview Education Trust", name: "Annual Governance Review 2025",    type: "AUDIT" as const,      status: "COMPLETED" as const, budget: 28000 },
    { clientName: "Atlas Manufacturing Co",     name: "ISO 27001 Readiness Assessment",  type: "ASSESSMENT" as const, status: "ACTIVE" as const,    budget: 45000 },
  ];

  const projects: Record<string, string> = {};
  for (const p of projectsData) {
    const cid = clients[p.clientName];
    if (!cid) continue;
    const proj = await db.project.upsert({
      where: { id: `seed-proj-${p.name.replace(/\s+/g, "-").toLowerCase().slice(0, 30)}` },
      update: {},
      create: {
        id: `seed-proj-${p.name.replace(/\s+/g, "-").toLowerCase().slice(0, 30)}`,
        orgId: org.id,
        clientId: cid,
        name: p.name,
        type: p.type,
        status: p.status,
        budget: p.budget,
        startDate: new Date("2025-01-01"),
        targetEndDate: new Date("2026-06-30"),
        members: { create: { userId: seedUser.id, role: "lead" } },
      },
    });
    projects[p.name] = proj.id;
  }
  console.log(`✓ ${projectsData.length} projects`);

  // ── Audits ───────────────────────────────────────────────────────────────────
  const auditsData = [
    {
      clientName: "Meridian Financial Group",
      name: "SOC 2 Type II — Q1 2026",
      code: "AUD-2026-001",
      type: "COMPLIANCE" as const,
      status: "FIELDWORK" as const,
      scope: "Trust services criteria covering Security, Availability, and Confidentiality for the cloud-hosted financial platform.",
      risk: 72,
      fieldworkStart: new Date("2026-02-01"),
      fieldworkEnd: new Date("2026-03-31"),
      reportDue: new Date("2026-04-30"),
    },
    {
      clientName: "Apex Healthcare Partners",
      name: "HIPAA Security Rule Audit",
      code: "AUD-2026-002",
      type: "COMPLIANCE" as const,
      status: "REVIEW" as const,
      scope: "Administrative, physical, and technical safeguards for electronic protected health information (ePHI) across all covered entities.",
      risk: 81,
      fieldworkStart: new Date("2026-01-10"),
      fieldworkEnd: new Date("2026-02-28"),
      reportDue: new Date("2026-03-31"),
    },
    {
      clientName: "Summit Logistics Corp",
      name: "Operational Risk Assessment 2025",
      code: "AUD-2025-008",
      type: "OPERATIONAL" as const,
      status: "COMPLETED" as const,
      scope: "End-to-end supply chain risk assessment covering vendor management, logistics controls, and business continuity.",
      risk: 44,
      fieldworkStart: new Date("2025-10-01"),
      fieldworkEnd: new Date("2025-11-15"),
      reportDue: new Date("2025-12-01"),
    },
    {
      clientName: "Nova Tech Solutions",
      name: "IT Security & Infrastructure Audit",
      code: "AUD-2026-003",
      type: "IT" as const,
      status: "PLANNING" as const,
      scope: "Network security, access controls, patch management, and incident response procedures.",
      risk: null,
      fieldworkStart: new Date("2026-05-01"),
      fieldworkEnd: new Date("2026-06-15"),
      reportDue: new Date("2026-07-01"),
    },
    {
      clientName: "Brightview Education Trust",
      name: "Annual Governance & Compliance Review",
      code: "AUD-2025-007",
      type: "COMPLIANCE" as const,
      status: "REPORTING" as const,
      scope: "Board governance practices, regulatory compliance, and financial controls for the 2025 fiscal year.",
      risk: 58,
      fieldworkStart: new Date("2025-11-01"),
      fieldworkEnd: new Date("2025-12-31"),
      reportDue: new Date("2026-01-31"),
    },
    {
      clientName: "Atlas Manufacturing Co",
      name: "ISO 27001 Gap Assessment",
      code: "AUD-2026-004",
      type: "IT" as const,
      status: "PLANNING" as const,
      scope: "Information security management system gap analysis against ISO 27001:2022 requirements.",
      risk: null,
      fieldworkStart: new Date("2026-06-01"),
      fieldworkEnd: new Date("2026-07-15"),
      reportDue: new Date("2026-08-01"),
    },
    {
      clientName: "Meridian Financial Group",
      name: "HR Compliance Audit — Hiring Practices",
      code: "AUD-2026-005",
      type: "HR" as const,
      status: "FIELDWORK" as const,
      scope: "Recruiting, onboarding, performance management, compensation equity, and offboarding procedures.",
      risk: 63,
      fieldworkStart: new Date("2026-03-01"),
      fieldworkEnd: new Date("2026-04-15"),
      reportDue: new Date("2026-05-15"),
    },
    {
      clientName: "Apex Healthcare Partners",
      name: "Financial Controls Review Q2 2025",
      code: "AUD-2025-005",
      type: "FINANCIAL" as const,
      status: "COMPLETED" as const,
      scope: "Revenue cycle management, accounts payable controls, and financial reporting accuracy.",
      risk: 38,
      fieldworkStart: new Date("2025-07-01"),
      fieldworkEnd: new Date("2025-08-15"),
      reportDue: new Date("2025-09-01"),
    },
  ];

  const auditIds: string[] = [];
  for (const a of auditsData) {
    const cid = clients[a.clientName];
    if (!cid) continue;
    const audit = await db.audit.upsert({
      where: { id: `seed-audit-${a.code}` },
      update: {},
      create: {
        id: `seed-audit-${a.code}`,
        orgId: org.id,
        clientId: cid,
        name: a.name,
        code: a.code,
        type: a.type,
        status: a.status,
        scope: a.scope,
        overallRiskScore: a.risk,
        fieldworkStartDate: a.fieldworkStart,
        fieldworkEndDate: a.fieldworkEnd,
        reportDueDate: a.reportDue,
        members: { create: { userId: seedUser.id, role: "lead" } },
      },
    });
    auditIds.push(audit.id);
  }
  console.log(`✓ ${auditsData.length} audits`);

  // ── Findings ─────────────────────────────────────────────────────────────────
  const findingsData = [
    // SOC 2 audit findings
    { auditId: "seed-audit-AUD-2026-001", findingNumber: "F-001", title: "Multi-Factor Authentication Not Enforced for Admin Accounts", description: "Administrative accounts with privileged access to production systems do not require multi-factor authentication. This creates significant risk of unauthorized access through credential compromise.", severity: "CRITICAL" as const, status: "OPEN" as const, category: "Access Control", likelihood: "high", riskScore: 92, rootCause: "MFA policy exists but was not applied to legacy admin accounts during system migration in Q3 2024.", recommendation: "Enable MFA immediately for all administrative accounts. Implement a policy requiring MFA for any account with elevated privileges.", dueDate: new Date("2026-03-15") },
    { auditId: "seed-audit-AUD-2026-001", findingNumber: "F-002", title: "User Access Reviews Not Conducted Quarterly", description: "The organization's security policy requires quarterly user access reviews, but reviews have only been performed annually for the past 18 months.", severity: "HIGH" as const, status: "IN_PROGRESS" as const, category: "Access Control", likelihood: "medium", riskScore: 74, rootCause: "Lack of automated tooling and ownership of the review process.", recommendation: "Implement automated access review workflow using existing IAM tools. Assign a dedicated owner for access governance.", dueDate: new Date("2026-04-01") },
    { auditId: "seed-audit-AUD-2026-001", findingNumber: "F-003", title: "Encryption at Rest Not Enabled for Backup Storage", description: "Database backup files stored in secondary storage are not encrypted at rest, exposing sensitive customer financial data.", severity: "HIGH" as const, status: "OPEN" as const, category: "Data Protection", likelihood: "medium", riskScore: 68, rootCause: "Backup configuration was not updated when encryption policy was revised in 2023.", recommendation: "Enable AES-256 encryption for all backup storage immediately. Verify encryption status monthly.", dueDate: new Date("2026-03-20") },
    { auditId: "seed-audit-AUD-2026-001", findingNumber: "F-004", title: "Incident Response Plan Not Tested in 18 Months", description: "The formal incident response plan has not been exercised through a tabletop or live drill since October 2024, exceeding the policy requirement of annual testing.", severity: "MEDIUM" as const, status: "OPEN" as const, category: "Incident Response", likelihood: "low", riskScore: 52, recommendation: "Schedule and conduct a tabletop exercise within 60 days. Update the IRP based on findings.", dueDate: new Date("2026-05-01") },
    // HIPAA audit findings
    { auditId: "seed-audit-AUD-2026-002", findingNumber: "F-001", title: "Business Associate Agreements Missing for 3 Vendors", description: "Three third-party vendors with access to ePHI do not have executed Business Associate Agreements in place, violating HIPAA requirements.", severity: "CRITICAL" as const, status: "IN_PROGRESS" as const, category: "Vendor Management", likelihood: "high", riskScore: 88, recommendation: "Execute BAAs with all three vendors immediately. Implement a BAA tracking process.", dueDate: new Date("2026-02-15") },
    { auditId: "seed-audit-AUD-2026-002", findingNumber: "F-002", title: "Workforce HIPAA Training Completion at 67%", description: "Only 67% of workforce members have completed mandatory annual HIPAA training. Policy requires 100% completion.", severity: "HIGH" as const, status: "OPEN" as const, category: "Training & Awareness", likelihood: "medium", riskScore: 71, recommendation: "Complete training campaign within 30 days. Automate annual training reminders.", dueDate: new Date("2026-03-01") },
    { auditId: "seed-audit-AUD-2026-002", findingNumber: "F-003", title: "Audit Logs Not Retained for Required 6-Year Period", description: "System audit logs are retained for 90 days rather than the HIPAA required 6 years.", severity: "HIGH" as const, status: "REMEDIATED" as const, category: "Audit Logging", likelihood: "low", riskScore: 65, recommendation: "Configure log archival to comply with 6-year retention requirement.", dueDate: new Date("2026-01-31") },
    // Summit completed audit findings
    { auditId: "seed-audit-AUD-2025-008", findingNumber: "F-001", title: "Single Source Vendor Dependency for Critical Components", description: "Key logistics components are sourced from a single vendor with no alternate supplier agreement.", severity: "HIGH" as const, status: "REMEDIATED" as const, category: "Vendor Management", likelihood: "medium", riskScore: 62, recommendation: "Establish secondary vendor relationships for all critical components.", dueDate: new Date("2026-01-01") },
    { auditId: "seed-audit-AUD-2025-008", findingNumber: "F-002", title: "Business Continuity Plan Lacks Logistics-Specific Recovery Procedures", description: "The BCP does not include specific procedures for logistics disruptions.", severity: "MEDIUM" as const, status: "CLOSED" as const, category: "Business Continuity", likelihood: "low", riskScore: 44, recommendation: "Update BCP with logistics-specific scenarios and recovery time objectives.", dueDate: new Date("2025-12-15") },
    // Brightview reporting audit
    { auditId: "seed-audit-AUD-2025-007", findingNumber: "F-001", title: "Board Meeting Minutes Not Consistently Distributed Within Policy Timeframe", description: "Board meeting minutes are required to be distributed within 5 business days. Review found 4 of 8 meetings exceeded this timeframe.", severity: "LOW" as const, status: "OPEN" as const, category: "Governance", likelihood: "low", riskScore: 28, recommendation: "Implement automated distribution workflow for board materials.", dueDate: new Date("2026-02-28") },
    { auditId: "seed-audit-AUD-2025-007", findingNumber: "F-002", title: "Conflicts of Interest Policy Not Reviewed Since 2022", description: "The conflicts of interest policy was last reviewed 3 years ago and does not reflect current regulatory guidance.", severity: "MEDIUM" as const, status: "IN_PROGRESS" as const, category: "Governance", likelihood: "medium", riskScore: 48, recommendation: "Update COI policy and require annual sign-off from all board members.", dueDate: new Date("2026-03-15") },
    // HR audit
    { auditId: "seed-audit-AUD-2026-005", findingNumber: "F-001", title: "Pay Equity Analysis Has Not Been Conducted", description: "No formal pay equity analysis has been performed. Compensation disparities may exist across protected class groups.", severity: "HIGH" as const, status: "OPEN" as const, category: "Compensation", likelihood: "medium", riskScore: 76, recommendation: "Commission a third-party pay equity study and implement remediation plan.", dueDate: new Date("2026-06-01") },
    { auditId: "seed-audit-AUD-2026-005", findingNumber: "F-002", title: "I-9 Documentation Errors Found in 12% of Employee Files", description: "Sample review found I-9 form errors in 12% of reviewed files, including missing signatures and expired documents.", severity: "MEDIUM" as const, status: "IN_PROGRESS" as const, category: "Regulatory Compliance", likelihood: "medium", riskScore: 55, recommendation: "Conduct full I-9 audit and remediate all errors. Implement I-9 management software.", dueDate: new Date("2026-04-30") },
  ];

  let findingCount = 0;
  for (const f of findingsData) {
    const findingId = `seed-finding-${f.auditId}-${f.findingNumber}`;
    await db.auditFinding.upsert({
      where: { id: findingId },
      update: {},
      create: {
        id: findingId,
        auditId: f.auditId,
        findingNumber: f.findingNumber,
        title: f.title,
        description: f.description,
        severity: f.severity,
        status: f.status,
        category: f.category,
        likelihood: f.likelihood,
        riskScore: f.riskScore,
        rootCause: (f as { rootCause?: string }).rootCause,
        recommendation: f.recommendation,
        dueDate: f.dueDate,
      },
    });
    findingCount++;
  }
  console.log(`✓ ${findingCount} findings`);

  // ── Invoices ────────────────────────────────────────────────────────────────
  const invoicesData = [
    { clientName: "Meridian Financial Group",   amount: 42500, status: "PAID" as const,      issueDate: new Date("2025-10-01") },
    { clientName: "Meridian Financial Group",   amount: 42500, status: "SENT" as const,       issueDate: new Date("2026-01-15") },
    { clientName: "Apex Healthcare Partners",   amount: 31000, status: "PAID" as const,       issueDate: new Date("2025-09-01") },
    { clientName: "Apex Healthcare Partners",   amount: 31000, status: "OVERDUE" as const,    issueDate: new Date("2025-12-15") },
    { clientName: "Summit Logistics Corp",      amount: 38000, status: "PAID" as const,       issueDate: new Date("2025-12-01") },
    { clientName: "Brightview Education Trust", amount: 28000, status: "PAID" as const,       issueDate: new Date("2025-08-01") },
    { clientName: "Atlas Manufacturing Co",     amount: 22500, status: "DRAFT" as const,      issueDate: new Date("2026-03-01") },
    { clientName: "Nova Tech Solutions",        amount: 60000, status: "PAID" as const,       issueDate: new Date("2025-11-01") },
  ];

  let invoiceCount = 0;
  for (const inv of invoicesData) {
    const cid = clients[inv.clientName];
    if (!cid) continue;
    const dueDate = new Date(inv.issueDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const invId = `seed-inv-${inv.clientName.slice(0, 10)}-${inv.issueDate.toISOString().slice(0, 7)}-${inv.status}`.replace(/\s+/g, "-");
    await db.invoice.upsert({
      where: { id: invId },
      update: {},
      create: {
        id: invId,
        orgId: org.id,
        clientId: cid,
        createdById: seedUser.id,
        invoiceNumber: `INV-${String(++invoiceCount).padStart(4, "0")}`,
        status: inv.status,
        issueDate: inv.issueDate,
        dueDate,
        total: inv.amount,
        subtotal: inv.amount,
        taxAmount: 0,
        discountAmount: 0,
        currency: "USD",
        lineItems: {
          create: [{ description: "Professional Services — Audit & Consulting", quantity: 1, unitPrice: inv.amount, amount: inv.amount }],
        },
      },
    });
  }
  console.log(`✓ ${invoiceCount} invoices`);

  // ── Notifications ────────────────────────────────────────────────────────────
  const notifData = [
    { title: "Critical Finding Opened", message: "MFA not enforced for admin accounts in SOC 2 audit for Meridian Financial", type: "WARNING" as const, actionUrl: `/audits/seed-audit-AUD-2026-001` },
    { title: "Invoice Overdue",         message: "INV-0004 for Apex Healthcare Partners is 14 days past due ($31,000)", type: "ACTION_REQUIRED" as const, actionUrl: `/invoices` },
    { title: "Audit Report Ready",      message: "Operational Risk Assessment for Summit Logistics is ready for export", type: "SUCCESS" as const, actionUrl: `/reports` },
    { title: "New Audit Assigned",      message: "You have been assigned as lead on ISO 27001 Gap Assessment for Atlas Manufacturing", type: "INFO" as const, actionUrl: `/audits/seed-audit-AUD-2026-004` },
  ];

  for (const n of notifData) {
    await db.notification.create({
      data: { userId: seedUser.id, title: n.title, message: n.message, type: n.type, actionUrl: n.actionUrl },
    });
  }
  console.log(`✓ ${notifData.length} notifications`);

  // ── Time Entries ────────────────────────────────────────────────────────────
  const projectId = Object.values(projects)[0];
  if (projectId) {
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      await db.timeEntry.create({
        data: {
          orgId: org.id,
          userId: seedUser.id,
          projectId,
          date: d,
          hours: 6 + Math.random() * 3,
          description: ["Client interview", "Document review", "Fieldwork testing", "Report drafting", "Evidence collection", "Risk analysis"][i % 6]!,
          status: i > 2 ? "APPROVED" : "SUBMITTED",
          isBillable: true,
          billableRate: 350,
        },
      });
    }
    console.log("✓ 12 time entries");
  }

  console.log("\n✅ Seed complete! WVW Intelligence is fully populated.");
  console.log(`\n📊 Summary:`);
  console.log(`   ${clientsData.length} clients · ${auditsData.length} audits · ${findingCount} findings · ${invoiceCount} invoices`);
  console.log(`   ${teamData.length + 1} team members · 4 notifications · 12 time entries`);
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
