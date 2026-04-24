import { getCurrentUser } from "@/lib/auth";
import { unauthorized, notFound, serverError } from "@/lib/api-response";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(_req: Request, { params }: { params: Promise<{ auditId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { auditId } = await params;

    const audit = await db.audit.findFirst({
      where: { id: auditId, orgId: user.orgId },
      include: {
        client: { select: { name: true, industry: true } },
        members: { include: { user: { select: { firstName: true, lastName: true, title: true } } } },
        sections: {
          include: { checklistItems: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
        findings: {
          include: {
            remediationActions: { select: { title: true, status: true, dueDate: true } },
            assignee: { select: { firstName: true, lastName: true } },
          },
          orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
        },
        evidence: { select: { title: true, type: true, collectedAt: true } },
        frameworks: { include: { framework: { select: { name: true } } } },
      },
    });

    if (!audit) return notFound("Audit");

    // Build structured data for the AI
    const completedItems = audit.sections.flatMap((s) => s.checklistItems).filter((i) => i.isCompleted).length;
    const totalItems     = audit.sections.flatMap((s) => s.checklistItems).length;
    const findingsBySev = {
      CRITICAL:      audit.findings.filter((f) => f.severity === "CRITICAL").length,
      HIGH:          audit.findings.filter((f) => f.severity === "HIGH").length,
      MEDIUM:        audit.findings.filter((f) => f.severity === "MEDIUM").length,
      LOW:           audit.findings.filter((f) => f.severity === "LOW").length,
      INFORMATIONAL: audit.findings.filter((f) => f.severity === "INFORMATIONAL").length,
    };
    const openFindings = audit.findings.filter((f) => ["OPEN","IN_PROGRESS"].includes(f.status)).length;
    const remediatedFindings = audit.findings.filter((f) => f.status === "REMEDIATED").length;

    const findingsSummary = audit.findings.map((f) => ({
      number: f.findingNumber,
      title: f.title,
      severity: f.severity,
      status: f.status,
      riskScore: f.riskScore,
      remediationActions: f.remediationActions.length,
      remediationDone: f.remediationActions.filter((a) => a.status === "DONE").length,
      assignee: f.assignee ? `${f.assignee.firstName} ${f.assignee.lastName}` : "Unassigned",
      dueDate: f.dueDate,
    }));

    const prompt = `You are a senior audit partner writing a formal audit report. Generate a professional, comprehensive audit report narrative.

AUDIT DETAILS:
- Audit Name: ${audit.name}
- Client: ${audit.client.name} (${audit.client.industry ?? "General"})
- Type: ${audit.type}
- Status: ${audit.status}
- Scope: ${audit.scope ?? "Not specified"}
- Frameworks: ${audit.frameworks.map((f) => f.framework.name).join(", ") || "None"}
- Audit Team: ${audit.members.map((m) => `${m.user.firstName} ${m.user.lastName} (${m.role})`).join(", ")}

CHECKLIST COMPLETION:
- ${completedItems} of ${totalItems} items completed (${totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%)

FINDINGS SUMMARY:
- Critical: ${findingsBySev.CRITICAL}, High: ${findingsBySev.HIGH}, Medium: ${findingsBySev.MEDIUM}, Low: ${findingsBySev.LOW}
- Open: ${openFindings}, Remediated: ${remediatedFindings}

FINDINGS DETAIL:
${JSON.stringify(findingsSummary, null, 2)}

EVIDENCE COLLECTED: ${audit.evidence.length} items

Generate a professional audit report in the following JSON structure (no markdown, valid JSON only):
{
  "executiveSummary": "3-4 paragraph executive summary suitable for C-suite and board",
  "auditOpinion": "overall audit opinion: Clean|Qualified|Adverse|Disclaimer",
  "opinionRationale": "2-3 sentences justifying the opinion",
  "keyStrengths": ["list of 3-5 organizational strengths observed"],
  "criticalObservations": "2-3 paragraph narrative of critical and high findings",
  "riskRating": "Critical|High|Medium|Low",
  "overallRiskScore": 65,
  "recommendationSummary": "2 paragraph summary of recommended actions",
  "managementActionPlan": "paragraph describing expected management response",
  "conclusion": "1-2 paragraph conclusion and next steps",
  "disclaimers": ["standard audit disclaimer statements"]
}`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "";
    let reportNarrative: unknown;
    try {
      reportNarrative = JSON.parse(text.trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned invalid response");
      reportNarrative = JSON.parse(match[0]);
    }

    // Update audit with risk score
    const narrative = reportNarrative as Record<string, unknown>;
    if (typeof narrative.overallRiskScore === "number") {
      await db.audit.update({
        where: { id: auditId },
        data: { overallRiskScore: narrative.overallRiskScore },
      });
    }

    // Assemble full report data
    const report = {
      audit: {
        id: audit.id,
        name: audit.name,
        code: audit.code,
        type: audit.type,
        status: audit.status,
        client: audit.client,
        scope: audit.scope,
        frameworks: audit.frameworks.map((f) => f.framework.name),
        team: audit.members.map((m) => ({
          name: `${m.user.firstName} ${m.user.lastName}`,
          title: m.user.title,
          role: m.role,
        })),
        fieldworkStart: audit.fieldworkStartDate,
        fieldworkEnd: audit.fieldworkEndDate,
        reportDate: new Date().toISOString(),
      },
      metrics: {
        checklistCompletion: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        findingsBySeverity: findingsBySev,
        openFindings,
        remediatedFindings,
        evidenceCount: audit.evidence.length,
      },
      findings: audit.findings,
      narrative: reportNarrative,
      generatedAt: new Date().toISOString(),
      generatedBy: `${user.firstName} ${user.lastName}`,
    };

    return new Response(JSON.stringify({ data: report }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return serverError(e);
  }
}
