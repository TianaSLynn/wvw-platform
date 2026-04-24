/**
 * POST /api/admin/seed-templates
 * Seeds global framework audit templates into the database.
 * Idempotent — skips templates that already exist by their stable ID.
 * Only accessible to SUPER_ADMIN or ADMIN roles.
 */
import { db } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { FRAMEWORK_TEMPLATES } from "@/lib/framework-templates";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) return unauthorized();

    const results: { id: string; name: string; action: "created" | "skipped" }[] = [];

    for (const tpl of FRAMEWORK_TEMPLATES) {
      // Check if already seeded (by stable ID)
      const existing = await db.auditTemplate.findUnique({ where: { id: tpl.id } });
      if (existing) {
        results.push({ id: tpl.id, name: tpl.name, action: "skipped" });
        continue;
      }

      await db.auditTemplate.create({
        data: {
          id:          tpl.id,
          orgId:       null,          // global — no org owner
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

    return ok({
      seeded:  results.filter(r => r.action === "created").length,
      skipped: results.filter(r => r.action === "skipped").length,
      results,
    });
  } catch (e) { return serverError(e); }
}
