import { db } from "@/lib/db";
import { ok, unauthorized, notFound, serverError, badRequest } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { sendInvoiceOverdueAlert } from "@/lib/email";
import { z } from "zod";

const updateSchema = z.object({
  status:  z.enum(["DRAFT","SENT","VIEWED","PARTIAL","PAID","OVERDUE","VOID","CANCELLED"]).optional(),
  notes:   z.string().optional(),
  terms:   z.string().optional(),
  paidDate: z.string().optional(),
  paymentMethod: z.enum(["BANK_TRANSFER","CHECK","CREDIT_CARD","ACH","WIRE","OTHER"]).optional(),
  paymentRef: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const invoice = await db.invoice.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        client:  { select: { id: true, name: true, billingAddress: true, billingEmail: true, taxId: true } },
        project: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: "asc" } },
        payments:  { orderBy: { date: "desc" } },
        timeEntries: { include: { user: { select: { firstName: true, lastName: true } } } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!invoice) return notFound("Invoice");
    return ok(invoice);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await db.invoice.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return notFound("Invoice");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const updated = await db.invoice.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.status === "PAID" ? { paidDate: new Date() } : {}),
      },
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: parsed.data.status
        ? `invoice.status.changed.${parsed.data.status.toLowerCase()}`
        : "invoice.updated",
      entityType: "Invoice", entityId: id,
      entityLabel: existing.invoiceNumber,
      beforeData: { status: existing.status },
      afterData: { status: parsed.data.status },
      clientId: existing.clientId,
    });

    // Notify admins when invoice becomes overdue (fire-and-forget)
    if (parsed.data.status === "OVERDUE" && existing.status !== "OVERDUE") {
      db.user.findMany({
        where: { orgId: user.orgId, role: { in: ["ADMIN", "SUPER_ADMIN", "PARTNER"] }, deletedAt: null },
        select: { email: true, firstName: true },
      }).then(async (admins) => {
        const client = existing.clientId
          ? await db.client.findUnique({ where: { id: existing.clientId }, select: { name: true } }).catch(() => null)
          : null;
        const total = Number(existing.total ?? 0);
        const amountStr = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total);
        const daysOverdue = existing.dueDate
          ? Math.max(1, Math.floor((Date.now() - new Date(existing.dueDate).getTime()) / 86400000))
          : 1;
        admins.forEach((admin) => {
          sendInvoiceOverdueAlert({
            to: admin.email,
            firstName: admin.firstName,
            clientName: client?.name ?? "Unknown Client",
            invoiceNumber: existing.invoiceNumber,
            amount: amountStr,
            daysOverdue,
            invoiceId: id,
          }).catch(() => {});
        });
      }).catch(() => {});
    }

    return ok(updated);
  } catch (e) { return serverError(e); }
}
