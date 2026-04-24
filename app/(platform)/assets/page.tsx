import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Database, Upload, FileText, FileImage, File, Search } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Asset Registry" };

const TYPE_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
  PDF: { icon: FileText, color: "text-red-500" },
  SPREADSHEET: { icon: FileText, color: "text-green-500" },
  PRESENTATION: { icon: FileText, color: "text-amber-500" },
  IMAGE: { icon: FileImage, color: "text-blue-500" },
  WORD: { icon: FileText, color: "text-blue-600" },
  INTERVIEW_NOTE: { icon: FileText, color: "text-purple-500" },
};

const TYPE_LABELS: Record<string, string> = {
  PDF: "PDF",
  SPREADSHEET: "Spreadsheet",
  PRESENTATION: "Presentation",
  IMAGE: "Image",
  WORD: "Document",
  INTERVIEW_NOTE: "Interview Note",
  OTHER: "File",
};

export default async function AssetsPage() {
  const user = await requireUser();

  const documents = await db.document.findMany({
    where: { orgId: user.orgId },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by type
  const byType: Record<string, typeof documents> = {};
  for (const doc of documents) {
    const type = doc.category ?? "OTHER";
    if (!byType[type]) byType[type] = [];
    byType[type].push(doc);
  }

  const categories = Object.keys(byType).sort();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Asset Registry"
        subtitle="All documents, evidence files, and organizational assets"
        icon={Database}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
        actions={
          <button className="btn-primary flex items-center gap-2">
            <Upload size={16} />
            Upload Asset
          </button>
        }
      />

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input-base w-full pl-9" placeholder="Search assets..." />
        </div>
        <select className="input-base sm:w-48">
          <option>All Types</option>
          {categories.map(c => (
            <option key={c}>{TYPE_LABELS[c] ?? c}</option>
          ))}
        </select>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Database size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground">No assets yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload documents, evidence files, and other organizational assets</p>
          <button className="btn-primary mt-4 text-xs flex items-center gap-1">
            <Upload size={13} />
            Upload First Asset
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="section-card p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{documents.length}</p>
              <p className="text-xs text-muted-foreground">Total Assets</p>
            </div>
            {categories.slice(0, 3).map((cat) => (
              <div key={cat} className="section-card p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{(byType[cat] ?? []).length}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABELS[cat] ?? cat}s</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="section-card">
            <div className="section-card-header">
              <h2 className="text-sm font-semibold">All Assets</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Client</th>
                    <th>Created By</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const typeConfig = TYPE_ICONS[doc.category ?? ""] ?? { icon: File, color: "text-muted-foreground" };
                    const DocIcon = typeConfig.icon;
                    return (
                      <tr key={doc.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <DocIcon size={14} className={cn("flex-shrink-0", typeConfig.color)} />
                            <span className="font-medium text-foreground truncate max-w-[200px]">{doc.title}</span>
                          </div>
                        </td>
                        <td className="text-muted-foreground">{TYPE_LABELS[doc.category ?? ""] ?? "File"}</td>
                        <td className="text-muted-foreground">{doc.client?.name ?? "—"}</td>
                        <td className="text-muted-foreground">
                          {doc.createdBy ? `${doc.createdBy.firstName} ${doc.createdBy.lastName}` : "—"}
                        </td>
                        <td className="text-muted-foreground">{formatDate(doc.createdAt)}</td>
                        <td>
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs">
                              View
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
