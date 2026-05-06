import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import TemplateEditor from "./TemplateEditor";

export const metadata: Metadata = { title: "Edit Template" };

export default async function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user     = await requireUser();
  const { id }   = await params;

  const template = await db.auditTemplate.findFirst({
    where: { id, OR: [{ orgId: user.orgId }, { isGlobal: true }] },
    include: {
      sections: {
        include: {
          items: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!template) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Edit Template</h1>
        <p className="page-subtitle mt-0.5 text-muted-foreground">{template.name}</p>
      </div>
      <TemplateEditor template={template} userRole={user.role} />
    </div>
  );
}
