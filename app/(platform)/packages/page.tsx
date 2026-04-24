import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Layers, Plus, BookOpen, ClipboardList, ExternalLink, Tag, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Package Catalog" };

const CATEGORY_COLORS: Record<string, string> = {
  "Culture Audit":      "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "HR Compliance":      "bg-green-500/10 text-green-600 border-green-500/20",
  "Leadership":         "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "DEI & Inclusion":    "bg-rose-500/10 text-rose-600 border-rose-500/20",
  "Wellness":           "bg-sage/20 text-sage border-sage/30",
  "IT & Cybersecurity": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Risk Management":    "bg-red-500/10 text-red-600 border-red-500/20",
};

export default async function PackagesPage() {
  const user = await requireUser();
  const canAdmin = ["SUPER_ADMIN", "ADMIN"].includes(user.role);

  const packages = await db.productPackage.findMany({
    where: {
      isActive: true,
      OR: [{ orgId: user.orgId }, { orgId: null }],
    },
    include: {
      auditTemplate: { select: { id: true, name: true, type: true } },
      _count: { select: { licenses: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  // Fetch courses for packages that have them
  const allCourseIds = [...new Set(packages.flatMap((p) => p.courseIds))];
  const courses = allCourseIds.length
    ? await db.course.findMany({
        where: { id: { in: allCourseIds } },
        select: { id: true, title: true, category: true },
      })
    : [];
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  const featured = packages.filter((p) => p.isFeatured);
  const all = packages.filter((p) => !p.isFeatured);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Package Catalog"
        subtitle="Audit templates, training courses, and Notion trackers — bundled into licensable packages"
        icon={Layers}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
        actions={
          canAdmin ? (
            <Link href="/packages/new" className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              Build Package
            </Link>
          ) : null
        }
      />

      {packages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Layers size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground">No packages yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
            Packages bundle your audit templates, training courses, and Notion trackers into licensable products you can sell to clients.
          </p>
          {canAdmin && (
            <Link href="/packages/new" className="btn-primary mt-4 text-xs flex items-center gap-1.5 mx-auto">
              <Plus size={13} />
              Create First Package
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Featured packages */}
          {featured.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">Featured</span>
                <span className="text-xs text-muted-foreground">{featured.length} packages</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 stagger-children">
                {featured.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} courseMap={courseMap} isFeatured canAdmin={canAdmin} orgId={user.orgId} />
                ))}
              </div>
            </section>
          )}

          {/* All packages */}
          {all.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Layers size={14} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">All Packages</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{all.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
                {all.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} courseMap={courseMap} canAdmin={canAdmin} orgId={user.orgId} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Info banner */}
      <div className="section-card p-5 bg-navy-900/5 border-navy-900/20 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-navy-900/10 border border-navy-900/20 flex items-center justify-center flex-shrink-0">
          <Layers size={16} className="text-navy-900 dark:text-white/60" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-1">How Packages Work</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Each package combines an <strong>audit template</strong> (the diagnostic), <strong>training courses</strong> (the education), and a <strong>Notion tracker</strong> (the implementation tool).
            Build a package once, then license it to clients — giving them everything they need to run the audit, train their team, and track progress.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Package Card ───────────────────────────────────────────────────────────────

type PkgData = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  audience: string | null;
  duration: string | null;
  auditTemplateId: string | null;
  auditTemplate: { id: string; name: string; type: string } | null;
  courseIds: string[];
  notionUrl: string | null;
  notionLabel: string | null;
  pricePerUse: number | null;
  priceMonthly: number | null;
  orgId: string | null;
  _count: { licenses: number };
};

function PackageCard({
  pkg,
  courseMap,
  isFeatured,
  canAdmin,
  orgId,
}: {
  pkg: PkgData;
  courseMap: Record<string, { id: string; title: string; category: string }>;
  isFeatured?: boolean;
  canAdmin: boolean;
  orgId: string;
}) {
  const categoryColor = pkg.category ? (CATEGORY_COLORS[pkg.category] ?? "bg-muted text-muted-foreground border-border") : "bg-muted text-muted-foreground border-border";
  const pkgCourses = pkg.courseIds.map((id) => courseMap[id]).filter(Boolean);
  const isGlobal = pkg.orgId === null;

  const price = pkg.pricePerUse
    ? `$${pkg.pricePerUse.toLocaleString()} / use`
    : pkg.priceMonthly
    ? `$${pkg.priceMonthly.toLocaleString()} / mo`
    : null;

  return (
    <div className={cn(
      "section-card flex flex-col",
      isFeatured && "border-gold/30 bg-gold/5"
    )}>
      <div className="p-5 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {pkg.category && (
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md border", categoryColor)}>
                {pkg.category}
              </span>
            )}
            {isGlobal && (
              <span className="text-[10px] font-medium bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                WVW Global
              </span>
            )}
          </div>
          {price && <span className="text-xs font-semibold text-gold flex-shrink-0">{price}</span>}
        </div>

        {/* Name + tagline */}
        <h3 className="font-semibold text-foreground text-sm mb-1">{pkg.name}</h3>
        {pkg.tagline && <p className="text-xs text-gold font-medium mb-2">{pkg.tagline}</p>}
        {pkg.description && (
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{pkg.description}</p>
        )}

        {/* What's included */}
        <div className="space-y-1.5 mb-4">
          {pkg.auditTemplate && (
            <div className="flex items-center gap-2 text-xs">
              <ClipboardList size={11} className="text-blue-500 flex-shrink-0" />
              <span className="text-muted-foreground">Audit:</span>
              <span className="font-medium text-foreground truncate">{pkg.auditTemplate.name}</span>
            </div>
          )}
          {pkgCourses.filter(Boolean).map((c) => c && (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              <BookOpen size={11} className="text-sage flex-shrink-0" />
              <span className="text-muted-foreground">Course:</span>
              <span className="font-medium text-foreground truncate">{c.title}</span>
            </div>
          ))}
          {pkg.notionUrl && (
            <div className="flex items-center gap-2 text-xs">
              <Tag size={11} className="text-purple-500 flex-shrink-0" />
              <span className="text-muted-foreground">Tracker:</span>
              <a href={pkg.notionUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-purple-600 hover:text-purple-700 flex items-center gap-0.5 truncate">
                {pkg.notionLabel ?? "Notion Tracker"}
                <ExternalLink size={9} className="flex-shrink-0" />
              </a>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {pkg.duration && <span>⏱ {pkg.duration}</span>}
          {pkg.audience && (
            <span className="flex items-center gap-1">
              <Users size={10} />
              {pkg.audience}
            </span>
          )}
          {pkg._count.licenses > 0 && (
            <span className="text-gold">{pkg._count.licenses}× licensed</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <Link
          href={`/packages/${pkg.id}`}
          className="flex-1 btn-gold text-xs py-2 flex items-center justify-center gap-1.5"
        >
          View Package
        </Link>
        {canAdmin && (
          <Link
            href={`/packages/${pkg.id}/edit`}
            className="btn-ghost text-xs py-2 px-3"
          >
            Edit
          </Link>
        )}
      </div>
    </div>
  );
}
