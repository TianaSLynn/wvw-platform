import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const user = await requireUser();

  const clients = await db.client.findMany({
    where: { orgId: user.orgId, deletedAt: null },
    include: {
      _count: { select: { projects: true, audits: true, contacts: true } },
      contacts: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} total clients`}
        actions={
          <Link href="/clients/new" className="btn-primary">
            <Plus size={14} />
            New Client
          </Link>
        }
      />

      {clients.length === 0 ? (
        <div className="section-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={24} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No clients yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first client to get started</p>
            <Link href="/clients/new" className="btn-primary text-xs px-3 py-2">
              <Plus size={13} /> Add Client
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
          {clients.map((client) => {
            const primaryContact = client.contacts[0];
            const health = client.healthScore;
            const initials = client.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="stat-card group block hover:border-gold/25 hover:-translate-y-1"
              >
                <div className="flex items-start gap-3 mb-4">
                  {client.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={client.logoUrl} alt={client.name} className="w-11 h-11 rounded-xl object-contain bg-muted flex-shrink-0 border border-border" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 border border-white/10 flex items-center justify-center flex-shrink-0 flex-shrink-0">
                      <span className="text-gold font-bold text-sm">{initials}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-gold transition-colors truncate">
                      {client.name}
                    </h3>
                    {client.industry && (
                      <p className="text-xs text-muted-foreground truncate">{client.industry}</p>
                    )}
                  </div>
                  <Badge variant={client.isActive ? "success" : "secondary"} size="sm">
                    {client.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {primaryContact && (
                  <p className="text-xs text-muted-foreground mb-3 truncate">
                    {primaryContact.firstName} {primaryContact.lastName}
                    {primaryContact.title && <span className="text-muted-foreground/60"> · {primaryContact.title}</span>}
                  </p>
                )}

                {/* Health score bar */}
                {health !== null && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">Health</span>
                      <span className={cn("font-semibold", health >= 70 ? "text-green-500" : health >= 40 ? "text-amber-500" : "text-red-500")}>
                        {health}%
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", health >= 70 ? "bg-green-500" : health >= 40 ? "bg-amber-500" : "bg-red-500")}
                        style={{ width: `${health}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-blue-400" />
                      {client._count.projects} projects
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-gold/60" />
                      {client._count.audits} audits
                    </span>
                  </div>
                  {client.onboardedAt && (
                    <p className="text-[10px] text-muted-foreground">
                      Since {formatDate(client.onboardedAt, "MMM yyyy")}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
