import { notFound } from "next/navigation";
import { verifySurveyToken } from "@/lib/survey-token";
import { db } from "@/lib/db";
import SurveyClient from "./SurveyClient";

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const auditId = verifySurveyToken(token);
  if (!auditId) notFound();

  const audit = await db.audit.findFirst({
    where: { id: auditId },
    select: {
      id: true, name: true, type: true,
      client: { select: { name: true } },
      org: { select: { name: true } },
      sections: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true, title: true, sortOrder: true,
          checklistItems: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true, question: true, guidance: true,
              riskWeight: true, isRequired: true,
            },
          },
        },
      },
    },
  });

  if (!audit) notFound();

  const sections = audit.sections.filter((s) => s.checklistItems.length > 0);
  const totalQuestions = sections.reduce((s, sec) => s + sec.checklistItems.length, 0);

  const survey = {
    audit: {
      id: audit.id,
      name: audit.name,
      org: audit.org.name,
      client: audit.client?.name ?? null,
    },
    sections,
    totalQuestions,
  };

  return <SurveyClient survey={survey} token={token} />;
}
