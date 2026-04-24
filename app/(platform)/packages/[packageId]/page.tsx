import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Layers, ClipboardList, BookOpen, Tag, ExternalLink, Users,
  CheckCircle2, Clock, ArrowRight, Plus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ packageId: string }> }): Promise<Metadata> {
  const { packageId } = await params;
  const pkg = await db.productPackage.findUnique({ where: { id: packageId }, select: { name: true } });
  return { title: pkg?.name ?? "Package" };
}

export default async function PackageDetailPage({ params }: { params: Promise<{ packageId: string }> }) {
  const { packageId } = await params;
  const user = await requireUser();
  const canAdmin = ["SUPER_ADMIN", "ADMIN"].includes(user.role);

  const pkg = await db.productPackage.findFirst({
    where: { id: packageId, OR: [{ orgId: user.orgId }, { orgId: null }] },
    include: {
      auditTemplate: {
        select: {
          id: true, name: true, type: true, description: true,
          sections: { select: { id: true, title: true, _count: { select: { items: true } } }, orderBy: { sortOrder: "asc" } },
        },
      },
      licenses: {
        include: { client: { select: { id: true, name: true } } },
        orderBy: { licensedAt: "desc" },
        take: 20,
      },
      _count: { select: { licenses: true } },
    },
  });

  if (!pkg) notFound();

  // Fetch linked courses
  const courses = pkg.courseIds.length
    ? await db.course.findMany({
        where: { id: { in: pkg.courseIds } },
        select: { id: true, title: true, category: true, duration: true, level: true, description: true },
      })
    : [];

  // Fetch org clients for licensing
  const clients = canAdmin
    ? await db.client.findMany({
        where: { orgId: user.orgId, isActive: true, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const price = pkg.pricePerUse
    ? `$${pkg.pricePerUse.toLocaleString()} / use`
    : pkg.priceMonthly
    ? `$${pkg.priceMonthly.toLocaleString()} / month`
    : "Contact for pricing";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={pkg.name}
        subtitle={pkg.tagline ?? pkg.description ?? "WVW Package"}
        icon={Layers}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
        breadcrumbs={[{ label: "Packages", href: "/packages" }, { label: pkg.name }]}
        actions={
          <div className="flex items-center gap-2">
            {canAdmin && (
              <Link href={`/packages/${pkg.id}/edit`} className="btn-ghost text-sm">
                Edit Package
              </Link>
            )}
            {pkg.auditTemplateId && (
              <Link href={`/audits/new?template=${pkg.auditTemplateId}`} className="btn-gold flex items-center gap-2 text-sm">
                <ClipboardList size={14} />
                Launch Audit
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Description */}
          {pkg.description && (
            <div className="section-card p-5">
              <p className="text-sm text-foreground leading-relaxed">{pkg.description}</p>
            </div>
          )}

          {/* What's included */}
          <div className="section-card">
            <div className="section-card-header flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />
              <h2 className="text-sm font-semibold">What&apos;s Included</h2>
            </div>
            <div className="divide-y divide-border">

              {/* Audit template */}
              {pkg.auditTemplate ? (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList size={15} className="text-blue-500" />
                    <h3 className="text-sm font-semibold text-foreground">Audit Template</h3>
                    <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full border border-blue-500/20">
                      {pkg.auditTemplate.type}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{pkg.auditTemplate.name}</p>
                  {pkg.auditTemplate.description && (
                    <p className="text-xs text-muted-foreground mb-3">{pkg.auditTemplate.description}</p>
                  )}
                  {pkg.auditTemplate.sections.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {pkg.auditTemplate.sections.map((s) => (
                        <div key={s.id} className="text-xs bg-muted/50 rounded-lg px-3 py-2">
                          <p className="font-medium text-foreground truncate">{s.title}</p>
                          <p className="text-muted-foreground">{s._count.items} items</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    href={`/audits/new?template=${pkg.auditTemplate.id}`}
                    className="mt-3 text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    Launch from this template <ArrowRight size={11} />
                  </Link>
                </div>
              ) : (
                <div className="px-5 py-4 flex items-center gap-3 text-muted-foreground">
                  <ClipboardList size={14} />
                  <p className="text-sm">No audit template included</p>
                </div>
              )}

              {/* Courses */}
              {courses.length > 0 && (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={15} className="text-sage" />
                    <h3 className="text-sm font-semibold text-foreground">Training Courses</h3>
                    <span className="text-xs text-muted-foreground">{courses.length}</span>
                  </div>
                  <div className="space-y-2">
                    {courses.map((c) => (
                      <div key={c.id} className="flex items-start gap-3 bg-sage/5 border border-sage/20 rounded-lg px-3 py-2.5">
                        <BookOpen size={13} className="text-sage flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.category}{c.duration ? ` · ${c.duration}` : ""} · {c.level}</p>
                        </div>
                        <Link href={`/academy/courses`} className="text-[10px] text-sage hover:text-sage/80 flex-shrink-0">
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notion tracker */}
              {pkg.notionUrl ? (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={15} className="text-purple-500" />
                    <h3 className="text-sm font-semibold text-foreground">Notion Tracker</h3>
                  </div>
                  <a
                    href={pkg.notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <ExternalLink size={13} />
                    {pkg.notionLabel ?? "Open Notion Tracker"}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clients use this tracker to implement recommendations from the audit
                  </p>
                </div>
              ) : (
                <div className="px-5 py-4 flex items-center gap-3 text-muted-foreground">
                  <Tag size={14} />
                  <p className="text-sm">No Notion tracker linked</p>
                </div>
              )}
            </div>
          </div>

          {/* Deliverables */}
          {pkg.deliverables.length > 0 && (
            <div className="section-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Deliverables</h3>
              <ul className="space-y-1.5">
                {pkg.deliverables.filter(Boolean).map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Package info */}
          <div className="section-card p-5 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Package Info</h3>
            {pkg.category && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">{pkg.category}</span>
              </div>
            )}
            {pkg.audience && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Audience</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Users size={10} /> {pkg.audience}
                </span>
              </div>
            )}
            {pkg.duration && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Clock size={10} /> {pkg.duration}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Price</span>
              <span className="font-semibold text-gold">{price}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Licensed</span>
              <span className="font-medium text-foreground">{pkg._count.licenses}× clients</span>
            </div>
          </div>

          {/* License to client */}
          {canAdmin && clients.length > 0 && (
            <LicenseForm packageId={pkg.id} clients={clients} />
          )}

          {/* Licenses */}
          {pkg.licenses.length > 0 && (
            <div className="section-card">
              <div className="section-card-header flex items-center gap-2">
                <Users size={14} className="text-muted-foreground" />
                <h3 className="text-xs font-semibold">Licensed To</h3>
              </div>
              <div className="divide-y divide-border">
                {pkg.licenses.map((lic) => (
                  <div key={lic.id} className="px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-foreground">{lic.client?.name ?? "Internal"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(lic.licensedAt).toLocaleDateString()}
                        {lic.expiresAt ? ` → ${new Date(lic.expiresAt).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      lic.status === "ACTIVE" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                    )}>
                      {lic.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── License Form (client component) ───────────────────────────────────────────
// Inlined as a server-safe stub — uses a small form action pattern

function LicenseForm({ packageId, clients }: { packageId: string; clients: { id: string; name: string }[] }) {
  return (
    <div className="section-card p-4 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">License to Client</h3>
      <form
        action={`/api/packages/${packageId}`}
        method="POST"
        className="space-y-2"
      >
        <select
          name="clientId"
          className="w-full h-8 px-2.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
        >
          <option value="">Select client…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className="btn-gold w-full text-xs py-1.5 flex items-center justify-center gap-1">
          <Plus size={12} />
          Add License
        </button>
      </form>
    </div>
  );
}
