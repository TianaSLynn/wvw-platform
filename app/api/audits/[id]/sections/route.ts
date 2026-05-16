/**
 * POST /api/audits/[id]/sections
 * Add AI-generated, WVW-template, or manual sections + checklist items to an existing audit.
 * Accepts full WVW metadata on each item.
 */
import { db } from "@/lib/db";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const itemSchema = z.object({
  question:         z.string().min(1),
  guidance:         z.string().optional().nullable(),
  riskWeight:       z.number().default(1.0),
  isRequired:       z.boolean().default(false),
  evidenceRequired: z.boolean().default(false),
  // WVW Intelligence Engine metadata
  qId:             z.string().optional().nullable(),
  questionType:    z.string().optional().nullable(),
  reverseScored:   z.boolean().optional().nullable(),
  riskTag:         z.string().optional().nullable(),
  pathwayTriggers: z.array(z.string()).optional().default([]),
  industryTags:    z.array(z.string()).optional().default([]),
  scenarioOptions: z.unknown().optional().nullable(),
});

const sectionSchema = z.object({
  title:       z.string().min(1),
  description: z.string().optional().nullable(),
  items:       z.array(itemSchema),
});

const bodySchema = z.object({
  sections: z.array(sectionSchema),
  replace:  z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId } = await params;

    const audit = await db.audit.findFirst({ where: { id: auditId, orgId: user.orgId } });
    if (!audit) return notFound("Audit");

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { sections, replace } = parsed.data;
    if (sections.length === 0) return badRequest("No sections provided");

    const existing = await db.auditSection.findMany({
      where: { auditId },
      select: { sortOrder: true },
      orderBy: { sortOrder: "desc" },
      take: 1,
    });
    const startSort = replace ? 0 : (existing[0]?.sortOrder ?? -1) + 1;

    await db.$transaction(async (tx) => {
      if (replace) {
        await tx.auditSection.deleteMany({ where: { auditId } });
      }

      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si]!;
        await tx.auditSection.create({
          data: {
            auditId,
            title:       sec.title,
            description: sec.description ?? null,
            sortOrder:   startSort + si,
            checklistItems: {
              create: sec.items.map((item, ii) => ({
                question:         item.question,
                guidance:         item.guidance ?? null,
                riskWeight:       item.riskWeight,
                isRequired:       item.isRequired,
                evidenceRequired: item.evidenceRequired,
                sortOrder:        ii,
                // WVW metadata
                qId:             item.qId ?? null,
                questionType:    item.questionType ?? "Likert",
                reverseScored:   item.reverseScored ?? false,
                riskTag:         item.riskTag ?? null,
                pathwayTriggers: item.pathwayTriggers ?? [],
                industryTags:    item.industryTags ?? [],
                scenarioOptions: item.scenarioOptions != null
                  ? (item.scenarioOptions as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
              })),
            },
          },
        });
      }
    });

    const updated = await db.audit.findFirst({
      where: { id: auditId },
      include: {
        sections: {
          include: {
            checklistItems: {
              orderBy: { sortOrder: "asc" },
              include: { evidence: { select: { id: true, title: true, type: true } } },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
