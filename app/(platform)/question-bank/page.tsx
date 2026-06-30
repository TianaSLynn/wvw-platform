import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Library } from "lucide-react";
import QuestionBankClient from "./QuestionBankClient";

export const metadata: Metadata = { title: "Question Bank" };

export default async function QuestionBankPage() {
  const user = await requireUser();

  const [categories, items, wvwTemplates] = await Promise.all([
    db.questionBankCategory.findMany({
      where: { OR: [{ orgId: user.orgId }, { orgId: null }] },
      include: { _count: { select: { items: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.questionBankItem.findMany({
      where: { OR: [{ orgId: user.orgId }, { orgId: null }] },
      include: { category: true },
      orderBy: [{ categoryId: "asc" }, { question: "asc" }],
    }),
    db.auditTemplate.findMany({
      where: { isGlobal: true, isActive: true, name: { contains: "WVW" } },
      include: {
        sections: {
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true, question: true, guidance: true, riskWeight: true,
                qId: true, questionType: true, reverseScored: true,
                riskTag: true, pathwayTriggers: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Question Bank"
        subtitle="Central library of reusable audit questions and WVW Intelligence™ templates"
        icon={Library}
        iconBg="bg-terracotta/10 border-terracotta/20"
        iconColor="text-terracotta"
      />
      <QuestionBankClient
        initialCategories={categories}
        initialItems={items}
        wvwTemplates={wvwTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: t.type,
          sections: t.sections.map((s) => ({
            id: s.id,
            title: s.title,
            items: s.items,
          })),
        }))}
        userRole={user.role}
        orgId={user.orgId}
      />
    </div>
  );
}
