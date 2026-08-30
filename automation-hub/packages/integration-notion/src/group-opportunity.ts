/**
 * MHFA-GRP-01 (AUTO-04) orchestration: FORM-MHFA-002 -> MHFA-03 |
 * Organizations & Group Opportunities.
 *
 * MHFA-03 is self-referential (see docs/NOTION_MAPPING.md /
 * mappers.ts) -- an Organization is just a row in the same table an
 * Opportunity lives in, referenced via the "Organization" relation
 * property. As of 2026-08-07 MHFA-03 has zero records of any kind, so
 * every real submission processed by this path is a genuine first-of-kind
 * write, not a duplicate -- but the search-before-create logic below still
 * runs unconditionally (governance rule: don't skip duplicate-detection
 * just because today's data happens to be empty; every future submission
 * for the same organization needs it).
 *
 * Three Notion writes/lookups per submission, in order:
 *   1. Find-or-create the Organization row in MHFA-03 (by exact name match
 *      on the title field).
 *   2. Find-or-create the Contact row in MHFA-02 (by exact email match --
 *      MHFA-02 already has real registrants, so a group contact who is
 *      ALSO a course registrant should resolve to their existing page
 *      rather than create a duplicate).
 *   3. Create the Opportunity row in MHFA-03, relating to both.
 *
 * If step 3 fails after 1 and 2 already succeeded, the Organization/Contact
 * rows are left in place rather than rolled back -- they're valid,
 * reusable records on their own (an org/contact existing without an
 * opportunity yet is not an inconsistent state), and the caller reports
 * exactly which step failed rather than claiming full success or silently
 * losing the partial write.
 */

import { createPage, queryDatabaseLegacy, titleFilter, emailFilter } from "./client.js";
import type { FormMhfa002 } from "../../validation/src/form-mhfa-002.schema.js";
import {
  organizationToNotionProperties,
  groupContactToNotionProperties,
  groupOpportunityToNotionProperties,
  splitContactName,
} from "./mappers.js";

// MHFA-03 | Organizations & Group Opportunities, confirmed live 2026-08-07 (docs/NOTION_MAPPING.md).
const MHFA_03_DATABASE_ID = "5506b2fa-95a9-4f9e-9cd1-e83947e5c294";
// MHFA-02 | Learners & Registrations, confirmed live 2026-08-03 (docs/NOTION_MAPPING.md).
const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";

export interface GroupOpportunityResult {
  organizationPageId: string;
  organizationCreated: boolean;
  contactPageId: string;
  contactCreated: boolean;
  opportunityPageId: string;
  opportunityUrl: string;
  opportunityCode: string;
}

async function findOrCreateOrganization(orgName: string, correlationId: string): Promise<{ pageId: string; created: boolean }> {
  const existing = await queryDatabaseLegacy(MHFA_03_DATABASE_ID, titleFilter("Opportunity Code", orgName));
  if (existing.results.length > 0) {
    return { pageId: existing.results[0].id, created: false };
  }
  const page = await createPage(MHFA_03_DATABASE_ID, organizationToNotionProperties({ name: orgName, correlationId }));
  return { pageId: page.id, created: true };
}

async function findOrCreateContact(
  contact: { firstName: string; lastName: string; email: string; phone?: string },
  organizationPageId: string,
  opportunityCode: string,
  correlationId: string
): Promise<{ pageId: string; created: boolean }> {
  const existing = await queryDatabaseLegacy(MHFA_02_DATABASE_ID, emailFilter("Email", contact.email));
  if (existing.results.length > 0) {
    // Deliberately not updated -- an existing registrant's record is not
    // overwritten just because they're also a group inquiry's contact.
    return { pageId: existing.results[0].id, created: false };
  }
  const page = await createPage(
    MHFA_02_DATABASE_ID,
    groupContactToNotionProperties({ ...contact, correlationId, organizationPageId, opportunityCode })
  );
  return { pageId: page.id, created: true };
}

function buildNotesExtra(data: FormMhfa002): string {
  const parts: string[] = [];
  if (data["organization-type"]) parts.push(`Organization type: ${data["organization-type"]}`);
  if (data["purchase-order-or-invoicing-needs"]) parts.push(`PO/invoicing needs: ${data["purchase-order-or-invoicing-needs"]}`);
  if (data["decision-timeline"]) parts.push(`Decision timeline: ${data["decision-timeline"]}`);
  if (data["funding-deadline"]) parts.push(`Funding deadline: ${data["funding-deadline"]}`);
  if (data["referral-source"]) parts.push(`Referral source: ${data["referral-source"]}`);
  if (data["additional-context"]) parts.push(`Additional context: ${data["additional-context"]}`);
  return parts.join("\n");
}

export async function createGroupOpportunity(data: FormMhfa002, correlationId: string): Promise<GroupOpportunityResult> {
  const ulid = correlationId.split("|").pop() ?? correlationId;
  const opportunityCode = `GRP-${ulid}`;

  const org = await findOrCreateOrganization(data.organization, correlationId);

  const { firstName, lastName } = splitContactName(data["contact-name"]);
  const contact = await findOrCreateContact(
    { firstName, lastName, email: data["work-email"], phone: data.phone },
    org.pageId,
    opportunityCode,
    correlationId
  );

  const opportunityPage = await createPage(
    MHFA_03_DATABASE_ID,
    groupOpportunityToNotionProperties({
      correlationId,
      opportunityCode,
      organizationPageId: org.pageId,
      contactPageId: contact.pageId,
      estimatedLearners: data["estimated-learner-count"],
      deliveryPreference: data["delivery-preference"],
      location: data["in-person-location"],
      preferredDate: data["preferred-date"],
      alternativeDate: data["alternative-date"],
      notesExtra: buildNotesExtra(data),
    })
  );

  return {
    organizationPageId: org.pageId,
    organizationCreated: org.created,
    contactPageId: contact.pageId,
    contactCreated: contact.created,
    opportunityPageId: opportunityPage.id,
    opportunityUrl: opportunityPage.url,
    opportunityCode,
  };
}
