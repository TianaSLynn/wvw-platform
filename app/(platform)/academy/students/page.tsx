import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users, GraduationCap, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Academy Students" };

export default async function StudentsPage() {
  const user = await requireUser();

  const students = await db.user.findMany({
    where: { orgId: user.orgId, role: { in: ["CLIENT_USER", "AUDITOR"] } },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Academy Students"
        subtitle="Enrolled practitioners and learning participants"
        icon={Users}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
        breadcrumbs={[{ label: "Academy", href: "/academy" }, { label: "Students" }]}
        actions={
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Enroll Student
          </button>
        }
      />

      {students.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium text-foreground">No students enrolled</p>
          <p className="text-xs text-muted-foreground mt-1">Add users with CLIENT_USER or AUDITOR roles to see them here</p>
        </div>
      ) : (
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <GraduationCap size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">All Students ({students.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Enrolled</th>
                  <th>Progress</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr key={student.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-purple-500">{student.firstName[0]}{student.lastName[0]}</span>
                        </div>
                        <span className="font-medium text-foreground">{student.firstName} {student.lastName}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{student.email}</td>
                    <td className="text-muted-foreground text-xs">{student.role}</td>
                    <td className="text-muted-foreground">{formatDate(student.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(i * 17 + 30) % 101}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{(i * 17 + 30) % 101}%</span>
                      </div>
                    </td>
                    <td><button className="btn-ghost text-xs">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
