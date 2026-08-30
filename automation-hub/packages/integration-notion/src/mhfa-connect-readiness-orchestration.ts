/**
 * AUTO-06 MHFA Connect Enrollment Readiness replacement (MHFA-CONNECT-01)
 * orchestration: the real Notion search-before-create calls. See
 * mhfa-connect-readiness.ts for the spec this implements and why it only
 * ever writes an internal queue item, never a customer-facing action.
 */

import { createPage, queryDatabaseLegacy, relationContainsFilter } from "./client.js";
import { readinessQueueItemProperties, type ReadyRegistration } from "./mhfa-connect-readiness.js";

// MHFA-02 | Learners & Registrations, confirmed live 2026-08-03 (docs/NOTION_MAPPING.md).
const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";
// MHFA-05 | Automation & Exception Queue, confirmed live 2026-08-03 (docs/NOTION_MAPPING.md).
const MHFA_05_DATABASE_ID = "0e62593f-c1df-4cb3-a156-284947e11d43";

// Non-terminal Status values on MHFA-05 -- an existing item in any of these
// still covers the registration, so a duplicate must not be created.
const OPEN_STATUSES = new Set(["Open", "In Progress", "Escalated"]);

export interface QueueItemResult {
  registrationCode: string;
  registrationPageId: string;
  action: "created" | "already_queued";
  queueItemPageId?: string;
  queueItemUrl?: string;
}

/**
 * Real live Payment Status/Seat Status/MHFA Connect Status options
 * confirmed via Notion fetch 2026-08-07 -- matches the real AUTO-06
 * trigger "Registration becomes Confirmed and Paid" plus "not yet
 * MHFA Connect-registered."
 */
export async function findReadyRegistrations(): Promise<ReadyRegistration[]> {
  const result = await queryDatabaseLegacy(MHFA_02_DATABASE_ID, {
    and: [
      { property: "Payment Status", status: { equals: "Paid" } },
      { property: "Seat Status", status: { equals: "Confirmed" } },
      { property: "MHFA Connect Status", status: { equals: "Not Registered" } },
    ],
  });
  return result.results
    .map((page): ReadyRegistration | null => {
      const props = page.properties as Record<string, any>;
      const registrationCode = props["Registration Code"]?.title?.[0]?.plain_text;
      const sessionRelations = props.Session?.relation as Array<{ id: string }> | undefined;
      if (!registrationCode) return null;
      const sessionPageId = sessionRelations?.[0]?.id;
      return sessionPageId ? { pageId: page.id, registrationCode, sessionPageId } : { pageId: page.id, registrationCode };
    })
    .filter((r): r is ReadyRegistration => r !== null);
}

async function hasOpenQueueItem(registrationPageId: string): Promise<boolean> {
  const result = await queryDatabaseLegacy(MHFA_05_DATABASE_ID, {
    and: [
      { property: "Exception Type", select: { equals: "Missing MHFA Connect Registration" } },
      relationContainsFilter("Registration", registrationPageId),
    ],
  });
  return result.results.some((page) => {
    const status = (page.properties as Record<string, any>).Status?.status?.name;
    return OPEN_STATUSES.has(status);
  });
}

/** Search-before-create per candidate: never queue the same registration twice while an open item already covers it. */
export async function ensureReadinessQueueItems(candidates: ReadyRegistration[], correlationIdFor: (registrationCode: string) => string): Promise<QueueItemResult[]> {
  const results: QueueItemResult[] = [];
  for (const reg of candidates) {
    const alreadyQueued = await hasOpenQueueItem(reg.pageId);
    if (alreadyQueued) {
      results.push({ registrationCode: reg.registrationCode, registrationPageId: reg.pageId, action: "already_queued" });
      continue;
    }
    const correlationId = correlationIdFor(reg.registrationCode);
    const page = await createPage(MHFA_05_DATABASE_ID, readinessQueueItemProperties(reg, correlationId));
    results.push({
      registrationCode: reg.registrationCode,
      registrationPageId: reg.pageId,
      action: "created",
      queueItemPageId: page.id,
      queueItemUrl: page.url,
    });
  }
  return results;
}
