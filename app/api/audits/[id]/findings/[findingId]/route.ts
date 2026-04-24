import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, serverError, badRequest } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { findingSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { remediationSchema } from "@/lib/validations";

const statusSchema = z.object({
  status: z.enum(["OPEN","IN_PROGRESS","PENDING_EVIDENCE","REMEDIATED","ACCEPTED_RISK","CLOSED","REOPENED"]).optional(),
  managementResponse: z.string().optional(),
  resolvedAt: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; findingId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId, findingId } = await params;

    const audit = await db.audit.findFirst({ where: { id: auditId, orgId: user.orgId } });
    if (!audit) return notFound("Audit");

    const finding = await db.auditFinding.findFirst({
      where: { id: findingId, auditId },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, title: true } },
        evidence: {
          include: { uploadedBy: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        },
        remediationActions: {
          include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        },
      },
    });

    if (!finding) return notFound("Finding");
    return ok(finding);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; findingId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId, findingId } = await params;

    const audit = await db.audit.findFirst({ where: { id: auditId, orgId: user.orgId } });
    if (!audit) return notFound("Audit");

    const existing = await db.auditFinding.findFirst({ where: { id: findingId, auditId } });
    if (!existing) return notFound("Finding");

    const body = await req.json();

    // Support both full update and status-only update
    const fullParsed = findingSchema.partial().merge(statusSchema).safeParse(body);
    if (!fullParsed.success) return badRequest("Validation failed", fullParsed.error.flatten());

    // Strip non-DB fields and convert regulatoryRef → controlRefs if present
    const { regulatoryRef, ...updateData } = fullParsed.data;
    if (regulatoryRef !== undefined) {
      updateData.controlRefs = regulatoryRef
        ? regulatoryRef.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
    }

    const updated = await db.auditFinding.update({
      where: { id: findingId },
      data: {
        ...updateData,
        ...(fullParsed.data.status === "REMEDIATED" ? { resolvedAt: new Date() } : {}),
      },
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: fullParsed.data.status
        ? `audit.finding.status.${fullParsed.data.status.toLowerCase()}`
        : "audit.finding.updated",
      entityType: "AuditFinding", entityId: findingId,
      entityLabel: updated.title,
      beforeData: { status: existing.status },
      afterData: { status: updated.status },
      auditId, clientId: audit.clientId,
    });

    return ok(updated);
  } catch (e) { return serverError(e); }
}

// POST to create a remediation action on this finding
export async function POST(req: Request, { params }: { params: Promise<{ id: string; findingId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId, findingId } = await params;

    const audit = await db.audit.findFirst({ where: { id: auditId, orgId: user.orgId } });
    if (!audit) return notFound("Audit");

    const finding = await db.auditFinding.findFirst({ where: { id: findingId, auditId } });
    if (!finding) return notFound("Finding");

    const body = await req.json();
    const parsed = remediationSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const action = await db.remediationAction.create({
      data: {
        ...parsed.data,
        findingId,
        status: "TODO",
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      },
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: "audit.finding.remediation.created",
      entityType: "RemediationAction", entityId: action.id,
      entityLabel: action.title,
      auditId, clientId: audit.clientId,
    });

    return ok(action);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; findingId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId, findingId } = await params;

    const audit = await db.audit.findFirst({ where: { id: auditId, orgId: user.orgId } });
    if (!audit) return notFound("Audit");

    const finding = await db.auditFinding.findFirst({ where: { id: findingId, auditId } });
    if (!finding) return notFound("Finding");

    if (!["ADMIN","SUPER_ADMIN","PARTNER"].includes(user.role)) {
      return badRequest("Only admins can delete findings");
    }

    await db.auditFinding.delete({ where: { id: findingId } });
    return noContent();
  } catch (e) { return serverError(e); }
}
