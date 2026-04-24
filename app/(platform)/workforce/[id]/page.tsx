import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, Briefcase, Calendar,
  Mail, Phone, MapPin, GraduationCap, FileText, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:      "text-green-600 bg-green-500/10",
  ONBOARDING:  "text-blue-600 bg-blue-500/10",
  LEAVE:       "text-amber-600 bg-amber-500/10",
  CONTRACT:    "text-purple-600 bg-purple-500/10",
  TERMINATED:  "text-red-600 bg-red-500/10",
};

export default async function EmployeePage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const employee = await db.employee.findFirst({
    where: { id: params.id, orgId: user.orgId },
    include: {
      client:       { select: { id: true, name: true } },
      manager:      { select: { id: true, firstName: true, lastName: true, title: true } },
      directReports:{ select: { id: true, firstName: true, lastName: true, title: true }, take: 20 },
      trainingRecords: { orderBy: { completedAt: "desc" }, take: 20 },
      policyAcknowledgements: { orderBy: { acknowledgedAt: "desc" }, take: 20 },
    },
  });

  if (!employee) notFound();

  const statusColor = STATUS_COLORS[employee.employmentStatus] ?? "text-muted-foreground bg-muted";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/workforce" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Workforce
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-lg font-bold text-purple-600 flex-shrink-0">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {employee.title && <span className="text-sm text-muted-foreground">{employee.title}</span>}
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColor)}>
                {employee.employmentStatus.charAt(0) + employee.employmentStatus.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left column — details */}
        <div className="col-span-2 space-y-5">
          {/* Profile */}
          <div className="section-card p-5">
            <h2 className="text-sm font-semibold mb-4">Profile</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {employee.email && (
                <>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail size={11} /> Email</dt>
                  <dd className="text-sm">{employee.email}</dd>
                </>
              )}
              {employee.phone && (
                <>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone size={11} /> Phone</dt>
                  <dd className="text-sm">{employee.phone}</dd>
                </>
              )}
              {employee.department && (
                <>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 size={11} /> Department</dt>
                  <dd className="text-sm">{employee.department}</dd>
                </>
              )}
              {employee.level && (
                <>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Briefcase size={11} /> Level</dt>
                  <dd className="text-sm">{employee.level}</dd>
                </>
              )}
              {employee.location && (
                <>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin size={11} /> Location</dt>
                  <dd className="text-sm">{employee.location}</dd>
                </>
              )}
              {employee.startDate && (
                <>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar size={11} /> Start Date</dt>
                  <dd className="text-sm">{new Date(employee.startDate).toLocaleDateString()}</dd>
                </>
              )}
              <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Briefcase size={11} /> Type</dt>
              <dd className="text-sm capitalize">{employee.employmentType}</dd>
              {employee.client && (
                <>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 size={11} /> Client</dt>
                  <dd className="text-sm">
                    <Link href={`/clients/${employee.client.id}`} className="hover:text-gold transition-colors">
                      {employee.client.name}
                    </Link>
                  </dd>
                </>
              )}
            </dl>
          </div>

          {/* Training */}
          {employee.trainingRecords.length > 0 && (
            <div className="section-card overflow-hidden">
              <div className="section-card-header px-5 py-3.5 flex items-center gap-2">
                <GraduationCap size={14} className="text-blue-500" />
                <h2 className="text-sm font-semibold">Training ({employee.trainingRecords.length})</h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.trainingRecords.map((r) => {
                    const expired = r.expiresAt && r.expiresAt < new Date();
                    const statusLabel = !r.completedAt ? "Enrolled" : expired ? "Expired" : r.passed === false ? "Failed" : "Completed";
                    const statusColor = !r.completedAt ? "text-blue-600 bg-blue-500/10" : expired || r.passed === false ? "text-red-600 bg-red-500/10" : "text-green-600 bg-green-500/10";
                    return (
                      <tr key={r.id}>
                        <td>
                          <p className="text-sm font-medium">{r.trainingName}</p>
                          {r.provider && <p className="text-xs text-muted-foreground">{r.provider}</p>}
                        </td>
                        <td>
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColor)}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="text-xs text-muted-foreground">
                          {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Policy Acknowledgements */}
          {employee.policyAcknowledgements.length > 0 && (
            <div className="section-card overflow-hidden">
              <div className="section-card-header px-5 py-3.5 flex items-center gap-2">
                <FileText size={14} className="text-gold" />
                <h2 className="text-sm font-semibold">Policies ({employee.policyAcknowledgements.length})</h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.policyAcknowledgements.map((p) => (
                    <tr key={p.id}>
                      <td className="text-sm">{p.policyName}</td>
                      <td>
                        {p.acknowledgedAt ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                            <CheckCircle2 size={10} /> Acknowledged
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="text-xs text-muted-foreground">
                        {p.acknowledgedAt ? new Date(p.acknowledgedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Manager */}
          {employee.manager && (
            <div className="section-card p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Manager</h3>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-navy-900/10 flex items-center justify-center text-xs font-bold">
                  {employee.manager.firstName[0]}{employee.manager.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{employee.manager.firstName} {employee.manager.lastName}</p>
                  {employee.manager.title && <p className="text-xs text-muted-foreground">{employee.manager.title}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Direct Reports */}
          {employee.directReports.length > 0 && (
            <div className="section-card p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Direct Reports ({employee.directReports.length})
              </h3>
              <div className="space-y-2">
                {employee.directReports.map((r) => (
                  <Link key={r.id} href={`/workforce/${r.id}`} className="flex items-center gap-2 hover:text-gold transition-colors">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {r.firstName[0]}{r.lastName[0]}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{r.firstName} {r.lastName}</p>
                      {r.title && <p className="text-[10px] text-muted-foreground">{r.title}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Neuroinclusion */}
          {(employee.isNeurodivergent || employee.hasAccommodation) && (
            <div className="section-card p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Neuroinclusion</h3>
              <div className="space-y-2 text-xs">
                {employee.isNeurodivergent && (
                  <p className="text-foreground/80">Neurodivergence disclosed</p>
                )}
                {employee.hasAccommodation && (
                  <>
                    <p className="text-foreground/80">Active accommodation in place</p>
                    {employee.accommodationNote && (
                      <p className="text-muted-foreground italic">{employee.accommodationNote}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
