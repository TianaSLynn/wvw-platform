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
    super(`No Active template found in COMMS-02 with Communication Code "${communicationCode}".`);
    this.name = "TemplateNotFoundError";
  }
}

/**
 * Looks up by Communication Code (e.g. "MHFA-COMM-001"), the same key
 * Zapier was designed to search by per COMMS-07's documented flow. Requires
 * Active checkbox = true; does NOT require Test Status = Passed, since
 * every real template in COMMS-02 is currently "Not Tested" -- that's
 * surfaced separately (see docs/DECISION_REGISTER.md Decision 9) rather
 * than silently blocking every send.
 */
export async function getActiveTemplate(communicationCode: string): Promise<CommsTemplate> {
  const result = await queryDatabaseLegacy(COMMS_02_DATABASE_ID, richTextEqualsFilter("Communication Code", communicationCode));

  const active = result.results.find((page) => (page.properties as Record<string, any>).Active?.checkbox === true);
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
