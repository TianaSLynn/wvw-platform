import { PrismaClient } from "@prisma/client";
import { WVW_STRUCTURAL_CARE_TEMPLATES } from "../lib/wvw-structural-care-templates";

const db = new PrismaClient();

async function main() {
  console.log(`Seeding ${WVW_STRUCTURAL_CARE_TEMPLATES.length} structural care & neuroinclusion audit templates...`);

  for (const tpl of WVW_STRUCTURAL_CARE_TEMPLATES) {
    // Upsert template by name (global, no orgId)
    const existing = await db.auditTemplate.findFirst({
      where: { name: tpl.name, isGlobal: true },
    });

    if (existing) {
      console.log(`  Skipping (already exists): ${tpl.name}`);
      continue;
    }

    await db.auditTemplate.create({
      data: {
        name:        tpl.name,
        description: tpl.description,
        type:        tpl.type,
        isPublished: true,
        isGlobal:    true,
        isActive:    true,
        sections: {
          create: tpl.sections.map((sec, si) => ({
            title:       sec.title,
            description: sec.description ?? null,
            sortOrder:   si,
            items: {
              create: sec.items.map((item, ii) => ({
                question:         item.question,
                guidance:         item.guidance ?? null,
                riskWeight:       item.riskWeight ?? 1.0,
                evidenceRequired: item.evidenceRequired ?? false,
                isRequired:       true,
                isActive:         true,
                sortOrder:        ii,
              })),
            },
          })),
        },
      },
    });

    const sectionCount = tpl.sections.length;
    const itemCount    = tpl.sections.reduce((s, sec) => s + sec.items.length, 0);
    console.log(`  ✓ ${tpl.name} — ${sectionCount} sections, ${itemCount} items`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
