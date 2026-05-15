import { getCurrentUser } from "@/lib/auth";
import { unauthorized, tooManyRequests } from "@/lib/api-response";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const client = new Anthropic();

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_dashboard_snapshot",
    description: "Get high-level counts and stats across the entire platform: clients, audits, findings, employees, invoices, onboarding, jobs.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "search_clients",
    description: "Search and list clients. Can filter by name, status, or industry. Returns client details including health score and engagement history.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Name or keyword to search for (optional)" },
        status: { type: "string", description: "Filter by status: active, inactive (optional)" },
        limit: { type: "number", description: "Max results to return (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "get_client_detail",
    description: "Get full details for a specific client including audits, invoices, contacts, and onboarding workflows.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string", description: "Client ID" },
        clientName: { type: "string", description: "Client name to search by (if no ID)" },
      },
      required: [],
    },
  },
  {
    name: "search_audits",
    description: "Search audits by name, client, status, or type. Returns audit details with finding counts and completion percentages.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search by audit name" },
        clientName: { type: "string", description: "Filter by client name" },
        status: { type: "string", description: "Filter by status: PLANNING, FIELDWORK, REVIEW, COMPLETED, DRAFT" },
        type: { type: "string", description: "Audit type: HR, COMPLIANCE, OPERATIONAL, IT, FINANCIAL, RISK, INTERNAL, CUSTOM" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "get_audit_detail",
    description: "Get full audit details including all sections, checklist items, findings, evidence, and survey results.",
    input_schema: {
      type: "object" as const,
      properties: {
        auditId: { type: "string", description: "Audit ID" },
        auditName: { type: "string", description: "Audit name to search by (if no ID)" },
      },
      required: [],
    },
  },
  {
    name: "search_findings",
    description: "Search audit findings by status, severity, client, or keyword. Returns finding details and remediation status.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search in finding title or description" },
        status: { type: "string", description: "Filter by status: OPEN, IN_PROGRESS, RESOLVED, CLOSED" },
        severity: { type: "string", description: "Filter by severity: CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL" },
        clientName: { type: "string", description: "Filter by client name" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "search_employees",
    description: "Search employees by name, department, title, or status. Returns employee profile details.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search by name or title" },
        department: { type: "string", description: "Filter by department" },
        status: { type: "string", description: "Filter by employment status: ACTIVE, ON_LEAVE, TERMINATED" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "get_onboarding_status",
    description: "Get onboarding and offboarding workflow status for employees, clients, students, or instructors. Shows progress, blocked steps, and document collection status.",
    input_schema: {
      type: "object" as const,
      properties: {
        entityType: { type: "string", description: "Filter by: EMPLOYEE, CLIENT, STUDENT, INSTRUCTOR (optional)" },
        workflowType: { type: "string", description: "Filter by: ONBOARDING, OFFBOARDING (optional)" },
        status: { type: "string", description: "Filter by workflow status: ACTIVE, COMPLETED, ARCHIVED (optional)" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "search_invoices",
    description: "Search invoices by client, status, or date range. Returns invoice amounts, payment status, and overdue info.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientName: { type: "string", description: "Filter by client name" },
        status: { type: "string", description: "Filter by status: DRAFT, SENT, PAID, OVERDUE, VOID" },
        overdue: { type: "boolean", description: "If true, only return overdue invoices" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "get_job_board",
    description: "Get all job postings with open seats, filled seats, and application pipeline. Returns hiring status per role.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filter by posting status: OPEN, CLOSED, DRAFT (optional)" },
      },
      required: [],
    },
  },
  {
    name: "get_financial_summary",
    description: "Get financial summary: total revenue, outstanding balances, overdue invoices, and revenue by client.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_training_report",
    description: "Get employee training completion rates, certifications, and policy acknowledgement status.",
    input_schema: {
      type: "object" as const,
      properties: {
        department: { type: "string", description: "Filter by department (optional)" },
      },
      required: [],
    },
  },
  {
    name: "search_students",
    description: "Search students/cohorts and their progress through WVW programs. Returns enrollment, credentials, and completion status.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search by student name or cohort" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "get_evidence_report",
    description: "Get evidence collection status across audits — what's been uploaded, what's missing, and coverage percentages.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientName: { type: "string", description: "Filter by client name (optional)" },
        limit: { type: "number", description: "Max audits to include (default 10)" },
      },
      required: [],
    },
  },
];

// ─── Tool execution ───────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, unknown>, orgId: string): Promise<unknown> {
  switch (name) {
    case "get_dashboard_snapshot": {
      const [clients, audits, findings, employees, invoices, onboarding, jobs, openFindings] = await Promise.all([
        db.client.count({ where: { orgId, isActive: true } }),
        db.audit.count({ where: { orgId } }),
        db.auditFinding.count({ where: { audit: { orgId } } }),
        db.employee.count({ where: { orgId } }),
        db.invoice.findMany({ where: { orgId }, select: { total: true, status: true, paidDate: true } }),
        db.onboardingWorkflow.groupBy({ by: ["entityType", "status"], where: { orgId }, _count: true }),
        db.jobPosting.count({ where: { orgId, status: "PUBLISHED" } }),
        db.auditFinding.count({ where: { audit: { orgId }, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      ]);
      const totalRevenue = invoices.filter(i => i.status === "PAID").reduce((s, i) => s + i.total, 0);
      const outstanding = invoices.filter(i => ["SENT", "OVERDUE"].includes(i.status)).reduce((s, i) => s + i.total, 0);
      const overdue = invoices.filter(i => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);
      return { clients, totalAudits: audits, openFindings, totalFindings: findings, employees, totalRevenue, outstanding, overdue, openJobPostings: jobs, onboarding };
    }

    case "search_clients": {
      const { query, status, limit = 20 } = input as { query?: string; status?: string; limit?: number };
      const clients = await db.client.findMany({
        where: {
          orgId,
          ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
          ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
          deletedAt: null,
        },
        include: {
          _count: { select: { audits: true, invoices: true } },
          audits: { where: { status: { in: ["PLANNING", "FIELDWORK", "REVIEW"] } }, select: { id: true, status: true }, take: 5 },
        },
        orderBy: { name: "asc" },
        take: limit,
      });
      return clients.map(c => ({
        id: c.id, name: c.name, industry: c.industry, isActive: c.isActive,
        totalAudits: c._count.audits, totalInvoices: c._count.invoices,
        activeAudits: c.audits.length, onboardedAt: c.onboardedAt,
      }));
    }

    case "get_client_detail": {
      const { clientId, clientName } = input as { clientId?: string; clientName?: string };
      const client = await db.client.findFirst({
        where: {
          orgId,
          ...(clientId ? { id: clientId } : {}),
          ...(clientName ? { name: { contains: clientName, mode: "insensitive" } } : {}),
          deletedAt: null,
        },
        include: {
          audits: { select: { id: true, name: true, status: true, type: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 },
          invoices: { select: { id: true, invoiceNumber: true, total: true, status: true, dueDate: true }, orderBy: { createdAt: "desc" }, take: 10 },
          onboardingWorkflows: { select: { id: true, type: true, status: true, entityType: true }, take: 5 },
          _count: { select: { audits: true, invoices: true } },
        },
      });
      if (!client) return { error: "Client not found" };
      return client;
    }

    case "search_audits": {
      const { query, clientName, status, type, limit = 20 } = input as { query?: string; clientName?: string; status?: string; type?: string; limit?: number };
      const audits = await db.audit.findMany({
        where: {
          orgId,
          ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
          ...(status ? { status: status as never } : {}),
          ...(type ? { type: type as never } : {}),
          ...(clientName ? { client: { name: { contains: clientName, mode: "insensitive" } } } : {}),
        },
        include: {
          client: { select: { name: true } },
          _count: { select: { findings: true, evidence: true } },
          sections: {
            select: {
              checklistItems: {
                select: { id: true, isCompleted: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return audits.map(a => {
        const allItems = a.sections.flatMap(s => s.checklistItems);
        const completed = allItems.filter(i => i.isCompleted).length;
        return {
          id: a.id, name: a.name, type: a.type, status: a.status,
          client: a.client?.name, findings: a._count.findings, evidence: a._count.evidence,
          totalChecklist: allItems.length, completedChecklist: completed,
          completionPct: allItems.length > 0 ? Math.round(completed / allItems.length * 100) : 0,
          fieldworkStart: a.fieldworkStartDate, fieldworkEnd: a.fieldworkEndDate,
        };
      });
    }

    case "get_audit_detail": {
      const { auditId, auditName } = input as { auditId?: string; auditName?: string };
      const audit = await db.audit.findFirst({
        where: {
          orgId,
          ...(auditId ? { id: auditId } : {}),
          ...(auditName ? { name: { contains: auditName, mode: "insensitive" } } : {}),
        },
        include: {
          client: { select: { name: true } },
          sections: {
            include: {
              checklistItems: {
                select: { id: true, question: true, isCompleted: true, riskWeight: true, isRequired: true },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
          findings: {
            select: { id: true, title: true, severity: true, status: true, findingNumber: true },
            orderBy: [{ severity: "asc" }],
            take: 50,
          },
          _count: { select: { evidence: true, findings: true } },
        },
      });
      if (!audit) return { error: "Audit not found" };
      const allItems = audit.sections.flatMap(s => s.checklistItems);
      const completed = allItems.filter(i => i.isCompleted).length;
      return {
        id: audit.id, name: audit.name, type: audit.type, status: audit.status,
        client: audit.client?.name, evidenceCount: audit._count.evidence,
        totalChecklist: allItems.length, completedChecklist: completed,
        completionPct: allItems.length > 0 ? Math.round(completed / allItems.length * 100) : 0,
        sections: audit.sections.map(s => ({
          title: s.title,
          items: s.checklistItems.length,
          completed: s.checklistItems.filter(i => i.isCompleted).length,
        })),
        findings: audit.findings,
      };
    }

    case "search_findings": {
      const { query, status, severity, clientName, limit = 20 } = input as { query?: string; status?: string; severity?: string; clientName?: string; limit?: number };
      const findings = await db.auditFinding.findMany({
        where: {
          audit: {
            orgId,
            ...(clientName ? { client: { name: { contains: clientName, mode: "insensitive" } } } : {}),
          },
          ...(status ? { status: status as never } : {}),
          ...(severity ? { severity: severity as never } : {}),
          ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
        },
        include: {
          audit: { select: { name: true, client: { select: { name: true } } } },
          assignee: { select: { firstName: true, lastName: true } },
          remediationActions: { select: { id: true, status: true } },
        },
        orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
        take: limit,
      });
      return findings.map(f => ({
        id: f.id, findingNumber: f.findingNumber, title: f.title,
        severity: f.severity, status: f.status,
        audit: f.audit.name, client: f.audit.client?.name,
        assignee: f.assignee ? `${f.assignee.firstName} ${f.assignee.lastName}` : null,
        remediationActions: f.remediationActions.length,
        remediationCompleted: f.remediationActions.filter(r => r.status === "DONE").length,
        dueDate: f.dueDate, description: f.description?.slice(0, 200),
      }));
    }

    case "search_employees": {
      const { query, department, status, limit = 20 } = input as { query?: string; department?: string; status?: string; limit?: number };
      const employees = await db.employee.findMany({
        where: {
          orgId,
          ...(query ? { OR: [{ firstName: { contains: query, mode: "insensitive" } }, { lastName: { contains: query, mode: "insensitive" } }, { title: { contains: query, mode: "insensitive" } }] } : {}),
          ...(department ? { department: { contains: department, mode: "insensitive" } } : {}),
          ...(status ? { employmentStatus: status as never } : {}),
        },
        select: {
          id: true, firstName: true, lastName: true, title: true, department: true,
          employmentStatus: true, employmentType: true, startDate: true, location: true,
          _count: { select: { trainingRecords: true, onboardingWorkflows: true } },
        },
        orderBy: [{ lastName: "asc" }],
        take: limit,
      });
      return employees.map(e => ({
        id: e.id, name: `${e.firstName} ${e.lastName}`, title: e.title, department: e.department,
        status: e.employmentStatus, type: e.employmentType, startDate: e.startDate, location: e.location,
        trainingRecords: e._count.trainingRecords, onboardingWorkflows: e._count.onboardingWorkflows,
      }));
    }

    case "get_onboarding_status": {
      const { entityType, workflowType, status, limit = 20 } = input as { entityType?: string; workflowType?: string; status?: string; limit?: number };
      const workflows = await db.onboardingWorkflow.findMany({
        where: {
          orgId,
          ...(entityType ? { entityType } : {}),
          ...(workflowType ? { type: workflowType as never } : {}),
          ...(status ? { status: status as never } : {}),
        },
        include: {
          employee: { select: { firstName: true, lastName: true, title: true } },
          client: { select: { name: true } },
          steps: {
            select: { id: true, status: true, documentRequired: true, documentCollected: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return workflows.map(w => {
        const total = w.steps.length;
        const completed = w.steps.filter(s => s.status === "COMPLETED").length;
        const blocked = w.steps.filter(s => s.status === "BLOCKED").length;
        const docsRequired = w.steps.filter(s => s.documentRequired).length;
        const docsCollected = w.steps.filter(s => s.documentRequired && s.documentCollected).length;
        return {
          id: w.id, type: w.type, entityType: w.entityType, status: w.status,
          entity: w.employee ? `${w.employee.firstName} ${w.employee.lastName}` : w.client?.name ?? w.studentName,
          totalSteps: total, completedSteps: completed, blockedSteps: blocked,
          completionPct: total > 0 ? Math.round(completed / total * 100) : 0,
          docsRequired, docsCollected, docsPending: docsRequired - docsCollected,
          targetDate: w.targetDate,
        };
      });
    }

    case "search_invoices": {
      const { clientName, status, overdue, limit = 20 } = input as { clientName?: string; status?: string; overdue?: boolean; limit?: number };
      const now = new Date();
      const invoices = await db.invoice.findMany({
        where: {
          orgId,
          ...(clientName ? { client: { name: { contains: clientName, mode: "insensitive" } } } : {}),
          ...(status ? { status: status as never } : {}),
          ...(overdue ? { status: { in: ["SENT", "OVERDUE"] }, dueDate: { lt: now } } : {}),
        },
        include: { client: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return invoices.map(inv => ({
        id: inv.id, invoiceNumber: inv.invoiceNumber, client: inv.client?.name,
        total: inv.total, status: inv.status, dueDate: inv.dueDate,
        isOverdue: inv.status === "OVERDUE" || (["SENT"].includes(inv.status) && inv.dueDate < now),
        paidDate: inv.paidDate,
      }));
    }

    case "get_job_board": {
      const { status } = input as { status?: string };
      const postings = await db.jobPosting.findMany({
        where: { orgId, ...(status ? { status: status as never } : {}) },
        include: {
          _count: { select: { applications: true } },
          applications: { select: { status: true }, take: 200 },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return postings.map(p => {
        const apps = p.applications;
        const hired = apps.filter(a => a.status === "HIRED").length;
        return {
          id: p.id, title: p.title, department: p.department, location: p.location,
          type: p.type, status: p.status,
          totalApplications: p._count.applications,
          interviews: apps.filter(a => a.status === "INTERVIEW").length,
          offers: apps.filter(a => a.status === "OFFERED").length,
          hired,
          salaryMin: p.salaryMin, salaryMax: p.salaryMax,
          postedAt: p.createdAt,
        };
      });
    }

    case "get_financial_summary": {
      const invoices = await db.invoice.findMany({
        where: { orgId },
        include: { client: { select: { name: true } } },
      });
      const byClient: Record<string, { name: string; revenue: number; outstanding: number }> = {};
      for (const inv of invoices) {
        const key = inv.client?.name ?? "Unknown";
        if (!byClient[key]) byClient[key] = { name: key, revenue: 0, outstanding: 0 };
        if (inv.status === "PAID") byClient[key]!.revenue += inv.total;
        if (["SENT", "OVERDUE"].includes(inv.status)) byClient[key]!.outstanding += inv.total;
      }
      return {
        totalRevenue: invoices.filter(i => i.status === "PAID").reduce((s, i) => s + i.total, 0),
        outstanding: invoices.filter(i => ["SENT", "OVERDUE"].includes(i.status)).reduce((s, i) => s + i.total, 0),
        overdue: invoices.filter(i => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0),
        totalInvoices: invoices.length,
        paidCount: invoices.filter(i => i.status === "PAID").length,
        overdueCount: invoices.filter(i => i.status === "OVERDUE").length,
        byClient: Object.values(byClient).sort((a, b) => b.revenue - a.revenue).slice(0, 15),
      };
    }

    case "get_training_report": {
      const { department } = input as { department?: string };
      const [employees, training, policies] = await Promise.all([
        db.employee.findMany({
          where: { orgId, employmentStatus: { not: "TERMINATED" }, ...(department ? { department } : {}) },
          select: { id: true, firstName: true, lastName: true, department: true, title: true },
          take: 200,
        }),
        db.trainingRecord.findMany({
          where: { employee: { orgId, employmentStatus: { not: "TERMINATED" }, ...(department ? { department } : {}) } },
          select: { employeeId: true, trainingName: true, completedAt: true, passed: true, expiresAt: true },
          take: 1000,
        }),
        db.policyAcknowledgement.findMany({
          where: { employee: { orgId, employmentStatus: { not: "TERMINATED" }, ...(department ? { department } : {}) } },
          select: { employeeId: true, acknowledgedAt: true },
          take: 500,
        }),
      ]);
      const byEmp: Record<string, { name: string; dept: string | null; trainings: number; passed: number; acknowledgements: number }> = {};
      for (const e of employees) {
        byEmp[e.id] = { name: `${e.firstName} ${e.lastName}`, dept: e.department, trainings: 0, passed: 0, acknowledgements: 0 };
      }
      for (const t of training) { if (byEmp[t.employeeId]) { byEmp[t.employeeId]!.trainings++; if (t.passed) byEmp[t.employeeId]!.passed++; } }
      for (const p of policies) { if (byEmp[p.employeeId]) byEmp[p.employeeId]!.acknowledgements++; }
      return {
        totalEmployees: employees.length,
        totalTrainingRecords: training.length,
        totalPolicyAcknowledgements: policies.length,
        employees: Object.values(byEmp).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 50),
      };
    }

    case "search_students": {
      const { query, limit = 20 } = input as { query?: string; limit?: number };
      const workflows = await db.onboardingWorkflow.findMany({
        where: {
          orgId,
          entityType: { in: ["STUDENT", "INSTRUCTOR"] },
          ...(query ? { studentName: { contains: query, mode: "insensitive" } } : {}),
        },
        include: {
          steps: { select: { id: true, status: true, documentRequired: true, documentCollected: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      const cohorts = await db.cohort.findMany({
        where: { orgId, ...(query ? { name: { contains: query, mode: "insensitive" } } : {}) },
        include: { _count: { select: { members: true } } },
        take: 10,
      }).catch(() => []);
      return { studentWorkflows: workflows.map(w => ({
        name: w.studentName, email: w.studentEmail, type: w.entityType,
        status: w.status, steps: w.steps.length,
        completed: w.steps.filter(s => s.status === "COMPLETED").length,
      })), cohorts };
    }

    case "get_evidence_report": {
      const { clientName, limit = 10 } = input as { clientName?: string; limit?: number };
      const audits = await db.audit.findMany({
        where: {
          orgId,
          status: { in: ["PLANNING", "FIELDWORK", "REVIEW"] },
          ...(clientName ? { client: { name: { contains: clientName, mode: "insensitive" } } } : {}),
        },
        include: {
          client: { select: { name: true } },
          evidence: { select: { id: true, type: true } },
          sections: {
            include: {
              checklistItems: {
                select: { id: true, isCompleted: true, evidence: { select: { id: true } } },
              },
            },
          },
        },
        take: limit,
      });
      return audits.map(a => {
        const items = a.sections.flatMap(s => s.checklistItems);
        const withEvidence = items.filter(i => i.evidence.length > 0).length;
        return {
          auditName: a.name, client: a.client?.name, status: a.status,
          totalEvidence: a.evidence.length, checklistItems: items.length,
          itemsWithEvidence: withEvidence, coveragePct: items.length > 0 ? Math.round(withEvidence / items.length * 100) : 0,
        };
      });
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const rl = rateLimit(rateLimitKey("ai:chat", user.id), 30, 60_000);
    if (!rl.allowed) return tooManyRequests(rl.retryAfter);

    const { messages, context } = await req.json();

    const systemPrompt = `You are the WVW Intelligence AI command center — the expert AI assistant for WVW Consulting's full operations platform. You have real-time access to ALL organizational data through tools you can call.

Current user: ${user.firstName} ${user.lastName} (${user.role}) at ${user.org?.name ?? "WVW Consulting"}

You can answer questions and take action across EVERY area of the platform:
- Clients, engagements, audit history, health scores
- Audits: status, checklist completion, findings, evidence gaps, survey results
- Findings: severity, remediation status, open issues
- Employees: profiles, onboarding, training, certifications, policy acknowledgements
- Onboarding/Offboarding: progress, blocked steps, document collection for employees, clients, students, instructors
- Financial: invoices, revenue, outstanding balances, overdue accounts
- Job board: open positions, seats available, filled seats, application pipeline
- Students and instructors: enrollment, credentials, cohort progress
- Evidence collection: what's uploaded, what's missing across audits

WVW methodology:
- HR audits and compliance (EEOC, FLSA, ADA, FMLA, HIPAA)
- SOC 2, ISO 27001, NIST frameworks
- DEI and organizational wellness assessments
- WVW 5-phase model: Discovery → Assessment → Findings → Remediation → Monitoring

ALWAYS use tools to get current data before answering — never guess. Call multiple tools if needed. Be concise, specific, and actionable. Use tables or bullet points for data. Format currency with $ and commas.
${context ? `\nCurrent page context: ${context}` : ""}`;

    // Run the agentic tool-use loop
    const allMessages: Anthropic.MessageParam[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    // Stream with tool use — multi-turn loop
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let continueLoop = true;
          while (continueLoop) {
            const response = await client.messages.create({
              model: "claude-sonnet-4-6",
              max_tokens: 4096,
              system: systemPrompt,
              tools: TOOLS,
              messages: allMessages,
              stream: false, // Non-streaming for tool use loop; stream final text response
            });

            if (response.stop_reason === "tool_use") {
              // Extract text so far and tool calls
              const textBlocks = response.content.filter(b => b.type === "text");
              const toolUses = response.content.filter(b => b.type === "tool_use");

              // Stream any intermediate text
              for (const tb of textBlocks) {
                if (tb.type === "text" && tb.text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: tb.text })}\n\n`));
                }
              }

              // Add assistant's message with tool use to history
              allMessages.push({ role: "assistant", content: response.content });

              // Execute all tool calls in parallel
              const toolResults = await Promise.all(
                toolUses.map(async (tu) => {
                  if (tu.type !== "tool_use") return null;
                  const result = await executeTool(tu.name, tu.input as Record<string, unknown>, user.orgId);
                  return {
                    type: "tool_result" as const,
                    tool_use_id: tu.id,
                    content: JSON.stringify(result),
                  };
                })
              );

              // Add tool results to history
              allMessages.push({
                role: "user",
                content: toolResults.filter(Boolean) as Anthropic.ToolResultBlockParam[],
              });

            } else {
              // Final response — stream it
              continueLoop = false;
              for (const block of response.content) {
                if (block.type === "text" && block.text) {
                  // Stream in chunks to simulate streaming
                  const words = block.text.split(" ");
                  const chunkSize = 5;
                  for (let i = 0; i < words.length; i += chunkSize) {
                    const chunk = words.slice(i, i + chunkSize).join(" ") + (i + chunkSize < words.length ? " " : "");
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                  }
                }
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("[AI Chat Error]", e);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "\n\nSorry, I encountered an error fetching that data. Please try again." })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("[AI Chat Error]", e);
    return new Response(JSON.stringify({ error: "AI service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
