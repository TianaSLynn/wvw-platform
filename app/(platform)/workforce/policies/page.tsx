import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function PoliciesPage() {
  const user = await requireUser();

  const acknowledgements = await db.policyAcknowledgement.findMany({
    where: { employee: { orgId: user.orgId } },
    include: {
      employee: { select: { firstName: true, lastName: true, department: true } },
    },
    orderBy: [{ acknowledgedAt: "desc" }],
    take: 200,
  });

  // Group by policy name
  const byPolicy = new Map<string, typeof acknowledgements>();
  for (const ack of acknowledgements) {
    const existing = byPolicy.get(ack.policyName) ?? [];
    existing.push(ack);
    byPolicy.set(ack.policyName, existing);
  }

  const policies = Array.from(byPolicy.entries()).map(([name, acks]) => ({
    name,
    acks,
    acknowledged: acks.filter((a) => a.acknowledgedAt).length,
    pending: acks.filter((a) => !a.acknowledgedAt).length,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/workforce" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Workforce
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <FileText size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Policy Acknowledgements</h1>
            <p className="text-xs text-muted-foreground">Track employee acknowledgement of organizational policies</p>
          </div>
        </div>
      </div>

      {policies.length === 0 ? (
        <div className="section-card">
          <div className="empty-state py-14">
            <div className="empty-state-icon"><FileText size={22} className="text-muted-foreground" /></div>
            <p className="text-sm font-medium">No policy acknowledgements</p>
            <p className="text-xs text-muted-foreground mt-1">
              Policy acknowledgement records will appear here once employees are assigned policies.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map(({ name, acks, acknowledged, pending }) => (
            <div key={name} className="section-card overflow-hidden">
              <div className="section-card-header px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gold" />
                  <h2 className="text-sm font-semibold">{name}</h2>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 size={11} /> {acknowledged} acknowledged
                  </span>
                  {pending > 0 && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Clock size={11} /> {pending} pending
                    </span>
                  )}
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Acknowledged</th>
                  </tr>
                </thead>
                <tbody>
                  {acks.map((ack) => (
                    <tr key={ack.id}>
                      <td className="text-sm font-medium">{ack.employee.firstName} {ack.employee.lastName}</td>
                      <td className="text-xs text-muted-foreground">{ack.employee.department ?? "—"}</td>
                      <td>
                        {ack.acknowledgedAt ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full w-fit">
                            <CheckCircle2 size={10} /> Acknowledged
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="text-xs text-muted-foreground">
                        {ack.acknowledgedAt ? new Date(ack.acknowledgedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
