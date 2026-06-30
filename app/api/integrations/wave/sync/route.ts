import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { InvoiceStatus } from "@prisma/client";

const WAVE_GQL = "https://gql.waveapps.com/graphql/public";

const INVOICES_QUERY = `
  query($businessId: ID!) {
    business(id: $businessId) {
      invoices(page: 1, pageSize: 50) {
        edges {
          node {
            id
            invoiceNumber
            title
            status
            total { value currency { code } }
            amountDue { value }
            amountPaid { value }
            dueDate
            createdAt
            customer { name }
          }
        }
      }
    }
  }
`;

const CUSTOMERS_QUERY = `
  query($businessId: ID!) {
    business(id: $businessId) {
      customers(page: 1, pageSize: 100) {
        edges {
          node {
            id
            name
            email
          }
        }
      }
    }
  }
`;

async function waveGql(token: string, query: string, variables: Record<string, unknown>) {
  const res = await fetch(WAVE_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Wave API error: ${res.status}`);
  const json = await res.json() as { data?: unknown; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors[0]!.message);
  return json.data;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const integration = await db.integration.findFirst({
    where: { orgId: user.orgId, slug: "wave" },
  });

  if (!integration || integration.status !== "ACTIVE") {
    return badRequest("Wave integration not configured. Go to Settings → Integrations → Wave to connect.");
  }

  const config = integration.config as Record<string, string>;
  const token = config["Full Access Token"] ?? config["token"];
  const businessId = config["Business ID"] ?? config["businessId"];

  if (!token || !businessId) {
    return badRequest("Wave integration is missing credentials. Please reconfigure it.");
  }

  try {
    const [invoiceData, customerData] = await Promise.all([
      waveGql(token, INVOICES_QUERY, { businessId }),
      waveGql(token, CUSTOMERS_QUERY, { businessId }),
    ]);

    type WaveInvoice = {
      id: string; invoiceNumber: string; title: string | null; status: string;
      total: { value: string }; amountDue: { value: string }; amountPaid: { value: string };
      dueDate: string | null; createdAt: string;
      customer: { name: string } | null;
    };
    type WaveCustomer = { id: string; name: string; email: string | null };

    const rawInvoices = (invoiceData as { business: { invoices: { edges: Array<{ node: WaveInvoice }> } } })
      .business.invoices.edges.map((e) => e.node);
    const rawCustomers = (customerData as { business: { customers: { edges: Array<{ node: WaveCustomer }> } } })
      .business.customers.edges.map((e) => e.node);

    // Map Wave status to WVW InvoiceStatus enum
    const mapStatus = (s: string): InvoiceStatus => {
      const m: Record<string, InvoiceStatus> = {
        PAID: InvoiceStatus.PAID,
        SENT: InvoiceStatus.SENT,
        OVERDUE: InvoiceStatus.OVERDUE,
        DRAFT: InvoiceStatus.DRAFT,
        SAVED: InvoiceStatus.DRAFT,
        VOID: InvoiceStatus.VOID,
      };
      return m[s.toUpperCase()] ?? InvoiceStatus.SENT;
    };

    let synced = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const inv of rawInvoices) {
      try {
        const waveRef = `wave-${inv.id}`;
        const existing = await db.invoice.findFirst({
          where: { orgId: user.orgId, invoiceNumber: waveRef },
        });
        if (existing) { skipped++; continue; }

        // Try to match client by customer name
        const clientName = inv.customer?.name ?? "Wave Customer";
        let client = await db.client.findFirst({
          where: { orgId: user.orgId, name: { contains: clientName, mode: "insensitive" }, isActive: true },
        });

        // Auto-create client if not found
        if (!client) {
          client = await db.client.create({
            data: { orgId: user.orgId, name: clientName, isActive: true },
          });
        }

        const total = parseFloat(inv.total.value);
        await db.invoice.create({
          data: {
            orgId: user.orgId,
            clientId: client.id,
            createdById: user.id,
            invoiceNumber: waveRef,
            status: mapStatus(inv.status),
            subtotal: total,
            total,
            issueDate: inv.createdAt ? new Date(inv.createdAt) : new Date(),
            dueDate: inv.dueDate ? new Date(inv.dueDate) : new Date(Date.now() + 30 * 86400000),
            paidDate: inv.status === "PAID" ? new Date(inv.createdAt) : null,
            notes: inv.title ? `Wave invoice: ${inv.title}` : "Imported from Wave Accounting",
          },
        });
        synced++;
      } catch (e) {
        errors.push(`Invoice ${inv.invoiceNumber}: ${(e as Error).message}`);
      }
    }

    await db.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return ok({
      synced,
      skipped,
      customers: rawCustomers.length,
      errors,
      message: `Synced ${synced} invoices from Wave (${skipped} already existed).`,
    });
  } catch (e) {
    console.error("[Wave Sync Error]", e);
    return serverError("Wave sync failed: " + (e as Error).message);
  }
}

// GET — return Wave sync status and last sync time
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const integration = await db.integration.findFirst({
    where: { orgId: user.orgId, slug: "wave" },
    select: { id: true, status: true, lastSyncAt: true },
  });

  return ok({
    connected: integration?.status === "ACTIVE",
    lastSyncAt: integration?.lastSyncAt ?? null,
  });
}
