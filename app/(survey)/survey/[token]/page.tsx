import { notFound } from "next/navigation";
import { verifySurveyTokenDetails } from "@/lib/survey-token";
import { db } from "@/lib/db";
import SurveyClient from "./SurveyClient";
import type { Prisma } from "@prisma/client";
import { isAnonymousAudit } from "@/lib/audit-privacy";

export default async function SurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ participant?: string }>;
}) {
  const { token } = await params;
  await searchParams;
  const tokenDetails = verifySurveyTokenDetails(token);
  if (!tokenDetails) notFound();
  const { auditId, participantId } = tokenDetails;

  const audit = await db.audit.findFirst({
    where: { id: auditId, isPublicTokenActive: true, isLocked: false },
    select: {
      id: true, name: true, type: true, customFields: true,
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

  if (participantId) {
    const customFields = audit.customFields && typeof audit.customFields === "object" && !Array.isArray(audit.customFields)
      ? audit.customFields as Record<string, unknown> : {};
    const invites = Array.isArray(customFields.participantInvites)
      ? customFields.participantInvites as Array<Record<string, unknown>> : [];
    const index = invites.findIndex((item) => item.id === participantId);
    if (index >= 0 && invites[index]?.status === "INVITED") {
      const next = [...invites];
      next[index] = { ...next[index], status: "OPENED", openedAt: new Date().toISOString() };
      await db.audit.update({ where: { id: audit.id }, data: { customFields: { ...customFields, participantInvites: next } as Prisma.InputJsonValue } });
    }
  }

  const sections = audit.sections.filter((s) => s.checklistItems.length > 0);
  const totalQuestions = sections.reduce((s, sec) => s + sec.checklistItems.length, 0);

  const survey = {
    audit: {
      id: audit.id,
      name: audit.name,
      org: audit.org.name,
      client: audit.client?.name ?? null,
      anonymous: isAnonymousAudit(audit.customFields && typeof audit.customFields === "object" ? audit.customFields as Record<string, unknown> : null),
    },
    sections,
    totalQuestions,
  };

  return <SurveyClient survey={survey} token={token} />;
}
