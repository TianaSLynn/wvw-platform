import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, GraduationCap, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function getTrainingStatus(passed: boolean | null, completedAt: Date | null, expiresAt: Date | null) {
  if (!completedAt) return { label: "Enrolled", color: "text-blue-500 bg-blue-500/10", icon: Clock };
  if (expiresAt && expiresAt < new Date()) return { label: "Expired", color: "text-muted-foreground bg-muted", icon: XCircle };
  if (passed === false) return { label: "Failed", color: "text-red-500 bg-red-500/10", icon: XCircle };
  return { label: "Completed", color: "text-green-500 bg-green-500/10", icon: CheckCircle2 };
}

export default async function TrainingPage() {
  const user = await requireUser();

  const records = await db.trainingRecord.findMany({
    where: { employee: { orgId: user.orgId } },
    include: {
      employee: { select: { firstName: true, lastName: true, title: true, department: true } },
    },
    orderBy: { completedAt: "desc" },
    take: 200,
  });

  const totalCompleted = records.filter((r) => r.completedAt && r.passed !== false).length;
  const totalPending   = records.filter((r) => !r.completedAt).length;
  const totalFailed    = records.filter((r) => r.passed === false || (r.expiresAt && r.expiresAt < new Date())).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/workforce" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Workforce
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <GraduationCap size={18} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Training Records</h1>
            <p className="text-xs text-muted-foreground">Employee training completions, enrollments, and certifications</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{totalCompleted}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">{totalPending}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Enrolled / Pending</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{totalFailed}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Failed / Expired</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="section-card">
          <div className="empty-state py-14">
            <div className="empty-state-icon"><GraduationCap size={22} className="text-muted-foreground" /></div>
            <p className="text-sm font-medium">No training records</p>
            <p className="text-xs text-muted-foreground mt-1">Training records will appear here once employees are enrolled in programs.</p>
          </div>
        </div>
      ) : (
        <div className="section-card overflow-hidden">
          <div className="section-card-header px-5 py-3.5">
            <h2 className="text-sm font-semibold">{records.length} Training Records</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Course</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Completed</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const status = getTrainingStatus(r.passed, r.completedAt, r.expiresAt);
                const Icon = status.icon;
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium text-sm">{r.employee.firstName} {r.employee.lastName}</div>
                      {r.employee.department && <div className="text-xs text-muted-foreground">{r.employee.department}</div>}
                    </td>
                    <td className="text-sm">{r.trainingName}</td>
                    <td className="text-xs text-muted-foreground">{r.provider ?? "—"}</td>
                    <td>
                      <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit", status.color)}>
                        <Icon size={10} /> {status.label}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
