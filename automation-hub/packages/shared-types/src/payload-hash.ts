import { createHash } from "node:crypto";

/**
 * Canonical payload hash used for duplicate detection. Keys are sorted so
 * field order in the submitted form never changes the hash.
 */
export function canonicalPayloadHash(payload: Record<string, unknown>): string {
  const sorted = sortKeysDeep(payload);
  return createHash("sha256").update(JSON.stringify(sorted)).digest("hex");
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}
