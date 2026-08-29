import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { contactSchema } from "@/lib/validations";
import { created, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: clientId } = await params;
    const client = await db.client.findFirst({ where: { id: clientId, orgId: user.orgId, deletedAt: null } });
    if (!client) return notFound("Client");

    const parsed = contactSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
    const data = parsed.data;
    const contact = await db.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.contact.updateMany({
          where: { clientId, isPrimary: true, deletedAt: null },
          data: { isPrimary: false },
        });
      }
      return tx.contact.create({
        data: {
          ...data,
          clientId,
          email: data.email || null,
          phone: data.phone || null,
          title: data.title || null,
          department: data.department || null,
        },
      });
    });

    await logActivity({
      orgId: user.orgId,
      userId: user.id,
      action: "client.contact_added",
      entityType: "Contact",
      entityId: contact.id,
      entityLabel: `${contact.firstName} ${contact.lastName}`,
      afterData: contact,
      clientId,
    });
    return created(contact);
  } catch (error) { return serverError(error); }
}
