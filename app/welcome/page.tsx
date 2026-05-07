import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

type Props = { searchParams: Promise<{ invite?: string }> };

export default async function WelcomePage({ searchParams }: Props) {
  const user = await requireUser();
  const { invite } = await searchParams;

  if (invite) {
    const inv = await db.invite.findUnique({ where: { token: invite } });

    if (inv && !inv.acceptedAt && inv.expiresAt > new Date()) {
      await Promise.all([
        db.invite.update({
          where: { token: invite },
          data:  { acceptedAt: new Date() },
        }),
        db.user.update({
          where: { id: user.id },
          data:  { role: inv.role as UserRole, orgId: inv.orgId },
        }),
      ]);
    }
  }

  redirect("/dashboard");
}
