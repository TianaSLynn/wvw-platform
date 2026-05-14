/**
 * Marks evidenceRequired=true on AuditTemplateItems whose question text
 * contains keywords that strongly imply documentary evidence is needed.
 * Then propagates to existing AuditChecklistItems created from those templates
 * (matched by question text, since templateItemId may not always be stored).
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const EVIDENCE_KEYWORDS = [
  "document", "policy", "policies", "written", "handbook",
  "acknowledg", "certif", "record", "retain", "signed",
  "approval", "approved", "verif", "background check",
  "license", "permit", "contract", "agreement", "log",
  "report", "audit trail", "evidence", "proof", "form",
  "training record", "inspection", "attestation",
];

function requiresEvidence(question: string): boolean {
  const q = question.toLowerCase();
  return EVIDENCE_KEYWORDS.some(kw => q.includes(kw));
}

async function main() {
  // 1. Fetch all template items
  const templateItems = await db.auditTemplateItem.findMany({
    select: { id: true, question: true, evidenceRequired: true },
  });

  const toMark = templateItems.filter(i => requiresEvidence(i.question));
  const toUnmark = templateItems.filter(i => !requiresEvidence(i.question) && i.evidenceRequired);

  console.log(`Total template items: ${templateItems.length}`);
  console.log(`Marking evidenceRequired=true: ${toMark.length}`);
  console.log(`Unmarking (already false, skip): ${toUnmark.length}`);

  // Update template items
  if (toMark.length > 0) {
    await db.auditTemplateItem.updateMany({
      where: { id: { in: toMark.map(i => i.id) } },
      data: { evidenceRequired: true },
    });
    console.log(`✓ Updated ${toMark.length} template items`);
  }

  // 2. Propagate to existing checklist items by matching question text
  const markedQuestions = toMark.map(i => i.question);

  if (markedQuestions.length > 0) {
    const result = await db.auditChecklistItem.updateMany({
      where: {
        question: { in: markedQuestions },
        evidenceRequired: false,
      },
      data: { evidenceRequired: true },
    });
    console.log(`✓ Propagated to ${result.count} existing checklist items`);
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
