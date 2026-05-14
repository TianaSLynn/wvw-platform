import { db } from "@/lib/db";
import { ok, unauthorized, notFound, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id: auditId } = await params;

    // Load audit + all evidence-required checklist items with their evidence
    const audit = await db.audit.findFirst({
      where: { id: auditId, orgId: user.orgId },
      select: {
        id: true,
        clientId: true,
        sections: {
          select: {
            id: true,
            title: true,
            checklistItems: {
              where: { evidenceRequired: true },
              select: {
                id: true,
                question: true,
                guidance: true,
                isRequired: true,
                response: true,
                isCompleted: true,
                sortOrder: true,
                evidence: {
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    fileUrl: true,
                    fileName: true,
                    fileSize: true,
                    collectedAt: true,
                    uploadedBy: { select: { firstName: true, lastName: true } },
                  },
                  orderBy: { collectedAt: "desc" },
                },
              },
              orderBy: { sortOrder: "asc" },
            },
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!audit) return notFound("Audit");

    // Full client profile
    const client = await db.client.findFirst({
      where: { id: audit.clientId, orgId: user.orgId },
      select: {
        id: true,
        name: true,
        legalName: true,
        industry: true,
        size: true,
        description: true,
        website: true,
      },
    });

    // Prior audits for this client (excluding current)
    const priorAudits = await db.audit.findMany({
      where: {
        clientId: audit.clientId,
        orgId: user.orgId,
        id: { not: auditId },
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        completedAt: true,
        _count: { select: { findings: true, evidence: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Filter to sections that have evidence-required items
    const sections = audit.sections
      .filter((s) => s.checklistItems.length > 0)
      .map((s) => ({
        id: s.id,
        title: s.title,
        items: s.checklistItems,
      }));

    const allItems = sections.flatMap((s) => s.items);
    const covered = allItems.filter((i) => i.evidence.length > 0).length;

    return ok({
      client,
      priorAudits,
      sections,
      summary: {
        total: allItems.length,
        covered,
        missing: allItems.length - covered,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
