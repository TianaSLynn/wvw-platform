import { db } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api-response";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const invite = await db.invite.findUnique({
      where: { token },
    });

    if (!invite) return notFound("Invite not found");
    if (invite.expiresAt < new Date()) return notFound("Invite has expired");
    if (invite.acceptedAt) return notFound("Invite already used");

    return ok({
      email:      invite.email,
      role:       invite.role,
      inviteType: invite.inviteType,
      message:    invite.message,
      orgId:      invite.orgId,
    });
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const invite = await db.invite.findUnique({ where: { token } });

    if (!invite || invite.expiresAt < new Date() || invite.acceptedAt) {
      return notFound("Invalid or expired invite");
    }

    await db.invite.update({
      where: { token },
      data:  { acceptedAt: new Date() },
    });

    return ok({ accepted: true, role: invite.role, email: invite.email });
  } catch (e) { return serverError(e); }
}
