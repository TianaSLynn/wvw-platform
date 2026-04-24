/**
 * Seed WVW's 11 intervention pathways (P1-P11) into the database.
 * Run: npx tsx prisma/seed-pathways.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const WVW_PATHWAYS = [
  {
    slug: "psychological-safety",
    name: "Psychological Safety Foundation",
    description: "Establish baseline conditions where every employee can speak, question, and contribute without fear of retaliation or shame.",
    pathwayNumber: 1,
    priorityLevel: "critical-intervention",
    duration: "3-6 weeks",
    targetLevels: ["executive", "manager", "all-staff"],
    focusAreas: ["psychological-safety", "retaliation", "trust"],
    recommendedAuditSlugs: ["psychological-safety", "voice-inclusion"],
    sortOrder: 1,
  },
  {
    slug: "workload-sustainability",
    name: "Workload Sustainability & Burnout Prevention",
    description: "Identify and address structural overload conditions, unsustainable expectations, and systemic burnout risk before breakdown occurs.",
    pathwayNumber: 2,
    priorityLevel: "stabilization",
    duration: "4-8 weeks",
    targetLevels: ["manager", "hr-admin", "all-staff"],
    focusAreas: ["burnout", "workload", "retention"],
    recommendedAuditSlugs: ["burnout-workload", "employee-experience"],
    sortOrder: 2,
  },
  {
    slug: "voice-inclusion",
    name: "Voice & Inclusion Activation",
    description: "Remove structural and interpersonal barriers preventing underrepresented employees from contributing, leading, and being heard.",
    pathwayNumber: 3,
    priorityLevel: "critical-intervention",
    duration: "6-10 weeks",
    targetLevels: ["executive", "manager"],
    focusAreas: ["inclusion", "voice", "retaliation", "bias"],
    recommendedAuditSlugs: ["voice-inclusion", "dei-equity"],
    sortOrder: 3,
  },
  {
    slug: "leadership-alignment",
    name: "Leadership Trust & Alignment",
    description: "Rebuild trust between leadership and workforce through transparency, accountability, and consistent leadership behavior.",
    pathwayNumber: 4,
    priorityLevel: "stabilization",
    duration: "6-12 weeks",
    targetLevels: ["executive", "senior-manager"],
    focusAreas: ["leadership", "trust", "accountability", "communication"],
    recommendedAuditSlugs: ["leadership-effectiveness", "communication-clarity"],
    sortOrder: 4,
  },
  {
    slug: "dei-equity",
    name: "Equity, Belonging & DEI Systems",
    description: "Identify disparate outcomes by group identity and build structural equity into hiring, retention, performance, and recognition practices.",
    pathwayNumber: 5,
    priorityLevel: "growth",
    duration: "8-16 weeks",
    targetLevels: ["executive", "hr-admin"],
    focusAreas: ["equity", "inclusion", "bias", "belonging"],
    recommendedAuditSlugs: ["dei-equity", "voice-inclusion"],
    sortOrder: 5,
  },
  {
    slug: "communication-clarity",
    name: "Communication Clarity & Transparency",
    description: "Improve the flow, quality, and trust of internal communication across levels, reducing uncertainty, rumor, and disengagement.",
    pathwayNumber: 6,
    priorityLevel: "stabilization",
    duration: "3-6 weeks",
    targetLevels: ["manager", "all-staff"],
    focusAreas: ["communication", "transparency", "trust"],
    recommendedAuditSlugs: ["communication-clarity", "employee-experience"],
    sortOrder: 6,
  },
  {
    slug: "conflict-resolution",
    name: "Conflict Resolution & Repair",
    description: "Establish safe, fair, and functional pathways for surfacing and resolving interpersonal conflict before it becomes systemic dysfunction.",
    pathwayNumber: 7,
    priorityLevel: "critical-intervention",
    duration: "4-8 weeks",
    targetLevels: ["manager", "hr-admin"],
    focusAreas: ["conflict", "psychological-safety", "trust"],
    recommendedAuditSlugs: ["conflict-resolution", "psychological-safety"],
    sortOrder: 7,
  },
  {
    slug: "recognition-retention",
    name: "Recognition & Retention Architecture",
    description: "Design and activate meaningful recognition systems that reinforce belonging, performance, and loyalty across the full workforce.",
    pathwayNumber: 8,
    priorityLevel: "growth",
    duration: "4-8 weeks",
    targetLevels: ["manager", "hr-admin"],
    focusAreas: ["recognition", "retention", "engagement"],
    recommendedAuditSlugs: ["recognition-retention", "employee-experience"],
    sortOrder: 8,
  },
  {
    slug: "talent-pipeline",
    name: "Talent Pipeline & Internal Mobility",
    description: "Build clear, equitable pathways for internal advancement, skill development, and succession that reduce flight risk and increase motivation.",
    pathwayNumber: 9,
    priorityLevel: "growth",
    duration: "8-16 weeks",
    targetLevels: ["executive", "hr-admin"],
    focusAreas: ["pipeline", "retention", "equity"],
    recommendedAuditSlugs: ["talent-pipeline", "dei-equity"],
    sortOrder: 9,
  },
  {
    slug: "policy-compliance",
    name: "Policy & Compliance Integrity",
    description: "Audit and repair gaps in policy awareness, enforcement consistency, and compliance behavior that create liability and erode trust.",
    pathwayNumber: 10,
    priorityLevel: "stabilization",
    duration: "4-8 weeks",
    targetLevels: ["executive", "hr-admin", "manager"],
    focusAreas: ["compliance", "policy", "accountability"],
    recommendedAuditSlugs: ["policy-compliance", "leadership-effectiveness"],
    sortOrder: 10,
  },
  {
    slug: "neurodiversity-inclusion",
    name: "Neurodiversity & Cognitive Inclusion",
    description: "Create structures, processes, and norms that allow neurodivergent employees to contribute fully and safely without masking or disadvantage.",
    pathwayNumber: 11,
    priorityLevel: "critical-intervention",
    duration: "6-12 weeks",
    targetLevels: ["executive", "manager", "all-staff"],
    focusAreas: ["neurodiversity", "inclusion", "belonging", "psychological-safety"],
    recommendedAuditSlugs: ["neurodiversity-inclusion", "psychological-safety"],
    sortOrder: 11,
  },
];

async function main() {
  console.log("Seeding WVW pathways...");

  let created = 0;
  let updated = 0;

  for (const p of WVW_PATHWAYS) {
    const existing = await db.pathway.findUnique({ where: { slug: p.slug } });
    if (existing) {
      await db.pathway.update({ where: { slug: p.slug }, data: p });
      updated++;
    } else {
      await db.pathway.create({ data: { ...p, orgId: null } });
      created++;
    }
  }

  console.log(`Done: ${created} created, ${updated} updated. Total: ${WVW_PATHWAYS.length} pathways.`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
