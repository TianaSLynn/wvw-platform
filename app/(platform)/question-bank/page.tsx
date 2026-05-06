import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Library } from "lucide-react";
import QuestionBankClient from "./QuestionBankClient";

export const metadata: Metadata = { title: "Question Bank" };

export default async function QuestionBankPage() {
  const user = await requireUser();

  const [categories, items] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Question Bank"
        subtitle="Central library of reusable audit questions — pull any question into an audit template"
        icon={Library}
        iconBg="bg-terracotta/10 border-terracotta/20"
        iconColor="text-terracotta"
      />
      <QuestionBankClient
        initialCategories={categories}
        initialItems={items}
        userRole={user.role}
        orgId={user.orgId}
      />
    </div>
  );
}
