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
