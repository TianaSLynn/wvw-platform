/**
 * WVW Platform — Global Audit Framework Templates
 * Seeded as isGlobal=true templates available to all orgs.
 */

export type TemplateItem = { question: string; guidance?: string; riskWeight?: number; isRequired?: boolean };
export type TemplateSection = { title: string; description?: string; items: TemplateItem[] };
export type FrameworkTemplate = {
  id: string;              // stable slug-based ID for idempotent seeding
  name: string;
  description: string;
  type: string;
  sections: TemplateSection[];
};

export const FRAMEWORK_TEMPLATES: FrameworkTemplate[] = [
  {
    id: "wvw-tpl-soc2",
    name: "SOC 2 Type II",
    description: "Trust Services Criteria covering security, availability, processing integrity, confidentiality, and privacy.",
    type: "IT_SECURITY",
    sections: [
      {
        title: "CC1 — Control Environment",
        description: "Organizational controls and oversight structures",
        items: [
          { question: "Does the organization demonstrate a commitment to integrity and ethical values?", riskWeight: 1.5, isRequired: true },
          { question: "Is there an effective board of directors or equivalent oversight body?", riskWeight: 1.5 },
          { question: "Is management's philosophy and operating style documented and communicated?", riskWeight: 1.2 },
          { question: "Are organizational structures clearly defined with appropriate authority and responsibility?", riskWeight: 1.2 },
          { question: "Are HR policies in place to ensure competence and accountability?", riskWeight: 1.0 },
        ],
      },
      {
        title: "CC2 — Communication and Information",
        description: "Internal and external communication of quality information",
        items: [
          { question: "Does the organization obtain and use relevant quality information to support the system's functioning?", riskWeight: 1.2 },
          { question: "Is information communicated internally to support the functioning of internal controls?", riskWeight: 1.2 },
          { question: "Is information communicated with external parties as relevant to their needs?", riskWeight: 1.0 },
        ],
      },
      {
        title: "CC3 — Risk Assessment",
        description: "Risk identification, analysis, and management",
        items: [
          { question: "Does the organization clearly define objectives to identify and assess risks?", riskWeight: 1.5, isRequired: true },
          { question: "Is a comprehensive risk assessment process in place to identify relevant risks?", riskWeight: 1.5, isRequired: true },
          { question: "Are fraud risks assessed and considered in achieving objectives?", riskWeight: 2.0, isRequired: true },
          { question: "Are changes to internal or external factors identified and assessed for impact?", riskWeight: 1.2 },
        ],
      },
      {
        title: "CC4 — Monitoring Activities",
        description: "Ongoing and separate monitoring evaluations",
        items: [
          { question: "Does the organization use ongoing and separate evaluations to ascertain whether controls are present and functioning?", riskWeight: 1.3 },
          { question: "Are deficiencies evaluated and communicated to responsible parties on a timely basis?", riskWeight: 1.5, isRequired: true },
        ],
      },
      {
        title: "CC5 — Control Activities",
        description: "Policies and procedures to mitigate risks",
        items: [
          { question: "Are control activities selected and developed to mitigate risks to the achievement of objectives?", riskWeight: 1.4 },
          { question: "Are general technology controls selected and developed to support the achievement of objectives?", riskWeight: 1.4 },
          { question: "Are control activities deployed through policies that establish what is expected?", riskWeight: 1.2 },
          { question: "Are segregation of duties controls documented and enforced?", riskWeight: 2.0, isRequired: true },
        ],
      },
      {
        title: "CC6 — Logical and Physical Access Controls",
        description: "Restricting access to authorized users and systems",
        items: [
          { question: "Are logical access security software, infrastructure, and architectures in place to protect against unauthorized access?", riskWeight: 2.0, isRequired: true },
          { question: "Is multi-factor authentication implemented for critical systems?", riskWeight: 2.0, isRequired: true },
          { question: "Are access privileges granted based on least privilege principles?", riskWeight: 1.8, isRequired: true },
          { question: "Is access reviewed and modified/removed when employment changes occur?", riskWeight: 1.8, isRequired: true },
          { question: "Is physical access to data centers and sensitive areas restricted?", riskWeight: 1.5 },
          { question: "Are encryption controls in place for data at rest and in transit?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "CC7 — System Operations",
        description: "Monitoring and detection of operational activities",
        items: [
          { question: "Is system performance monitored and deviations identified?", riskWeight: 1.2 },
          { question: "Are security events monitored and detected?", riskWeight: 1.8, isRequired: true },
          { question: "Are security incidents responded to according to a documented procedure?", riskWeight: 1.8, isRequired: true },
          { question: "Are business continuity and disaster recovery plans documented and tested?", riskWeight: 1.5, isRequired: true },
          { question: "Are system changes managed through a formal change management process?", riskWeight: 1.5 },
        ],
      },
      {
        title: "CC8 — Change Management",
        description: "Managing changes to systems and infrastructure",
        items: [
          { question: "Is infrastructure, data, software, and procedures managed for changes that support the system?", riskWeight: 1.5 },
          { question: "Are authorized changes tested prior to implementation?", riskWeight: 1.5, isRequired: true },
          { question: "Is there a rollback procedure for failed changes?", riskWeight: 1.2 },
          { question: "Are emergency changes documented and reviewed after implementation?", riskWeight: 1.3 },
        ],
      },
    ],
  },
  {
    id: "wvw-tpl-iso27001",
    name: "ISO 27001",
    description: "International standard for information security management systems.",
    type: "IT_SECURITY",
    sections: [
      {
        title: "A.5 — Information Security Policies",
        items: [
          { question: "Is an information security policy documented, approved by management, and communicated to all employees?", riskWeight: 1.5, isRequired: true },
          { question: "Is the policy reviewed at planned intervals or when significant changes occur?", riskWeight: 1.2 },
        ],
      },
      {
        title: "A.6 — Organization of Information Security",
        items: [
          { question: "Are information security roles and responsibilities defined and allocated?", riskWeight: 1.5 },
          { question: "Are duties and areas of responsibility segregated to reduce opportunities for unauthorized modification?", riskWeight: 1.8, isRequired: true },
          { question: "Are security requirements addressed in agreements with external parties?", riskWeight: 1.5 },
        ],
      },
      {
        title: "A.7 — Human Resource Security",
        items: [
          { question: "Are background verification checks carried out on all candidates for employment?", riskWeight: 1.5, isRequired: true },
          { question: "Do all employees receive appropriate awareness education, training, and updates on policies?", riskWeight: 1.3 },
          { question: "Is there a formal disciplinary process for employees who have committed a security breach?", riskWeight: 1.4 },
          { question: "Are access rights removed on termination and assets returned?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "A.8 — Asset Management",
        items: [
          { question: "Are information assets identified, inventoried, and assigned to owners?", riskWeight: 1.5, isRequired: true },
          { question: "Is an acceptable use policy for information assets defined and implemented?", riskWeight: 1.2 },
          { question: "Are assets classified according to legal requirements, value, criticality, and sensitivity?", riskWeight: 1.3 },
          { question: "Are procedures implemented for secure disposal of media?", riskWeight: 1.5 },
        ],
      },
      {
        title: "A.9 — Access Control",
        items: [
          { question: "Is access control policy documented and reviewed?", riskWeight: 1.5, isRequired: true },
          { question: "Are user access rights provisioned through a formal registration and de-registration process?", riskWeight: 1.8, isRequired: true },
          { question: "Is privileged access managed through a separate, formal process?", riskWeight: 2.0, isRequired: true },
          { question: "Are passwords managed according to a secure password management policy?", riskWeight: 1.5 },
          { question: "Is remote access restricted and secured?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "A.10 — Cryptography",
        items: [
          { question: "Is a policy on the use of cryptographic controls implemented?", riskWeight: 1.5, isRequired: true },
          { question: "Is key management implemented to support cryptographic techniques?", riskWeight: 1.5 },
        ],
      },
      {
        title: "A.11 — Physical and Environmental Security",
        items: [
          { question: "Are security perimeters defined and used to protect sensitive information?", riskWeight: 1.5 },
          { question: "Are physical entry controls in place to restrict access to authorized personnel?", riskWeight: 1.5, isRequired: true },
          { question: "Is equipment protected from physical and environmental threats?", riskWeight: 1.3 },
          { question: "Are clear desk and clear screen policies implemented?", riskWeight: 1.2 },
        ],
      },
      {
        title: "A.12 — Operations Security",
        items: [
          { question: "Are operational procedures documented and made available to users?", riskWeight: 1.2 },
          { question: "Are systems protected against malware through detection, prevention, and recovery controls?", riskWeight: 2.0, isRequired: true },
          { question: "Is information backed up and tested in accordance with a backup policy?", riskWeight: 1.8, isRequired: true },
          { question: "Are audit logs produced, protected, and regularly reviewed?", riskWeight: 1.5, isRequired: true },
        ],
      },
      {
        title: "A.13 — Communications Security",
        items: [
          { question: "Are networks managed and controlled to protect information in systems?", riskWeight: 1.5, isRequired: true },
          { question: "Are security mechanisms, service levels, and requirements documented for network services?", riskWeight: 1.3 },
          { question: "Are information transfer policies and procedures in place?", riskWeight: 1.3 },
        ],
      },
      {
        title: "A.14 — System Acquisition, Development and Maintenance",
        items: [
          { question: "Are security requirements for new information systems or enhancements specified and documented?", riskWeight: 1.4 },
          { question: "Are applications developed with security principles (OWASP, secure coding)?", riskWeight: 1.8, isRequired: true },
          { question: "Are changes to systems controlled through a formal change management process?", riskWeight: 1.5 },
        ],
      },
      {
        title: "A.15 — Supplier Relationships",
        items: [
          { question: "Are information security requirements agreed with each supplier that may access, process, or store information?", riskWeight: 1.5, isRequired: true },
          { question: "Are supplier services regularly monitored, reviewed, and audited?", riskWeight: 1.3 },
        ],
      },
      {
        title: "A.16 — Information Security Incident Management",
        items: [
          { question: "Are responsibilities and procedures for managing information security incidents established?", riskWeight: 1.8, isRequired: true },
          { question: "Is there a process to report and collect information about security events?", riskWeight: 1.5, isRequired: true },
          { question: "Are security incidents classified and prioritized?", riskWeight: 1.5 },
        ],
      },
      {
        title: "A.17 — Business Continuity Management",
        items: [
          { question: "Are continuity of information security requirements documented?", riskWeight: 1.5, isRequired: true },
          { question: "Are business continuity and disaster recovery plans tested and verified?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "A.18 — Compliance",
        items: [
          { question: "Are all relevant legislative, regulatory, and contractual requirements identified and documented?", riskWeight: 1.5, isRequired: true },
          { question: "Are intellectual property rights procedures implemented?", riskWeight: 1.3 },
          { question: "Are information systems regularly reviewed for compliance with security policies and standards?", riskWeight: 1.5 },
        ],
      },
    ],
  },
  {
    id: "wvw-tpl-hipaa",
    name: "HIPAA Compliance",
    description: "Health Insurance Portability and Accountability Act security and privacy rules.",
    type: "COMPLIANCE",
    sections: [
      {
        title: "Administrative Safeguards",
        description: "Policies, procedures, and actions to manage the selection, development, and maintenance of security measures",
        items: [
          { question: "Is a security officer designated and responsible for developing and implementing security policies?", riskWeight: 1.8, isRequired: true },
          { question: "Are workforce members with access to PHI trained on HIPAA privacy and security requirements?", riskWeight: 1.8, isRequired: true },
          { question: "Is access to PHI monitored and reviewed on a regular basis?", riskWeight: 1.8, isRequired: true },
          { question: "Are background checks conducted on employees with access to PHI?", riskWeight: 1.5 },
          { question: "Is a security incident response procedure documented and tested?", riskWeight: 2.0, isRequired: true },
          { question: "Is a contingency/disaster recovery plan in place for PHI systems?", riskWeight: 1.8, isRequired: true },
          { question: "Are Business Associate Agreements (BAAs) in place with all vendors who access PHI?", riskWeight: 2.0, isRequired: true },
        ],
      },
      {
        title: "Physical Safeguards",
        description: "Physical measures, policies, and procedures to protect electronic information systems",
        items: [
          { question: "Are facility access controls in place to limit physical access to systems containing PHI?", riskWeight: 1.5, isRequired: true },
          { question: "Are workstations configured and positioned to minimize unauthorized viewing of PHI?", riskWeight: 1.3 },
          { question: "Is there a policy governing disposal and re-use of electronic media containing PHI?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "Technical Safeguards",
        description: "Technology and related policies to protect PHI",
        items: [
          { question: "Is unique user identification assigned to each authorized user accessing PHI?", riskWeight: 2.0, isRequired: true },
          { question: "Are automatic logoff procedures implemented for sessions accessing PHI?", riskWeight: 1.5 },
          { question: "Is PHI encrypted at rest and in transit?", riskWeight: 2.0, isRequired: true },
          { question: "Are audit controls implemented to record and examine access to PHI?", riskWeight: 1.8, isRequired: true },
          { question: "Is PHI protected from improper alteration or destruction (integrity controls)?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "Privacy Rule Compliance",
        description: "Individual rights and organizational responsibilities for PHI",
        items: [
          { question: "Is a Notice of Privacy Practices (NPP) provided to patients and available on the website?", riskWeight: 1.5, isRequired: true },
          { question: "Are processes in place to honor patient requests to access their PHI?", riskWeight: 1.5, isRequired: true },
          { question: "Are processes in place for patients to request amendments to their PHI?", riskWeight: 1.3 },
          { question: "Is there a process to account for disclosures of PHI?", riskWeight: 1.5 },
        ],
      },
      {
        title: "Breach Notification",
        items: [
          { question: "Is there a documented process to identify and assess potential PHI breaches?", riskWeight: 2.0, isRequired: true },
          { question: "Are breach notification timelines met (patients within 60 days, HHS as required)?", riskWeight: 2.0, isRequired: true },
          { question: "Are breach incidents logged and maintained in a breach log?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "Risk Analysis and Management",
        items: [
          { question: "Has a comprehensive risk analysis been conducted to identify threats and vulnerabilities to PHI?", riskWeight: 2.0, isRequired: true },
          { question: "Are risk management policies implemented to reduce risks to a reasonable level?", riskWeight: 1.8, isRequired: true },
          { question: "Is the risk analysis reviewed and updated regularly (at minimum annually)?", riskWeight: 1.5, isRequired: true },
        ],
      },
    ],
  },
  {
    id: "wvw-tpl-financial",
    name: "Financial Controls",
    description: "Internal financial controls covering revenue, AP/AR, payroll, and reporting.",
    type: "FINANCIAL",
    sections: [
      {
        title: "Revenue Recognition",
        items: [
          { question: "Are revenue recognition policies documented and compliant with applicable accounting standards?", riskWeight: 2.0, isRequired: true },
          { question: "Are contracts reviewed before revenue is recognized?", riskWeight: 1.8, isRequired: true },
          { question: "Is there a review process for complex or unusual revenue transactions?", riskWeight: 1.8 },
          { question: "Are deferred revenue balances reconciled monthly?", riskWeight: 1.5, isRequired: true },
        ],
      },
      {
        title: "Accounts Receivable",
        items: [
          { question: "Are AR balances reconciled to the general ledger monthly?", riskWeight: 1.8, isRequired: true },
          { question: "Are credit terms and credit limits defined and enforced?", riskWeight: 1.5 },
          { question: "Is an allowance for doubtful accounts maintained and reviewed quarterly?", riskWeight: 1.5 },
          { question: "Are collections followed up on overdue accounts with documented procedures?", riskWeight: 1.3 },
        ],
      },
      {
        title: "Accounts Payable",
        items: [
          { question: "Is there a three-way match process (PO, receipt, invoice) for vendor payments?", riskWeight: 1.8, isRequired: true },
          { question: "Are AP balances reconciled to the general ledger monthly?", riskWeight: 1.8, isRequired: true },
          { question: "Are duplicate payment controls in place?", riskWeight: 1.8, isRequired: true },
          { question: "Are vendor master records reviewed for unauthorized changes?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "Payroll Controls",
        items: [
          { question: "Is there segregation of duties between payroll preparation, approval, and disbursement?", riskWeight: 2.0, isRequired: true },
          { question: "Are payroll changes authorized by HR and reviewed before processing?", riskWeight: 1.8, isRequired: true },
          { question: "Are payroll registers reviewed and approved before disbursement?", riskWeight: 1.8, isRequired: true },
          { question: "Are payroll tax filings made accurately and on time?", riskWeight: 1.5, isRequired: true },
        ],
      },
      {
        title: "General Ledger and Financial Close",
        items: [
          { question: "Is the financial close process completed within established timeframes?", riskWeight: 1.5 },
          { question: "Are journal entries reviewed and approved before posting?", riskWeight: 1.8, isRequired: true },
          { question: "Are all balance sheet accounts reconciled at month end?", riskWeight: 1.8, isRequired: true },
          { question: "Is there a management review of financial statements at the conclusion of each close?", riskWeight: 1.5, isRequired: true },
        ],
      },
      {
        title: "Fixed Assets",
        items: [
          { question: "Is there a capitalization policy for fixed assets?", riskWeight: 1.3 },
          { question: "Is a fixed asset register maintained and reconciled to the general ledger?", riskWeight: 1.5, isRequired: true },
          { question: "Are physical inventories of fixed assets performed at least annually?", riskWeight: 1.3 },
        ],
      },
      {
        title: "Cash Management",
        items: [
          { question: "Are bank accounts reconciled monthly with appropriate review?", riskWeight: 1.8, isRequired: true },
          { question: "Is there authorization required for wire transfers and ACH payments above threshold?", riskWeight: 2.0, isRequired: true },
          { question: "Are check signing authorities formally documented and segregated?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "Financial Reporting",
        items: [
          { question: "Are financial reports reviewed by management for completeness and accuracy?", riskWeight: 1.5, isRequired: true },
          { question: "Are significant budget variances investigated and documented?", riskWeight: 1.3 },
          { question: "Are the financial statements reviewed by the board or audit committee?", riskWeight: 1.5 },
        ],
      },
      {
        title: "Fraud Prevention",
        items: [
          { question: "Is there a documented anti-fraud policy communicated to all employees?", riskWeight: 1.8, isRequired: true },
          { question: "Is there an anonymous hotline or reporting mechanism for fraud concerns?", riskWeight: 1.5 },
          { question: "Are expense reports reviewed for reasonableness and policy compliance?", riskWeight: 1.5, isRequired: true },
        ],
      },
      {
        title: "IT Financial Controls",
        items: [
          { question: "Is access to the financial system restricted to authorized users?", riskWeight: 2.0, isRequired: true },
          { question: "Are changes to the financial system managed through a formal change control process?", riskWeight: 1.8 },
          { question: "Is there a documented data backup and recovery procedure for financial systems?", riskWeight: 1.8, isRequired: true },
        ],
      },
    ],
  },
  {
    id: "wvw-tpl-operational",
    name: "Operational Risk",
    description: "Operational risk assessment across people, processes, systems, and external factors.",
    type: "OPERATIONAL",
    sections: [
      {
        title: "Process Documentation and Controls",
        items: [
          { question: "Are critical business processes documented with clear process owners?", riskWeight: 1.5, isRequired: true },
          { question: "Are process controls tested and validated periodically?", riskWeight: 1.5 },
          { question: "Is there an escalation path for process failures or exceptions?", riskWeight: 1.3 },
          { question: "Are processes reviewed for efficiency and effectiveness annually?", riskWeight: 1.2 },
        ],
      },
      {
        title: "People Risk",
        items: [
          { question: "Are key man dependencies identified and mitigation strategies in place?", riskWeight: 1.8, isRequired: true },
          { question: "Are succession plans in place for critical roles?", riskWeight: 1.5 },
          { question: "Is staff turnover tracked and within acceptable ranges?", riskWeight: 1.3 },
          { question: "Are training requirements identified and tracked for all roles?", riskWeight: 1.3 },
        ],
      },
      {
        title: "Technology and Systems Risk",
        items: [
          { question: "Is a business impact analysis completed for all critical technology systems?", riskWeight: 1.8, isRequired: true },
          { question: "Are system availability SLAs defined and monitored?", riskWeight: 1.5 },
          { question: "Is there a documented IT disaster recovery plan tested at least annually?", riskWeight: 2.0, isRequired: true },
          { question: "Are technology vendor dependencies assessed and managed?", riskWeight: 1.5 },
        ],
      },
      {
        title: "Third-Party and Vendor Risk",
        items: [
          { question: "Is there a formal vendor risk management program?", riskWeight: 1.5, isRequired: true },
          { question: "Are critical vendors reviewed and assessed at least annually?", riskWeight: 1.5, isRequired: true },
          { question: "Are contractual SLAs monitored and enforced?", riskWeight: 1.3 },
          { question: "Are concentration risks in vendor relationships identified?", riskWeight: 1.5 },
        ],
      },
      {
        title: "Business Continuity",
        items: [
          { question: "Is a business continuity plan documented and approved?", riskWeight: 2.0, isRequired: true },
          { question: "Is the business continuity plan tested at least annually?", riskWeight: 1.8, isRequired: true },
          { question: "Are recovery time objectives (RTO) and recovery point objectives (RPO) defined?", riskWeight: 1.8, isRequired: true },
          { question: "Are alternate work site arrangements documented?", riskWeight: 1.3 },
        ],
      },
      {
        title: "Regulatory and Legal Compliance",
        items: [
          { question: "Are regulatory requirements applicable to the business identified and tracked?", riskWeight: 1.8, isRequired: true },
          { question: "Is a regulatory change monitoring process in place?", riskWeight: 1.5 },
          { question: "Are licenses, permits, and registrations maintained and current?", riskWeight: 1.5, isRequired: true },
        ],
      },
      {
        title: "Reporting and Escalation",
        items: [
          { question: "Is operational risk reporting provided to management on a regular basis?", riskWeight: 1.3 },
          { question: "Are operational risk incidents logged and root cause analyzed?", riskWeight: 1.5, isRequired: true },
          { question: "Is there a KRI (Key Risk Indicator) framework to provide early warning of emerging risks?", riskWeight: 1.5 },
        ],
      },
    ],
  },
  {
    id: "wvw-tpl-hr",
    name: "HR Policy Audit",
    description: "Human resources policy compliance including hiring, performance, and termination.",
    type: "HR",
    sections: [
      {
        title: "Recruitment and Hiring",
        items: [
          { question: "Are job descriptions documented and approved before posting positions?", riskWeight: 1.3 },
          { question: "Are background check policies consistently applied to all new hires?", riskWeight: 1.8, isRequired: true },
          { question: "Are offers of employment made in writing with clear terms?", riskWeight: 1.5, isRequired: true },
          { question: "Is there a documented onboarding process for new employees?", riskWeight: 1.3 },
          { question: "Are I-9 employment eligibility verifications completed within required timeframes?", riskWeight: 2.0, isRequired: true },
        ],
      },
      {
        title: "Compensation and Benefits",
        items: [
          { question: "Is there a documented compensation philosophy and pay structure?", riskWeight: 1.5 },
          { question: "Are compensation reviews conducted at least annually?", riskWeight: 1.3 },
          { question: "Is pay equity reviewed and documented?", riskWeight: 1.8, isRequired: true },
          { question: "Are benefit plans administered in compliance with applicable laws (ERISA, ACA, COBRA)?", riskWeight: 2.0, isRequired: true },
        ],
      },
      {
        title: "Performance Management",
        items: [
          { question: "Are performance review processes documented and consistently applied?", riskWeight: 1.3 },
          { question: "Are performance improvement plans (PIPs) documented and followed?", riskWeight: 1.5 },
          { question: "Are managers trained on performance management best practices?", riskWeight: 1.2 },
        ],
      },
      {
        title: "Policy Compliance",
        items: [
          { question: "Is the employee handbook reviewed and updated at least annually?", riskWeight: 1.5, isRequired: true },
          { question: "Are employees required to acknowledge key HR policies?", riskWeight: 1.5, isRequired: true },
          { question: "Is there a documented anti-harassment and anti-discrimination policy?", riskWeight: 2.0, isRequired: true },
          { question: "Is there a complaint/grievance process documented and communicated?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "Termination and Offboarding",
        items: [
          { question: "Is there a documented offboarding process including system access revocation?", riskWeight: 1.8, isRequired: true },
          { question: "Are final paychecks and benefits handled in compliance with state law?", riskWeight: 2.0, isRequired: true },
          { question: "Are exit interviews conducted and results analyzed?", riskWeight: 1.2 },
          { question: "Are personnel files retained according to the document retention policy?", riskWeight: 1.5 },
        ],
      },
    ],
  },
  {
    id: "wvw-tpl-vendor",
    name: "Vendor Due Diligence",
    description: "Third-party vendor risk assessment and due diligence procedures.",
    type: "COMPLIANCE",
    sections: [
      {
        title: "Vendor Selection and Onboarding",
        items: [
          { question: "Is there a documented vendor selection and approval process?", riskWeight: 1.5, isRequired: true },
          { question: "Is due diligence performed on prospective vendors before engagement?", riskWeight: 1.8, isRequired: true },
          { question: "Are vendor risk tiers defined and applied during onboarding?", riskWeight: 1.5 },
          { question: "Are contracts reviewed by legal before execution with critical vendors?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "Financial Stability and Business Viability",
        items: [
          { question: "Are financial statements or creditworthiness assessments obtained for critical vendors?", riskWeight: 1.5, isRequired: true },
          { question: "Are key financial health indicators of critical vendors monitored?", riskWeight: 1.3 },
          { question: "Are concentration risks (reliance on a single vendor) identified and mitigated?", riskWeight: 1.5 },
        ],
      },
      {
        title: "Security and Compliance",
        items: [
          { question: "Are vendors assessed for information security controls (SOC 2, ISO 27001, etc.)?", riskWeight: 2.0, isRequired: true },
          { question: "Are vendors required to maintain adequate cyber insurance?", riskWeight: 1.5 },
          { question: "Are data processing agreements (DPAs) in place with vendors handling personal data?", riskWeight: 2.0, isRequired: true },
          { question: "Are vendors regularly assessed for compliance with regulatory requirements?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "Contract and SLA Management",
        items: [
          { question: "Are service level agreements (SLAs) defined and measurable?", riskWeight: 1.5, isRequired: true },
          { question: "Are SLA performance metrics tracked and reported?", riskWeight: 1.3 },
          { question: "Is there a process for handling SLA breaches and escalation?", riskWeight: 1.3 },
          { question: "Are contract renewal dates tracked with advance notification?", riskWeight: 1.2 },
        ],
      },
      {
        title: "Ongoing Monitoring",
        items: [
          { question: "Are critical vendors reviewed at least annually?", riskWeight: 1.8, isRequired: true },
          { question: "Are vendor security incidents reported and tracked?", riskWeight: 1.8, isRequired: true },
          { question: "Are fourth-party risks (vendors of vendors) assessed for critical relationships?", riskWeight: 1.3 },
        ],
      },
      {
        title: "Vendor Offboarding",
        items: [
          { question: "Is there a documented vendor termination procedure?", riskWeight: 1.3 },
          { question: "Is data returned or destroyed upon vendor termination?", riskWeight: 1.8, isRequired: true },
          { question: "Are all access credentials and integrations revoked upon termination?", riskWeight: 1.8, isRequired: true },
        ],
      },
    ],
  },
  {
    id: "wvw-tpl-itgc",
    name: "IT General Controls",
    description: "ITGC covering access management, change management, operations, and DR/BCP.",
    type: "IT_SECURITY",
    sections: [
      {
        title: "User Access Management",
        items: [
          { question: "Is there a formal user access provisioning and de-provisioning process?", riskWeight: 2.0, isRequired: true },
          { question: "Are user access reviews performed at least semi-annually?", riskWeight: 1.8, isRequired: true },
          { question: "Is privileged/admin access limited to the minimum necessary?", riskWeight: 2.0, isRequired: true },
          { question: "Are service and generic accounts inventoried and managed?", riskWeight: 1.5 },
          { question: "Is multi-factor authentication enforced for remote access and privileged accounts?", riskWeight: 2.0, isRequired: true },
        ],
      },
      {
        title: "Change Management",
        items: [
          { question: "Is there a documented change management policy and process?", riskWeight: 1.8, isRequired: true },
          { question: "Are all changes to production systems approved prior to implementation?", riskWeight: 1.8, isRequired: true },
          { question: "Are changes tested in a separate environment before production deployment?", riskWeight: 1.8, isRequired: true },
          { question: "Is emergency change management documented with post-implementation review?", riskWeight: 1.5 },
          { question: "Are segregation of duties maintained between developers and production access?", riskWeight: 2.0, isRequired: true },
        ],
      },
      {
        title: "IT Operations",
        items: [
          { question: "Is system monitoring in place to detect and alert on critical failures?", riskWeight: 1.8, isRequired: true },
          { question: "Are batch jobs and scheduled tasks monitored for completion?", riskWeight: 1.5 },
          { question: "Are system logs retained in accordance with policy?", riskWeight: 1.5, isRequired: true },
          { question: "Is patch management applied to all systems within defined timeframes?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "Backup and Recovery",
        items: [
          { question: "Are data backups performed in accordance with the backup policy?", riskWeight: 2.0, isRequired: true },
          { question: "Are backup restores tested at least quarterly?", riskWeight: 1.8, isRequired: true },
          { question: "Are offsite or cloud backups maintained?", riskWeight: 1.5, isRequired: true },
        ],
      },
      {
        title: "IT Security",
        items: [
          { question: "Is antivirus/EDR software deployed and up-to-date on all endpoints?", riskWeight: 2.0, isRequired: true },
          { question: "Is network security monitoring in place (IDS/IPS, SIEM)?", riskWeight: 1.8, isRequired: true },
          { question: "Are vulnerability scans performed at least quarterly?", riskWeight: 1.8, isRequired: true },
          { question: "Are penetration tests performed at least annually?", riskWeight: 1.8 },
        ],
      },
      {
        title: "Disaster Recovery",
        items: [
          { question: "Is a documented disaster recovery plan in place?", riskWeight: 2.0, isRequired: true },
          { question: "Are RTO and RPO targets defined and achievable?", riskWeight: 1.8, isRequired: true },
          { question: "Is the DR plan tested at least annually with documented results?", riskWeight: 1.8, isRequired: true },
        ],
      },
      {
        title: "Physical Security",
        items: [
          { question: "Is access to data centers and server rooms restricted to authorized personnel?", riskWeight: 1.8, isRequired: true },
          { question: "Is environmental monitoring in place for data centers (temperature, humidity, power)?", riskWeight: 1.3 },
          { question: "Are visitor access logs maintained for restricted areas?", riskWeight: 1.3 },
        ],
      },
      {
        title: "Vendor and Third-Party IT Risk",
        items: [
          { question: "Are technology vendors assessed for security controls?", riskWeight: 1.5, isRequired: true },
          { question: "Are SaaS and cloud providers reviewed for security certifications?", riskWeight: 1.5 },
          { question: "Are third-party integrations and APIs inventoried and secured?", riskWeight: 1.5, isRequired: true },
        ],
      },
      {
        title: "Compliance and Policy",
        items: [
          { question: "Are IT policies reviewed and updated at least annually?", riskWeight: 1.3 },
          { question: "Is IT compliance with applicable regulations monitored and reported?", riskWeight: 1.5, isRequired: true },
          { question: "Are IT security awareness training completed by all staff annually?", riskWeight: 1.5, isRequired: true },
        ],
      },
    ],
  },
];
