/**
 * Fetches live email templates from COMMS-02 | Email Templates -- per
 * COMMS-01's own governance rule ("One source of truth. Email copy lives
 * in COMMS-02 only... Active flag. Only templates marked Active = Yes
 * should be referenced by automations"), this hub queries Notion for the
 * real Subject/Email Body at send time rather than hardcoding copy, so
 * Tiána can edit template text without a code change.
 */
import { queryDatabaseLegacy, richTextEqualsFilter } from "./client.js";

const COMMS_02_DATABASE_ID = "00f1abfa-b8b0-483b-840d-e1f91043ad4b";

export interface CommsTemplate {
  pageId: string;
  communicationCode: string;
  templateName: string;
  subject: string;
  body: string;
  sender?: string;
  testStatus?: string;
}

export class TemplateNotFoundError extends Error {
  constructor(communicationCode: string) {
    super(`No template found in COMMS-02 with Communication Code "${communicationCode}" and Test Status "Active".`);
    this.name = "TemplateNotFoundError";
  }
}

const READY_TO_SEND_STATUS = "Active";

/**
 * Looks up by Communication Code (e.g. "MHFA-COMM-001"), the same key
 * Zapier was designed to search by per COMMS-07's documented flow. Gates on
 * Test Status = "Active" -- per Tiána's 2026-08-12 governance decision
 * (Decision 10), Test Status was repurposed from a 5-value testing-only
 * field into her full 7-stage activation lifecycle (Draft -> Copy Approved
 * -> Test Ready -> Test Sent -> Test Passed -> Approved for Activation ->
 * Active), and only the final stage may be referenced by automations. The
 * separate "Active" checkbox is no longer the gate.
 */
export async function getActiveTemplate(communicationCode: string): Promise<CommsTemplate> {
  const result = await queryDatabaseLegacy(COMMS_02_DATABASE_ID, richTextEqualsFilter("Communication Code", communicationCode));

  const active = result.results.find((page) => (page.properties as Record<string, any>)["Test Status"]?.select?.name === READY_TO_SEND_STATUS);
  if (!active) throw new TemplateNotFoundError(communicationCode);

  const props = active.properties as Record<string, any>;
  return {
    pageId: active.id,
    communicationCode,
    templateName: props["Template Name"]?.title?.[0]?.plain_text ?? communicationCode,
    subject: props.Subject?.rich_text?.[0]?.plain_text ?? "",
    body: props["Email Body"]?.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "",
    sender: props.Sender?.select?.name,
    testStatus: props["Test Status"]?.select?.name,
  };
}
