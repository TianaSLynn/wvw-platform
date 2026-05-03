import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Briefcase, Edit, Clock, ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function StaffMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const member = await db.user.findFirst({
    where: { id, orgId: user.orgId, deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      title: true, department: true, role: true, status: true, bio: true,
      avatarUrl: true, createdAt: true,
      _count: { select: { timeEntries: true, auditAssignments: true } },
    },
  });

  if (!member) notFound();

  const canEdit = member.id === user.id || ["ADMIN", "SUPER_ADMIN"].includes(user.role);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/people/staff" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Staff
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-navy-900/10 border border-border flex items-center justify-center text-lg font-bold text-navy-900 flex-shrink-0">
              {member.firstName[0]}{member.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{member.firstName} {member.lastName}</h1>
              <div className="flex items-center gap-2 mt-1">
                {member.title && <span className="text-sm text-muted-foreground">{member.title}</span>}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold/10 text-amber-700 border border-gold/20">
                  {member.role.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>
          {canEdit && (
            <Link href={`/people/staff/${member.id}/edit`} className="btn-ghost flex items-center gap-1.5 text-xs">
              <Edit size={13} /> Edit
            </Link>
          )}
        </div>
      </div>

      <div className="section-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Contact & Details</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {member.email && (
            <>
              <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail size={11} /> Email</dt>
              <dd><a href={`mailto:${member.email}`} className="hover:text-gold transition-colors">{member.email}</a></dd>
            </>
          )}
          {member.phone && (
            <>
              <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone size={11} /> Phone</dt>
              <dd>{member.phone}</dd>
            </>
          )}
          {member.department && (
            <>
              <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Briefcase size={11} /> Department</dt>
              <dd>{member.department}</dd>
            </>
          )}
          <>
            <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock size={11} /> Joined</dt>
            <dd>{formatDate(member.createdAt)}</dd>
          </>
        </dl>
        {member.bio && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Bio</p>
            <p className="text-sm leading-relaxed">{member.bio}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ClipboardList size={14} className="text-gold" />
            <span className="text-xs text-muted-foreground">Audit Assignments</span>
          </div>
          <p className="text-3xl font-bold gradient-text-gold">{member._count.auditAssignments}</p>
        </div>
        <div className="stat-card text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock size={14} className="text-blue-500" />
            <span className="text-xs text-muted-foreground">Time Entries</span>
          </div>
          <p className="text-3xl font-bold text-blue-500">{member._count.timeEntries}</p>
        </div>
      </div>
    </div>
  );
}
