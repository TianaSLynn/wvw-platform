/**
 * POST /api/admin/seed-templates
 * Seeds global framework + WVW Intelligence Engine™ audit templates.
 * Idempotent — skips templates that already exist by their stable ID.
 * Only accessible to SUPER_ADMIN or ADMIN roles.
 *
 * Body (optional): { wvwOnly: boolean } — seed only WVW templates
 */
import { db } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { FRAMEWORK_TEMPLATES } from "@/lib/framework-templates";
import { WVW_AUDIT_TEMPLATES } from "@/lib/wvw-question-bank";
import { Prisma } from "@prisma/client";

// Stable ID prefix for WVW templates so seeding is idempotent
function wvwTemplateId(name: string): string {
  return "wvw-" + name
    .toLowerCase()
    .replace(/[™®]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const wvwOnly = body.wvwOnly === true;

    const results: { id: string; name: string; action: "created" | "skipped" }[] = [];

    // ── 1. Legacy framework templates ────────────────────────────────────────
    if (!wvwOnly) {
      for (const tpl of FRAMEWORK_TEMPLATES) {
        const existing = await db.auditTemplate.findUnique({ where: { id: tpl.id } });
        if (existing) {
          results.push({ id: tpl.id, name: tpl.name, action: "skipped" });
          continue;
        }

        await db.auditTemplate.create({
          data: {
            id:          tpl.id,
            orgId:       null,
            name:        tpl.name,
            description: tpl.description,
            type:        tpl.type as never,
            isPublished: true,
            isGlobal:    true,
            sections: {
              create: tpl.sections.map((section, si) => ({
                title:       section.title,
                description: section.description ?? null,
                sortOrder:   si,
                items: {
                  create: section.items.map((item, ii) => ({
                    question:         item.question,
                    guidance:         item.guidance ?? null,
                    riskWeight:       item.riskWeight ?? 1.0,
                    isRequired:       item.isRequired ?? false,
                    evidenceRequired: false,
                    sortOrder:        ii,
                  })),
                },
              })),
            },
          },
        });

        results.push({ id: tpl.id, name: tpl.name, action: "created" });
      }
    }

    // ── 2. WVW Intelligence Engine™ templates ────────────────────────────────
    for (const tpl of WVW_AUDIT_TEMPLATES) {
      const id = wvwTemplateId(tpl.name);
      const existing = await db.auditTemplate.findUnique({ where: { id } });
      if (existing) {
        results.push({ id, name: tpl.name, action: "skipped" });
        continue;
      }

      await db.auditTemplate.create({
        data: {
          id,
          orgId:       null,
          name:        tpl.name,
          description: tpl.description,
          type:        tpl.auditType as never,
          version:     tpl.version,
          isPublished: true,
          isGlobal:    true,
          sections: {
            create: tpl.sections.map((section, si) => ({
              title:       section.title,
              description: section.description,
              sortOrder:   si,
              items: {
                create: section.questions.map((q, ii) => ({
                  qId:              q.qId,
                  question:         q.question,
                  guidance:         q.guidance,
                  questionType:     q.questionType,
                  reverseScored:    q.reverseScored,
                  riskWeight:       q.riskWeight,
                  riskTag:          q.riskTag,
                  pathwayTriggers:  q.pathwayTriggers,
                  industryTags:     q.industryTags,
                  isRequired:       q.isRequired,
                  evidenceRequired: q.evidenceRequired,
                  scenarioOptions:  q.scenarioOptions
                    ? (q.scenarioOptions as unknown as Prisma.InputJsonValue)
                    : Prisma.JsonNull,
                  sortOrder: ii,
                })),
              },
            })),
          },
        },
      });

      results.push({ id, name: tpl.name, action: "created" });
    }

    return ok({
      seeded:  results.filter(r => r.action === "created").length,
      skipped: results.filter(r => r.action === "skipped").length,
      results,
    });
  } catch (e) { return serverError(e); }
}
