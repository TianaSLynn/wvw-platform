import { db } from "@/lib/db";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";
import { auditSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const status   = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const type     = searchParams.get("type");
    const search   = searchParams.get("search") ?? "";

    const audits = await db.audit.findMany({
      where: {
        orgId: user.orgId,
        ...(status ? { status: status as never } : {}),
        ...(clientId ? { clientId } : {}),
        ...(type ? { type: type as never } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          take: 4,
        },
        _count: { select: { findings: true, evidence: true, sections: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });

    return ok(audits);
  } catch (e) { return serverError(e); }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = auditSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    // Build sections from template if provided
    let sectionsData: {
      title: string; description?: string; sortOrder: number;
      checklistItems: { create: {
        question: string; guidance?: string; riskWeight: number; isRequired: boolean;
        evidenceRequired: boolean; sortOrder: number; qId?: string;
        questionType: string; reverseScored: boolean; riskTag?: string;
        pathwayTriggers: string[]; scenarioOptions?: object;
      }[] };
    }[] = [];

    if (parsed.data.templateId) {
      const template = await db.auditTemplate.findFirst({
        where: {
          id: parsed.data.templateId,
          OR: [{ orgId: user.orgId }, { isGlobal: true }],
        },
        include: { sections: { include: { items: true }, orderBy: { sortOrder: "asc" } } },
      });

      if (template) {
        sectionsData = template.sections.map((s) => ({
          title: s.title,
          description: s.description ?? undefined,
          sortOrder: s.sortOrder,
          checklistItems: {
            create: s.items.map((item) => ({
              question: item.question,
              guidance: item.guidance ?? undefined,
              riskWeight: item.riskWeight,
              isRequired: item.isRequired,
              evidenceRequired: item.evidenceRequired,
              sortOrder: item.sortOrder,
              qId: item.qId ?? undefined,
              questionType: item.questionType,
              reverseScored: item.reverseScored,
              riskTag: item.riskTag ?? undefined,
              pathwayTriggers: item.pathwayTriggers,
              scenarioOptions: item.scenarioOptions
                ? (item.scenarioOptions as object)
                : undefined,
            })),
          },
        }));
      }
    }

    // Generate audit code
    const auditCount = await db.audit.count({ where: { orgId: user.orgId } });
    const code = parsed.data.code || `AUD-${new Date().getFullYear()}-${String(auditCount + 1).padStart(3, "0")}`;

    const audit = await db.audit.create({
      data: {
        ...parsed.data,
        orgId: user.orgId,
        code,
        status: "DRAFT",
        members: { create: { userId: user.id, role: "lead" } },
        sections: { create: sectionsData },
      },
      include: { client: { select: { name: true } } },
    });

    await logActivity({
      orgId: user.orgId, userId: user.id,
      action: "audit.created", entityType: "Audit",
      entityId: audit.id, entityLabel: audit.name,
      afterData: audit, clientId: audit.clientId, auditId: audit.id,
    });

    return created(audit);
  } catch (e) { return serverError(e); }
}
