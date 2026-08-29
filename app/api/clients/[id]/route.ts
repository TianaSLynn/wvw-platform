import { db } from "@/lib/db";
import { ok, noContent, unauthorized, notFound, forbidden, serverError, badRequest } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { clientSchema, contactSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

async function getClient(id: string, orgId: string) {
  return db.client.findFirst({ where: { id, orgId, deletedAt: null } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const client = await db.client.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null },
      include: {
        contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { firstName: "asc" }] },
        projects: {
          where: { deletedAt: null },
          include: { _count: { select: { tasks: true } } },
          orderBy: { createdAt: "desc" },
        },
        audits: {
          include: { _count: { select: { findings: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        invoices: {
          orderBy: { issueDate: "desc" },
          take: 10,
        },
        _count: { select: { projects: true, audits: true, contacts: true, invoices: true } },
      },
    });

    if (!client) return notFound("Client");
    return ok(client);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await getClient(id, user.orgId);
    if (!existing) return notFound("Client");

    const body = await req.json();
    const parsed = clientSchema.partial().extend({
      primaryContact: contactSchema.partial().optional(),
    }).safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { primaryContact, ...clientData } = parsed.data;
    const updated = await db.$transaction(async (tx) => {
      const client = await tx.client.update({
        where: { id },
        data: clientData,
      });

      if (primaryContact) {
        const existingContact = await tx.contact.findFirst({
          where: { clientId: id, isPrimary: true, deletedAt: null },
          select: { id: true },
        });
        if (existingContact) {
          await tx.contact.update({
            where: { id: existingContact.id },
            data: primaryContact,
          });
        } else if (primaryContact.firstName && primaryContact.lastName) {
          await tx.contact.create({
            data: {
              clientId: id,
              firstName: primaryContact.firstName,
              lastName: primaryContact.lastName,
              email: primaryContact.email || null,
              phone: primaryContact.phone || null,
              title: primaryContact.title || null,
              department: primaryContact.department || null,
              isPrimary: true,
              isDecisionMaker: true,
            },
          });
        }
      }

      return client;
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: "client.updated", entityType: "Client",
      entityId: id, entityLabel: updated.name,
      beforeData: existing, afterData: updated, clientId: id,
    });

    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["ADMIN", "SUPER_ADMIN", "PARTNER"].includes(user.role)) return forbidden();
    const { id } = await params;

    const existing = await getClient(id, user.orgId);
    if (!existing) return notFound("Client");

    await db.client.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: "client.deleted", entityType: "Client",
      entityId: id, entityLabel: existing.name, clientId: id,
    });

    return noContent();
  } catch (e) { return serverError(e); }
}
