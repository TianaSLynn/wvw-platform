import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { createClientAccountSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";
import { createOnboardingWorkflow } from "@/lib/onboarding-service";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const search    = searchParams.get("search") ?? "";
    const isActive  = searchParams.get("active");
    const industry  = searchParams.get("industry");

    const clients = await db.client.findMany({
      where: {
        orgId: user.orgId,
        deletedAt: null,
        ...(isActive !== null ? { isActive: isActive === "true" } : {}),
        ...(industry ? { industry } : {}),
        ...(search ? {
          OR: [
            { name:      { contains: search, mode: "insensitive" } },
            { legalName: { contains: search, mode: "insensitive" } },
            { industry:  { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      include: {
        contacts: { where: { isPrimary: true, deletedAt: null }, take: 1 },
        _count: { select: { projects: true, audits: true } },
      },
      orderBy: { name: "asc" },
      take: 500,
    });

    return ok(clients);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createClientAccountSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { primaryContact, onboardingContext, ...clientData } = parsed.data;
    const client = await db.client.create({
      data: {
        ...clientData,
        website: clientData.website || null,
        orgId: user.orgId,
        onboardedAt: null,
        contacts: {
          create: {
            ...primaryContact,
            phone: primaryContact.phone || null,
            title: primaryContact.title || null,
            department: primaryContact.department || null,
            isPrimary: true,
            isDecisionMaker: true,
          },
        },
      },
    });

    await logActivity({
      orgId: user.orgId,
      userId: user.id,
      action: "client.created",
      entityType: "Client",
      entityId: client.id,
      entityLabel: client.name,
      afterData: client,
      clientId: client.id,
    });

    const warnings: string[] = [];
    let onboardingWorkflowId: string | null = null;
    let initialAuditId: string | null = null;

    try {
      const workflow = await createOnboardingWorkflow({
        orgId: user.orgId,
        entityType: "CLIENT",
        clientId: client.id,
        type: "ONBOARDING",
        targetDate: onboardingContext.targetLaunchDate
          ? new Date(`${onboardingContext.targetLaunchDate}T12:00:00.000Z`)
          : null,
        notes: JSON.stringify(onboardingContext),
      });
      onboardingWorkflowId = workflow.id;
    } catch {
      warnings.push("Client account created, but the onboarding workflow needs attention.");
    }

    try {
      const templates = await db.auditTemplate.findMany({
        where: {
          isActive: true,
          isPublished: true,
          OR: [{ orgId: user.orgId }, { isGlobal: true }],
          name: { contains: "Organizational", mode: "insensitive" },
        },
        include: {
          sections: {
            include: { items: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
      const preferredNames = [
        "WVW Core Organizational Resilience & Culture Audit™",
        "Organizational Wellness Assessment",
        "Organizational Readiness Audit",
      ];
      const template = preferredNames
        .map((name) => templates.find((item) => item.name === name))
        .find(Boolean) ?? templates[0];

      const auditCount = await db.audit.count({ where: { orgId: user.orgId } });
      const audit = await db.audit.create({
        data: {
          orgId: user.orgId,
          clientId: client.id,
          templateId: template?.id,
          name: `${client.name} — Organizational Initial Audit`,
          code: `OIA-${new Date().getFullYear()}-${String(auditCount + 1).padStart(3, "0")}`,
          description: "The required first diagnostic for identifying organization-wide concerns, evidence gaps, strengths, risks, and recommended specialty audits.",
          type: "HR",
          status: "DRAFT",
          objectives: [onboardingContext.primaryGoal],
          tags: ["organizational-initial-audit", "client-onboarding"],
          customFields: {
            relationshipStage: onboardingContext.relationshipStage,
            knownConcerns: onboardingContext.knownConcerns ?? "",
            participantGroups: onboardingContext.participantGroups,
            accessibilityNeeds: onboardingContext.accessibilityNeeds ?? "",
            minimumAnonymousResponses: 5,
            anonymousCollection: true,
            collectionStatus: "LOCKED",
          },
          members: { create: { userId: user.id, role: "lead" } },
          sections: template ? {
            create: template.sections.map((section) => ({
              title: section.title,
              description: section.description,
              sortOrder: section.sortOrder,
              checklistItems: {
                create: section.items.map((item) => ({
                  question: item.question,
                  guidance: item.guidance,
                  riskWeight: item.riskWeight,
                  isRequired: item.isRequired,
                  evidenceRequired: item.evidenceRequired,
                  sortOrder: item.sortOrder,
                  qId: item.qId,
                  questionType: item.questionType,
                  reverseScored: item.reverseScored,
                  riskTag: item.riskTag,
                  pathwayTriggers: item.pathwayTriggers,
                  scenarioOptions: item.scenarioOptions === null
                    ? undefined
                    : item.scenarioOptions,
                })),
              },
            })),
          } : undefined,
        },
      });
      initialAuditId = audit.id;
    } catch {
      warnings.push("Client account created, but the Organizational Initial Audit needs attention.");
    }

    return created({ client, onboardingWorkflowId, initialAuditId, warnings });
  } catch (e) { return serverError(e); }
}
