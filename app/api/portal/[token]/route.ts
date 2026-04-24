import { db } from "@/lib/db";
import { ok, notFound, serverError, badRequest } from "@/lib/api-response";
import { verifyPortalToken } from "@/lib/portal-token";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const clientId = verifyPortalToken(token);
    if (!clientId) return badRequest("Invalid or expired portal link");

    const client = await db.client.findFirst({
      where: { id: clientId, isActive: true, deletedAt: null },
      select: {
        id: true, name: true, logoUrl: true, industry: true,
        org: { select: { name: true, logoUrl: true } },
        audits: {
          where: { status: { in: ["FIELDWORK", "REVIEW", "REPORTING", "COMPLETED"] } },
          select: {
            id: true, name: true, code: true, type: true, status: true,
            overallRiskScore: true, fieldworkStartDate: true, fieldworkEndDate: true,
            _count: { select: { findings: true, evidence: true } },
            findings: {
              where: { status: { in: ["OPEN", "IN_PROGRESS", "REMEDIATED"] } },
              select: { severity: true, status: true, title: true, findingNumber: true },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        invoices: {
          where: { status: { in: ["SENT", "OVERDUE", "PAID"] } },
          select: {
            id: true, invoiceNumber: true, status: true, total: true,
            dueDate: true, paidDate: true, issueDate: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!client) return notFound("Client");
    return ok(client);
  } catch (e) { return serverError(e); }
}
