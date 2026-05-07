export type OnboardingStepTemplate = {
  title:       string;
  description: string;
  category:    string;
  sortOrder:   number;
};

export const NEW_HIRE_STEPS: OnboardingStepTemplate[] = [
  { title: "Send welcome email with first-day details",        category: "HR",       sortOrder: 1,  description: "Include start time, dress code, parking/entry instructions, and first-day agenda." },
  { title: "Add employee to HR system and org chart",          category: "HR",       sortOrder: 2,  description: "Create employee record in WVW Intelligence, assign department and manager." },
  { title: "Complete I-9 verification",                        category: "HR",       sortOrder: 3,  description: "Verify employment eligibility documents. Upload copies to employee record." },
  { title: "Set up direct deposit / payroll",                  category: "HR",       sortOrder: 4,  description: "Collect bank info via secure form. Submit to payroll by Friday of start week." },
  { title: "Send Employee Handbook for acknowledgement",       category: "HR",       sortOrder: 5,  description: "Send via policy acknowledgement flow. Track completion in the employee's policy tab." },
  { title: "Create email account and calendar",                category: "IT",       sortOrder: 6,  description: "Set up company email. Add to relevant team calendars and distribution lists." },
  { title: "Grant platform access (WVW Intelligence)",         category: "IT",       sortOrder: 7,  description: "Invite via Clerk. Assign correct role. Confirm login works." },
  { title: "Share tool access and credentials",                category: "IT",       sortOrder: 8,  description: "Provide access to Slack, project tools, Notion, shared drives." },
  { title: "Set up laptop and required software",              category: "IT",       sortOrder: 9,  description: "Configure machine. Confirm VPN, security settings, and backup." },
  { title: "Assign mandatory onboarding training",             category: "TRAINING", sortOrder: 10, description: "Assign WVW Culture & Values training, DEI Foundations, and role-specific modules in the Academy." },
  { title: "Complete WVW Culture & Values orientation",        category: "TRAINING", sortOrder: 11, description: "60-minute live or async session covering WVW's mission, values, and culture practices." },
  { title: "Shadow first client engagement or audit",          category: "TRAINING", sortOrder: 12, description: "Arrange observation opportunity with a senior team member within the first 30 days." },
  { title: "Assign onboarding buddy",                          category: "CULTURE",  sortOrder: 13, description: "Pair new hire with a peer buddy for informal questions and culture integration." },
  { title: "Intro post in team community",                     category: "CULTURE",  sortOrder: 14, description: "Encourage new hire to post a brief intro in the team Announcements space." },
  { title: "Schedule 1:1 with direct manager (Day 1)",         category: "CULTURE",  sortOrder: 15, description: "30-minute check-in to walk through first-week expectations and review the 30/60/90 plan." },
  { title: "30-day check-in meeting",                          category: "CULTURE",  sortOrder: 16, description: "Structured 1:1 to review onboarding progress and surface any blockers." },
  { title: "60-day performance touchpoint",                    category: "CULTURE",  sortOrder: 17, description: "Review initial work product, set OKRs for next 30 days." },
  { title: "90-day review and confirmation",                   category: "CULTURE",  sortOrder: 18, description: "Formal 90-day review. Confirm role continuation, adjust title/level if needed." },
  { title: "Sign NDA and confidentiality agreement",           category: "LEGAL",    sortOrder: 19, description: "Route through DocuSign or manual signature. Store signed copy in employee Documents." },
  { title: "Sign offer letter / employment agreement",         category: "LEGAL",    sortOrder: 20, description: "Confirm signed copy is on file before start date." },
];

export const ROLE_CHANGE_STEPS: OnboardingStepTemplate[] = [
  { title: "Update role in HR system and org chart",        category: "HR",       sortOrder: 1, description: "Update title, department, level, and reporting structure in WVW Intelligence." },
  { title: "Adjust system access and permissions",          category: "IT",       sortOrder: 2, description: "Review and update platform role, tool access, and shared folder permissions for the new position." },
  { title: "Brief team on new responsibilities",            category: "CULTURE",  sortOrder: 3, description: "Post announcement in community. Schedule brief intro with any new direct reports or stakeholders." },
  { title: "Assign role-specific training modules",         category: "TRAINING", sortOrder: 4, description: "Enroll in any Academy courses required for the new role. Set completion target date." },
  { title: "30-day check-in on new role performance",       category: "CULTURE",  sortOrder: 5, description: "Structured conversation with manager reviewing transition, challenges, and early wins." },
];

export const CLIENT_ONBOARDING_STEPS: OnboardingStepTemplate[] = [
  { title: "Send client welcome package",                   category: "GENERAL",  sortOrder: 1, description: "Deliver welcome deck, platform access guide, and primary contact introduction." },
  { title: "Set up client portal access",                   category: "IT",       sortOrder: 2, description: "Invite client contacts via the Invitations page. Assign CLIENT_USER role and confirm login." },
  { title: "Conduct kickoff meeting",                       category: "GENERAL",  sortOrder: 3, description: "Schedule 60-minute kickoff to align on goals, timelines, and communication cadence." },
  { title: "Complete initial assessment / intake audit",    category: "GENERAL",  sortOrder: 4, description: "Launch the appropriate WVW intake audit template from the Audit Catalog." },
  { title: "Establish communication schedule",              category: "GENERAL",  sortOrder: 5, description: "Set recurring check-in cadence (weekly, bi-weekly) and preferred channels." },
  { title: "Share data sharing agreements",                 category: "LEGAL",    sortOrder: 6, description: "Confirm NDA, data processing agreement, and any client-specific compliance requirements are signed." },
  { title: "30-day relationship check-in",                  category: "GENERAL",  sortOrder: 7, description: "Review early engagement experience, surface any friction, confirm scope alignment." },
];
