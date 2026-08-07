/**
 * Pure mapping functions between this hub's internal shapes and the REAL
 * live Notion property schema for MHFA-02 | Learners & Registrations,
 * confirmed 2026-08-03 (see docs/NOTION_MAPPING.md). No network calls here —
 * these are unit-testable without Notion credentials.
 */

export interface HubRegistration {
  correlationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mhfaConnectEmail?: string;
  registrationCode: string;
  paymentStatus: "pending" | "initiated" | "awaiting_verification" | "paid" | "failed" | "refunded";
  attendanceStatus?: string;
  accommodationRequested: boolean;
  sessionPageId?: string; // resolved MHFA-01 Notion page id, if known
  organizationPageId?: string; // resolved MHFA-03 Notion page id, if known
}

// Notion's real Payment Status options: Pending, Invoiced, Payment Review,
// Paid, Waived, Sponsored, Refunded. The hub's own enum doesn't map 1:1 —
// documented explicitly rather than guessing silently.
const PAYMENT_STATUS_MAP: Record<HubRegistration["paymentStatus"], string> = {
  pending: "Pending",
  initiated: "Payment Review",
  awaiting_verification: "Payment Review",
  paid: "Paid",
  refunded: "Refunded",
  // "failed" has no real Notion equivalent (no "Failed" option exists on the
  // live property) — mapped to Pending, with the real hub status preserved
  // in Notes so nothing is silently lost. A dedicated "Failed" option would
  // need to be added to the Notion schema by Tiána; not done here.
  failed: "Pending",
};

const CORRELATION_ID_PREFIX = "Correlation ID: ";

export function buildNotesWithCorrelationId(correlationId: string, existingNotes?: string, extra?: string): string {
  const lines = [`${CORRELATION_ID_PREFIX}${correlationId}`];
  if (extra) lines.push(extra);
  if (existingNotes) lines.push(existingNotes);
  return lines.join("\n");
}

export function extractCorrelationIdFromNotes(notes: string | undefined | null): string | null {
  if (!notes) return null;
  const line = notes.split("\n").find((l) => l.startsWith(CORRELATION_ID_PREFIX));
  return line ? line.slice(CORRELATION_ID_PREFIX.length).trim() : null;
}

/**
 * Builds the Notion `properties` payload for creating/updating a
 * MHFA-02 Learners & Registrations page. Caller is responsible for actually
 * calling packages/integration-notion/src/client.ts createPage/updatePage —
 * kept separate so this stays a pure, easily-tested function.
 */
export function registrationToNotionProperties(reg: HubRegistration): Record<string, unknown> {
  const paymentStatusMapped = PAYMENT_STATUS_MAP[reg.paymentStatus];
  const failedStatusNote = reg.paymentStatus === "failed" ? "Hub payment status: failed (no matching Notion option)" : undefined;

  const properties: Record<string, unknown> = {
    "Registration Code": { title: [{ text: { content: reg.registrationCode } }] },
    "First Name": { rich_text: [{ text: { content: reg.firstName } }] },
    "Last Name": { rich_text: [{ text: { content: reg.lastName } }] },
    Email: { email: reg.email },
    "Payment Status": { status: { name: paymentStatusMapped } },
    "Accommodation Requested": { checkbox: reg.accommodationRequested },
    Notes: { rich_text: [{ text: { content: buildNotesWithCorrelationId(reg.correlationId, undefined, failedStatusNote) } }] },
  };

  if (reg.phone) properties.Phone = { phone_number: reg.phone };
  if (reg.mhfaConnectEmail) properties["MHFA Connect Email"] = { email: reg.mhfaConnectEmail };
  if (reg.attendanceStatus) properties["Attendance Status"] = { status: { name: reg.attendanceStatus } };
  if (reg.sessionPageId) properties.Session = { relation: [{ id: reg.sessionPageId }] };
  if (reg.organizationPageId) properties.Organization = { relation: [{ id: reg.organizationPageId }] };

  return properties;
}

/**
 * Builds a HubRegistration from a validated `mhfa-individual-registration`
 * (named form) submission. registrationCode is system-generated from the
 * correlation id's ULID, not a fabricated sequential number — there is no
 * known real registration-numbering scheme to match against.
 */
export function namedRegistrationFormToHubRegistration(
  data: Record<string, unknown>,
  correlationId: string
): HubRegistration {
  const ulid = correlationId.split("|").pop() ?? correlationId;
  return {
    correlationId,
    firstName: String(data["first-name"] ?? ""),
    lastName: String(data["last-name"] ?? ""),
    email: String(data["email"] ?? ""),
    phone: data["phone"] ? String(data["phone"]) : undefined,
    mhfaConnectEmail: data["mhfa-connect-email"] ? String(data["mhfa-connect-email"]) : undefined,
    registrationCode: `REG-${ulid}`,
    paymentStatus: "pending",
    accommodationRequested: String(data["accommodation-needed"] ?? "").toLowerCase().startsWith("y"),
  };
}

/** Same shape as namedRegistrationFormToHubRegistration, for FORM-MHFA-001 (numbered form). */
export function formMhfa001ToHubRegistration(data: Record<string, unknown>, correlationId: string): HubRegistration {
  return namedRegistrationFormToHubRegistration(data, correlationId);
}

/**
 * MHFA-GRP-01 (AUTO-04) — FORM-MHFA-002 -> MHFA-03 | Organizations & Group
 * Opportunities, confirmed live schema 2026-08-07 (self-referential:
 * "Organization" rows and "Opportunity" rows share the same table/title
 * field "Opportunity Code" -- see docs/NOTION_MAPPING.md). The orchestration
 * that actually calls Notion (search-before-create for the Organization and
 * Contact records, then create the Opportunity) lives in
 * group-opportunity.ts; this file stays pure/testable.
 */

const DELIVERY_PREFERENCE_MAP: Record<string, "Virtual" | "In-Person" | "Hybrid" | "Flexible"> = {
  virtual: "Virtual",
  "in-person": "In-Person",
  "in person": "In-Person",
  inperson: "In-Person",
  hybrid: "Hybrid",
  flexible: "Flexible",
  "no preference": "Flexible",
  "no-preference": "Flexible",
  either: "Flexible",
};

/**
 * The live form's `delivery-preference` field isn't a closed enum in the
 * validation schema (see form-mhfa-002.schema.ts), so a raw submission could
 * contain text that doesn't match any of MHFA-03's real select options
 * (Virtual | In-Person | Hybrid | Flexible). Returns undefined rather than
 * guessing a mismatched option -- callers must put the raw value in Notes
 * instead of forcing it into the select property (governance: never invent
 * data, and an invalid select option would also just fail the Notion API
 * call).
 */
export function normalizeDeliveryPreference(raw: string | undefined): "Virtual" | "In-Person" | "Hybrid" | "Flexible" | undefined {
  if (!raw) return undefined;
  return DELIVERY_PREFERENCE_MAP[raw.trim().toLowerCase()];
}

/** Best-effort split of a single "contact name" form field into first/last -- not fabricating data, just parsing what was given. */
export function splitContactName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1).trim() };
}

export interface HubOrganization {
  name: string;
  correlationId: string;
}

/** Builds MHFA-03 properties for the parent Organization row (title = org name, not an opportunity code). */
export function organizationToNotionProperties(org: HubOrganization): Record<string, unknown> {
  return {
    "Opportunity Code": { title: [{ text: { content: org.name } }] },
    Notes: {
      rich_text: [
        {
          text: {
            content: buildNotesWithCorrelationId(
              org.correlationId,
              undefined,
              "Organization (parent) record -- created automatically from a group/private inquiry submission."
            ),
          },
        },
      ],
    },
  };
}

export interface HubGroupContact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  correlationId: string;
  organizationPageId: string;
  opportunityCode: string;
}

/**
 * Builds MHFA-02 properties for the group/private inquiry's point of
 * contact. Deliberately NOT registrationToNotionProperties -- this person
 * isn't a course registrant (no Payment Status applies), just linked via
 * MHFA-02's real "Organization" relation into MHFA-03.
 */
export function groupContactToNotionProperties(contact: HubGroupContact): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    "Registration Code": { title: [{ text: { content: `CONTACT-${contact.correlationId.split("|").pop()}` } }] },
    "First Name": { rich_text: [{ text: { content: contact.firstName } }] },
    "Last Name": { rich_text: [{ text: { content: contact.lastName } }] },
    Email: { email: contact.email },
    Organization: { relation: [{ id: contact.organizationPageId }] },
    Notes: {
      rich_text: [
        {
          text: {
            content: buildNotesWithCorrelationId(
              contact.correlationId,
              undefined,
              `Group/private inquiry point of contact -- not a course registrant. Linked to MHFA-03 opportunity ${contact.opportunityCode}.`
            ),
          },
        },
      ],
    },
  };
  if (contact.phone) properties.Phone = { phone_number: contact.phone };
  return properties;
}

export interface HubGroupOpportunity {
  correlationId: string;
  opportunityCode: string;
  organizationPageId: string;
  contactPageId: string;
  estimatedLearners?: number;
  deliveryPreference?: string;
  location?: string;
  preferredDate?: string;
  alternativeDate?: string;
  notesExtra: string; // organization-type, PO/invoicing needs, decision timeline, funding deadline, referral source, additional context -- assembled by the caller from real form fields only.
}

/** Builds MHFA-03 properties for the child Opportunity row (title = generated code, distinct from the parent Organization row's title = org name). */
export function groupOpportunityToNotionProperties(opp: HubGroupOpportunity): Record<string, unknown> {
  const preferredDatesParts: string[] = [];
  if (opp.preferredDate) preferredDatesParts.push(`Preferred: ${opp.preferredDate}`);
  if (opp.alternativeDate) preferredDatesParts.push(`Alternative: ${opp.alternativeDate}`);

  const mappedDelivery = normalizeDeliveryPreference(opp.deliveryPreference);
  const deliveryNote = opp.deliveryPreference && !mappedDelivery ? `Delivery preference (as submitted, no matching option): ${opp.deliveryPreference}` : undefined;

  const properties: Record<string, unknown> = {
    "Opportunity Code": { title: [{ text: { content: opp.opportunityCode } }] },
    Organization: { relation: [{ id: opp.organizationPageId }] },
    Contact: { relation: [{ id: opp.contactPageId }] },
    Stage: { status: { name: "Inquiry" } },
    Source: { select: { name: "Website" } },
    Notes: {
      rich_text: [
        { text: { content: buildNotesWithCorrelationId(opp.correlationId, undefined, [deliveryNote, opp.notesExtra].filter(Boolean).join("\n")) } },
      ],
    },
  };

  if (opp.estimatedLearners !== undefined) properties["Estimated Learners"] = { number: opp.estimatedLearners };
  if (opp.location) properties.Location = { rich_text: [{ text: { content: opp.location } }] };
  if (preferredDatesParts.length > 0) properties["Preferred Dates"] = { rich_text: [{ text: { content: preferredDatesParts.join("; ") } }] };
  if (mappedDelivery) properties["Delivery Preference"] = { select: { name: mappedDelivery } };

  return properties;
}
