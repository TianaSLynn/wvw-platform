import type { Handler } from "@netlify/functions";
import { findSessionByCode, derivePlatformOrLocation } from "../../packages/integration-notion/src/session-lookup.js";
import { queryDatabaseLegacy, richTextEqualsFilter } from "../../packages/integration-notion/src/client.js";
import { generateRegistrationReference } from "../../packages/integration-notion/src/registration-reference.js";
import { renderTemplate } from "../../packages/integration-email/src/template-render.js";
import { markdownToHtml } from "../../packages/integration-email/src/markdown-to-html.js";
import { sendEmail } from "../../packages/integration-email/src/client.js";

/**
 * TEMPORARY, one-time internal test endpoint for MHFA-COMM-001. Fetches
 * the template regardless of Test Status (since it's still "Draft", not
 * yet "Active" -- this IS the internal test that precedes flipping it to
 * Active), sends to hello@wholisticvibeswellness.com only, and does NOT
 * create any MHFA-02 registration record. Delete after use.
 */
export const handler: Handler = async () => {
  const session = await findSessionByCode("WESLEY-REPEAT-TBD-2026");
  if (!session) return json(404, { error: "test session not found" });

  const result = await queryDatabaseLegacy("00f1abfa-b8b0-483b-840d-e1f91043ad4b", richTextEqualsFilter("Communication Code", "MHFA-COMM-001"));
  if (result.results.length === 0) return json(404, { error: "template not found" });
  const props = result.results[0].properties as Record<string, any>;
  const subjectTemplate = props.Subject?.rich_text?.[0]?.plain_text ?? "";
  const bodyTemplate = props["Email Body"]?.rich_text?.map((t: any) => t.plain_text).join("") ?? "";

  const now = new Date();
  const paymentDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const registrationReference = await generateRegistrationReference(now.getUTCFullYear());

  const variables: Record<string, string> = {
    LearnerFirstName: "Jordan (TEST SEND)",
    CourseName: session.courseName ?? "",
    SessionDateFormatted: session.startDate ?? "(no Start Date set on this test session)",
    SessionTimeWithTimezone: [session.startTime, session.timeZoneAbbreviation].filter(Boolean).join(" "),
    DeliveryFormat: session.deliveryFormat ?? "",
    PlatformOrLocation: derivePlatformOrLocation(session) ?? "(no location/link set on this test session)",
    RegistrationReference: registrationReference,
    PaymentDeadlineFormatted: paymentDeadline.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: session.timeZoneIana ?? "UTC" }),
    AmountDueFormatted: "$225.00",
    PaymentURL: "https://link.waveapps.com/uun3sr-jm72jd",
    StandardLearnerSignature: [
      "With care,",
      "",
      "Tiána Lynn",
      "Founder & Lead Instructor",
      "Wholistic Vibes Wellness | WVW Academy™",
      "Mental Health First Aid Training",
      "",
      "hello@wholisticvibeswellness.com",
      "wholisticvibeswellness.com",
    ].join("\n"),
  };

  let subject: string;
  let body: string;
  try {
    subject = renderTemplate(subjectTemplate, variables);
    body = renderTemplate(bodyTemplate, variables);
  } catch (err) {
    return json(422, { error: "render_failed", detail: String(err) });
  }

  const html = markdownToHtml(body) + '<hr><p style="color:#999;font-size:12px;">INTERNAL TEST SEND -- not a real registration. Sent via tmp-test-seat-email.</p>';

  await sendEmail({
    to: "hello@wholisticvibeswellness.com",
    subject: `[TEST] ${subject}`,
    html,
  });

  return json(200, { status: "sent", subject, registrationReference, sessionUsed: session.sessionCode });
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}
