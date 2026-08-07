/**
 * AUTO-12 Executive Dashboard Refresh replacement (MHFA-DASHBOARD-01) —
 * pure aggregation logic. Risk: Low per the live Automation Registry --
 * this is read-only reporting, not a write path.
 *
 * Real live spec confirmed via Notion 2026-08-07: "aggregate sessions,
 * seats, payments, readiness, attendance, certification, and exceptions;
 * update dashboard snapshot table; stamp Last Refreshed." The real build
 * sheet lists "dashboard snapshot destination" as a still-undefined
 * connection value -- no real destination table/database exists to write
 * to, and inventing one would mean creating new production schema without
 * Tiana's authorization (see docs/NOTION_MAPPING.md's Correlation ID
 * gap for the established precedent on that). Rather than invent a
 * destination, this computes the same aggregates live, on demand -- see
 * dashboard-snapshot.ts.
 */

export function countByField(values: Array<string | undefined>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = value ?? "(unset)";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function sum(values: Array<number | undefined>): number {
  return values.reduce((total: number, v) => total + (v ?? 0), 0);
}
