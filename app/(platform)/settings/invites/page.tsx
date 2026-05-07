import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Mail } from "lucide-react";
import InviteManager from "./InviteManager";

export const metadata: Metadata = { title: "Invites" };

export default async function InvitesPage() {
  const user = await requireUser();
  if (!["SUPER_ADMIN", "ADMIN", "PARTNER"].includes(user.role)) redirect("/dashboard");

  const [invites, clients] = await Promise.all([
    db.invite.findMany({
      where:   { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
    }),
    db.client.findMany({
      where:   { orgId: user.orgId, isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wvw-platform.vercel.app";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Invitations"
        subtitle="Invite team members, clients, and employees to the platform"
        icon={Mail}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
      />
      <InviteManager
        initialInvites={invites}
        clients={clients}
        baseUrl={baseUrl}
        orgId={user.orgId}
      />
    </div>
  );
}
