import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { invoiceSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const status   = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const invoices = await db.invoice.findMany({
      where: {
        orgId: user.orgId,
        ...(status ? { status: status as never } : {}),
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client:  { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count:  { select: { lineItems: true, payments: true } },
      },
      orderBy: { issueDate: "desc" },
    });

    return ok(invoices);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = invoiceSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    // Generate unique invoice number
    const lastInvoice = await db.invoice.findFirst({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });
    const lastNum = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.split("-").pop() ?? "0", 10)
      : 0;
    const invoiceNumber = generateInvoiceNumber("INV", lastNum);

    // Compute totals
    const { lineItems, taxRate, discountAmount, ...invoiceData } = parsed.data;
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount - (discountAmount ?? 0);

    const invoice = await db.invoice.create({
      data: {
        ...invoiceData,
        orgId: user.orgId,
        createdById: user.id,
        invoiceNumber,
        status: "DRAFT",
        subtotal,
        taxRate,
        taxAmount,
        discountAmount: discountAmount ?? 0,
        total,
        lineItems: {
          create: lineItems.map((item, i) => ({
            description: item.description,
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            amount:      item.quantity * item.unitPrice,
            taxable:     item.taxable,
            sortOrder:   i,
          })),
        },
      },
      include: { lineItems: true, client: { select: { name: true } } },
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: "invoice.created", entityType: "Invoice",
      entityId: invoice.id, entityLabel: invoice.invoiceNumber,
      afterData: { invoiceNumber, total }, clientId: invoice.clientId,
    });

    return created(invoice);
  } catch (e) { return serverError(e); }
}
