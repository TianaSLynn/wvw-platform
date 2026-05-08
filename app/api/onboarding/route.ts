/**
 * Onboarding/Offboarding Workflow API
 * Creates and lists workflows with their steps for employees.
 * Includes template-based step generation for WVW's standard process.
 */
import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

// ─── WVW Standard Step Templates ─────────────────────────────────────────────

const ONBOARDING_TEMPLATE = [
  // HR & Admin
  { title: "Send welcome email with first-day details", category: "HR", sortOrder: 1, description: "Include start time, dress code, parking/entry instructions, and first-day agenda. Use the Welcome Email template from Documents." },
  { title: "Add employee to HR system and org chart", category: "HR", sortOrder: 2, description: "Create employee record in WVW Intelligence, assign department and manager." },
  { title: "Complete I-9 verification", category: "HR", sortOrder: 3, description: "Verify employment eligibility documents. Upload copies to employee record." },
  { title: "Set up direct deposit / payroll", category: "HR", sortOrder: 4, description: "Collect bank info via secure form. Submit to payroll by Friday of start week." },
  { title: "Send Employee Handbook for acknowledgement", category: "HR", sortOrder: 5, description: "Send via policy acknowledgement flow in WVW Intelligence. Track completion in the employee's policy tab." },
  // IT & Access
  { title: "Create email account and calendar", category: "IT", sortOrder: 6, description: "Set up @wvwconsulting.com email. Add to relevant team calendars and distribution lists." },
  { title: "Grant platform access (WVW Intelligence)", category: "IT", sortOrder: 7, description: "Invite via Clerk. Assign correct role (CONSULTANT, MANAGER, etc.). Confirm login works." },
  { title: "Share tool access and credentials", category: "IT", sortOrder: 8, description: "Provide access to Slack, project management tools, Notion, shared drives, and any client-specific systems." },
  { title: "Set up laptop and required software", category: "IT", sortOrder: 9, description: "Configure machine with required tools. Confirm VPN, security settings, and backup are configured." },
  // Training
  { title: "Assign mandatory onboarding training", category: "TRAINING", sortOrder: 10, description: "Assign WVW Culture & Values training, DEI Foundations, and any role-specific modules in the Academy." },
  { title: "Complete WVW Culture & Values orientation", category: "TRAINING", sortOrder: 11, description: "60-minute live or async session covering WVW's mission, values, and culture practices." },
  { title: "Shadow first client engagement or audit", category: "TRAINING", sortOrder: 12, description: "Arrange observation opportunity with a senior team member within the first 30 days." },
  // Culture & Intro
  { title: "Assign onboarding buddy", category: "CULTURE", sortOrder: 13, description: "Pair new hire with a peer buddy for informal questions and culture integration." },
  { title: "Intro post in team community", category: "CULTURE", sortOrder: 14, description: "Encourage new hire to post a brief intro in the team Announcements space. Post welcome announcement on their behalf if needed." },
  { title: "Schedule 1:1 with direct manager (Day 1)", category: "CULTURE", sortOrder: 15, description: "30-minute check-in to walk through first-week expectations, answer questions, and review the 30/60/90 plan." },
  { title: "30-day check-in meeting", category: "CULTURE", sortOrder: 16, description: "Structured 1:1 to review onboarding progress, surface any blockers, and assess cultural fit. Document outcomes." },
  { title: "60-day performance touchpoint", category: "CULTURE", sortOrder: 17, description: "Review initial work product, set OKRs for next 30 days. Update employee record with notes." },
  { title: "90-day review and confirmation", category: "CULTURE", sortOrder: 18, description: "Formal 90-day review. Confirm role continuation, adjust title/level if needed. Archive onboarding workflow." },
  // Legal
  { title: "Sign NDA and confidentiality agreement", category: "LEGAL", sortOrder: 19, description: "Route through DocuSign or manual signature. Store signed copy in employee Documents." },
  { title: "Sign offer letter / employment agreement", category: "LEGAL", sortOrder: 20, description: "Confirm signed copy is on file before start date." },
];

const OFFBOARDING_TEMPLATE = [
  // HR
  { title: "Confirm last day and final pay calculation", category: "HR", sortOrder: 1, description: "Verify last working day, calculate PTO payout, and confirm final paycheck date with payroll." },
  { title: "Send separation paperwork", category: "HR", sortOrder: 2, description: "Provide COBRA notice, final paycheck info, and any severance documentation." },
  { title: "Update employee status to TERMINATED in WVW Intelligence", category: "HR", sortOrder: 3, description: "Change employment status in workforce tracker. This will auto-post a farewell announcement." },
  { title: "Conduct exit interview", category: "HR", sortOrder: 4, description: "Schedule 30-minute exit interview. Document feedback and flag any retention insights." },
  { title: "Remove from org chart and payroll", category: "HR", sortOrder: 5, description: "Update reporting structure. Remove from active payroll after final pay." },
  // IT
  { title: "Revoke platform and system access", category: "IT", sortOrder: 6, description: "Disable WVW Intelligence login, email, Slack, shared drives, and any client portals. Disable on last day." },
  { title: "Retrieve company equipment", category: "IT", sortOrder: 7, description: "Arrange return of laptop, badge, and any other company property. Document return in asset registry." },
  { title: "Transfer files and knowledge", category: "IT", sortOrder: 8, description: "Work with manager to ensure all project files, client contacts, and institutional knowledge are properly transferred." },
  { title: "Forward email or set auto-reply", category: "IT", sortOrder: 9, description: "Set up email forwarding or out-of-office for 30 days post-departure. Notify key clients." },
  // Client & Projects
  { title: "Transition active client accounts", category: "GENERAL", sortOrder: 10, description: "Assign all active client engagements, audits, and open tasks to new owner. Notify clients of transition." },
  { title: "Close or reassign open tasks and milestones", category: "GENERAL", sortOrder: 11, description: "Review all open tasks. Reassign to active team members or close with documentation." },
  // Culture
  { title: "Post farewell announcement", category: "CULTURE", sortOrder: 12, description: "Post in team Announcements (auto-triggered when status changes to TERMINATED, or post manually)." },
  { title: "Send farewell gift or card (if applicable)", category: "CULTURE", sortOrder: 13, description: "Coordinate team card or farewell gesture in alignment with WVW culture values." },
];

const createSchema = z.object({
  employeeId: z.string(),
  type:       z.enum(["ONBOARDING", "OFFBOARDING"]),
  targetDate: z.string().nullish(),
  notes:      z.string().nullish(),
  useTemplate: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;

    const workflows = await db.onboardingWorkflow.findMany({
      where: {
        orgId: user.orgId,
        ...(type ? { type: type as "ONBOARDING" | "OFFBOARDING" } : {}),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, title: true, department: true, employmentStatus: true } },
        steps: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(workflows);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { employeeId, type, targetDate, notes, useTemplate } = parsed.data;

    // Verify employee belongs to this org
    const employee = await db.employee.findFirst({ where: { id: employeeId, orgId: user.orgId } });
    if (!employee) return badRequest("Employee not found");

    const template = type === "ONBOARDING" ? ONBOARDING_TEMPLATE : OFFBOARDING_TEMPLATE;

    const workflow = await db.onboardingWorkflow.create({
      data: {
        orgId:      user.orgId,
        employeeId,
        type,
        status:     "ACTIVE",
        targetDate: targetDate ? new Date(targetDate) : null,
        notes:      notes ?? null,
        steps: useTemplate ? {
          create: template.map((step) => ({
            title:       step.title,
            description: step.description,
            category:    step.category,
            sortOrder:   step.sortOrder,
            status:      "PENDING",
          })),
        } : undefined,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, title: true } },
        steps: { orderBy: { sortOrder: "asc" } },
      },
    });

    return created(workflow);
  } catch (e) { return serverError(e); }
}
