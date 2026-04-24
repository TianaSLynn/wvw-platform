import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Building2, Users, CheckCircle2, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClearDemoDataButton, DeleteEmployeeButton } from "./WorkforceActions";

export const metadata: Metadata = { title: "Workforce / HRIS" };

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE:      { label: "Active",      color: "text-green-600",  dot: "bg-green-500"  },
  LEAVE:       { label: "On Leave",    color: "text-amber-600",  dot: "bg-amber-500"  },
  TERMINATED:  { label: "Terminated",  color: "text-red-600",    dot: "bg-red-500"    },
  CONTRACT:    { label: "Contractor",  color: "text-blue-600",   dot: "bg-blue-500"   },
  ONBOARDING:  { label: "Onboarding",  color: "text-purple-600", dot: "bg-purple-500" },
};

export default async function WorkforcePage() {
  const user = await requireUser();

  const [employees, clientList] = await Promise.all([
    db.employee.findMany({
      where: { orgId: user.orgId },
      include: {
        client: { select: { name: true } },
        manager: { select: { firstName: true, lastName: true } },
        _count: { select: { directReports: true, trainingRecords: true, policyAcknowledgements: true } },
      },
      orderBy: [{ employmentStatus: "asc" }, { lastName: "asc" }],
    }),
    db.client.findMany({
      where: { orgId: user.orgId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const active = employees.filter((e) => e.employmentStatus === "ACTIVE");
  const onboarding = employees.filter((e) => e.employmentStatus === "ONBOARDING");
  const byDept = employees.reduce<Record<string, number>>((acc, e) => {
    const dept = e.department ?? "Unassigned";
    acc[dept] = (acc[dept] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Workforce Directory"
        subtitle="Client and organizational employee records, training, and policy tracking"
        icon={Building2}
        iconColor="text-purple-500"
        iconBg="bg-purple-500/10 border-purple-500/20"
        actions={
          <div className="flex items-center gap-2">
            <ClearDemoDataButton />
            <Link href="/workforce/new" className="btn-primary flex items-center gap-1.5">
              <Plus size={14} /> Add Employee
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Total Employees", value: employees.length, icon: Users, color: "text-blue-500" },
          { label: "Active", value: active.length, icon: CheckCircle2, color: "text-green-500" },
          { label: "Onboarding", value: onboarding.length, icon: Clock, color: "text-amber-500" },
          { label: "Departments", value: Object.keys(byDept).length, icon: Building2, color: "text-purple-500" },
        ].map((s) => (
          <div key={s.label} className="section-card p-4 flex items-center gap-3">
            <s.icon size={16} className={s.color} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Employee table */}
        <div className="xl:col-span-3 section-card">
          <div className="section-card-header flex items-center justify-between">
            <h2 className="font-semibold text-sm">All Employees</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{employees.length} records</span>
            </div>
          </div>
          {employees.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon"><Building2 size={22} className="text-muted-foreground" /></div>
              <p className="font-semibold text-sm">No employee records yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Add client employees to track training, policies, and workforce analytics.
              </p>
              <Link href="/workforce/new" className="btn-gold text-xs px-4 py-1.5">Add First Employee</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="hidden sm:table-cell">Title / Dept</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Client Org</th>
                    <th className="hidden lg:table-cell">Manager</th>
                    <th className="hidden lg:table-cell">Training</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const sc = STATUS_CONFIG[emp.employmentStatus] ?? STATUS_CONFIG.ACTIVE!;
                    return (
                      <tr key={emp.id} className="group">
                        <td>
                          <Link
                            href={`/workforce/${emp.id}`}
                            className="font-medium text-foreground hover:text-gold transition-colors animated-underline"
                          >
                            {emp.firstName} {emp.lastName}
                          </Link>
                          {emp.email && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{emp.email}</p>
                          )}
                        </td>
                        <td className="hidden sm:table-cell text-muted-foreground text-xs">
                          <span className="block">{emp.title ?? "—"}</span>
                          {emp.department && (
                            <span className="text-[10px] text-muted-foreground/70">{emp.department}</span>
                          )}
                        </td>
                        <td>
                          <span className={cn("status-pill border-transparent text-xs", sc.color)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="hidden md:table-cell text-muted-foreground text-xs">
                          {emp.client?.name ?? <span className="opacity-40">—</span>}
                        </td>
                        <td className="hidden lg:table-cell text-muted-foreground text-xs">
                          {emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : <span className="opacity-40">—</span>}
                        </td>
                        <td className="hidden lg:table-cell text-xs text-muted-foreground">
                          {emp._count.trainingRecords} completed
                        </td>
                        <td>
                          <DeleteEmployeeButton employeeId={emp.id} name={`${emp.firstName} ${emp.lastName}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* By department */}
          <div className="section-card">
            <div className="section-card-header">
              <h2 className="font-semibold text-sm">By Department</h2>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(byDept).length === 0 ? (
                <p className="text-xs text-muted-foreground">No data</p>
              ) : Object.entries(byDept)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium truncate">{dept}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* By client */}
          {clientList.length > 0 && (
            <div className="section-card">
              <div className="section-card-header">
                <h2 className="font-semibold text-sm">Filter by Client</h2>
              </div>
              <div className="p-4 space-y-2">
                {clientList.map((c) => {
                  const count = employees.filter((e) => e.clientId === c.id).length;
                  return (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <span className="text-foreground truncate">{c.name}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
