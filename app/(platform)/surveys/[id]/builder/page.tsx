import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SurveyBuilder } from "./SurveyBuilder";

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const survey = await db.survey.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      questions: { orderBy: { sortOrder: "asc" } },
      audit:     { select: { id: true, name: true } },
    },
  });

  if (!survey) return notFound();

  // Fetch audits for linking picker
  const audits = await db.audit.findMany({
    where: { orgId: user.orgId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <SurveyBuilder survey={JSON.parse(JSON.stringify(survey))} audits={audits} />;
}
