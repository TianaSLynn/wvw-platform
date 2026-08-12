/**
 * Generates the learner-facing registration reference in the format
 * Tiána specified: MHFA-REG-YYYY-NNNN (e.g. MHFA-REG-2026-0047). This is
 * separate from "Registration Code" (MHFA-02's title field, which already
 * holds a different internal format) and separate from the correlation ID
 * (stored in Notes, per this hub's established pattern) -- this reference
 * is specifically the human-readable number a learner would quote back.
 *
 * KNOWN LIMITATION (documented, not silently hidden): this counts existing
 * references for the year and increments, which is not atomic. Two
 * registrations submitted at nearly the same instant could theoretically
 * be assigned the same number. Acceptable at current real submission
 * volume; would need a real atomic counter (e.g. a dedicated Postgres
 * sequence) if volume increases enough to matter.
 */
import { queryDatabaseLegacy } from "./client.js";

const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";
const REFERENCE_PATTERN = /^MHFA-REG-(\d{4})-(\d{4})$/;

/** Extracts the reference from wherever it's stored -- see storeRegistrationReference for why this is Notes-embedded, not a dedicated field. */
export function extractRegistrationReference(notes: string | undefined | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Registration Reference: (MHFA-REG-\d{4}-\d{4})/);
  return match ? match[1] : null;
}

export async function generateRegistrationReference(year: number = new Date().getUTCFullYear()): Promise<string> {
  // MHFA-02 has no dedicated "Registration Reference" property (same known
  // gap pattern as Correlation ID -- see docs/NOTION_MAPPING.md), so
  // existing references live in free-text Notes, same workaround already
  // established for correlation IDs and group-opportunity codes elsewhere
  // in this hub. Pulling every row's Notes to find the max is the only
  // honest way to count without inventing a Notion property.
  let highest = 0;
  let cursor: string | undefined;
  do {
    const result = await queryDatabaseLegacy(MHFA_02_DATABASE_ID, undefined, cursor);
    for (const page of result.results) {
      const notes = (page.properties as Record<string, any>).Notes?.rich_text?.[0]?.plain_text as string | undefined;
      const reference = extractRegistrationReference(notes);
      if (!reference) continue;
      const match = reference.match(REFERENCE_PATTERN);
      if (match && Number(match[1]) === year) {
        highest = Math.max(highest, Number(match[2]));
      }
    }
    cursor = result.has_more ? (result.next_cursor ?? undefined) : undefined;
  } while (cursor);

  const next = String(highest + 1).padStart(4, "0");
  return `MHFA-REG-${year}-${next}`;
}
