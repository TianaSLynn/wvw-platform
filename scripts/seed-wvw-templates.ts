/**
 * Standalone seed script — runs outside Next.js/Clerk.
 * Usage: npx tsx scripts/seed-wvw-templates.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { WVW_AUDIT_TEMPLATES } from "../lib/wvw-question-bank";

const db = new PrismaClient();

function wvwTemplateId(name: string): string {
  return "wvw-" + name
    .toLowerCase()
    .replace(/[™®]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function main() {
  console.log(`Seeding ${WVW_AUDIT_TEMPLATES.length} WVW templates…\n`);

  for (const tpl of WVW_AUDIT_TEMPLATES) {
    const id = wvwTemplateId(tpl.name);
    const existing = await db.auditTemplate.findUnique({ where: { id } });

    if (existing) {
      console.log(`  ⏭  SKIP  ${tpl.name}`);
      continue;
    }

    const questionCount = tpl.sections.reduce((n, s) => n + s.questions.length, 0);

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

    console.log(`  ✓  CREATED  ${tpl.name}  (${questionCount} questions)`);
  }

  // Verify
  const total = await db.auditTemplate.count({ where: { isGlobal: true, isPublished: true } });
  console.log(`\nDone. ${total} global templates in database.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
