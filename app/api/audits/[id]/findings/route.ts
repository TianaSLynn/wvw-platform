import { db } from "@/lib/db";
import { ok, created, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { findingSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";
import { sendFindingAlert } from "@/lib/email";
import { sendTeamsFindingAlert } from "@/lib/ms365";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId } = await params;

    const audit = await db.audit.findFirst({ where: { id: auditId, orgId: user.orgId } });
    if (!audit) return notFound("Audit");

    const findings = await db.auditFinding.findMany({
      where: { auditId },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        remediationActions: true,
        _count: { select: { evidence: true } },
      },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    });

    return ok(findings);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId } = await params;

    const audit = await db.audit.findFirst({ where: { id: auditId, orgId: user.orgId } });
    if (!audit) return notFound("Audit");

    const body = await req.json();
    const parsed = findingSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    // Auto-generate finding number
    const count = await db.auditFinding.count({ where: { auditId } });
    const findingNumber = `F-${String(count + 1).padStart(3, "0")}`;

    // Compute basic risk score (severity × likelihood)
    const severityScore: Record<string, number> = { CRITICAL: 100, HIGH: 75, MEDIUM: 50, LOW: 25, INFORMATIONAL: 5 };
    const likelihoodScore: Record<string, number> = { high: 1.0, medium: 0.6, low: 0.3 };
    const riskScore = Math.min(
      100,
      (severityScore[parsed.data.severity] ?? 50) *
      (likelihoodScore[parsed.data.likelihood ?? "medium"] ?? 0.6)
    );

    // Convert regulatoryRef string → controlRefs array
    const { regulatoryRef, ...findingData } = parsed.data;
    const controlRefs = regulatoryRef
      ? regulatoryRef.split(",").map((s) => s.trim()).filter(Boolean)
      : (parsed.data.controlRefs ?? []);

    const finding = await db.auditFinding.create({
      data: {
        ...findingData,
        controlRefs,
        auditId,
        findingNumber,
        riskScore,
        status: "OPEN",
      },
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: "audit.finding.created", entityType: "AuditFinding",
      entityId: finding.id, entityLabel: finding.title,
      afterData: finding, auditId, clientId: audit.clientId,
    });

    // Notify audit team members about HIGH/CRITICAL findings (fire-and-forget)
    if (["CRITICAL", "HIGH"].includes(finding.severity)) {
      db.auditMember.findMany({
        where: { auditId },
        include: { user: { select: { email: true, firstName: true } } },
      }).then((members) => {
        members.forEach(({ user: member }) => {
          sendFindingAlert({
            to: member.email,
            firstName: member.firstName,
            findingTitle: finding.title,
            severity: finding.severity,
            auditName: audit.name,
            auditId,
            findingId: finding.id,
          }).catch(() => {});
        });
      }).catch(() => {});

      // Also post to Microsoft Teams if configured
      sendTeamsFindingAlert({
        orgId: user.orgId,
        findingTitle: finding.title,
        severity: finding.severity,
        auditName: audit.name,
        auditId,
        findingId: finding.id,
      }).catch(() => {});
    }

    return created(finding);
  } catch (e) { return serverError(e); }
}
