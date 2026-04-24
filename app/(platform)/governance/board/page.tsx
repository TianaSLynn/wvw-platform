import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users, Mail, UserCog } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Board Members" };

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Managing Partner",
  ADMIN: "Administrator",
  PARTNER: "Partner",
  MANAGER: "Senior Manager",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-gold/10 text-gold border-gold/20",
  ADMIN: "bg-navy-900/10 text-navy-900 border-navy-900/20",
  PARTNER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default async function BoardPage() {
  const user = await requireUser();

  const boardMembers = await db.user.findMany({
    where: {
      orgId: user.orgId,
      role: { in: ["SUPER_ADMIN", "ADMIN", "PARTNER"] },
      status: "ACTIVE", deletedAt: null,
    },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      title: true,
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Board Directory"
        subtitle="Partners, administrators, and leadership team members"
        icon={Users}
        iconBg="bg-navy-900/10 border-navy-900/20"
        iconColor="text-navy-900"
        breadcrumbs={[{ label: "Governance", href: "/governance" }, { label: "Board Directory" }]}
        actions={
          <Link href="/settings/team" className="btn-ghost flex items-center gap-2">
            <UserCog size={15} />
            Manage Team
          </Link>
        }
      />

      {boardMembers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground">No board members found</p>
          <p className="text-xs text-muted-foreground mt-1">Add partners and admins through team settings</p>
          <Link href="/settings/team" className="btn-primary mt-4 text-xs">Manage Team</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {boardMembers.map((member) => (
            <div key={member.id} className="section-card p-5 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                  {member.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {member.firstName[0]}{member.lastName[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{member.firstName} {member.lastName}</h3>
                  {member.title && <p className="text-xs text-muted-foreground">{member.title}</p>}
                  <span className={cn("inline-block text-xs px-2 py-0.5 rounded-md border mt-1", ROLE_COLORS[member.role] ?? "bg-muted text-muted-foreground border-border")}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail size={12} />
                <span className="truncate">{member.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
