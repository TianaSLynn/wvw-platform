/**
 * Best-effort registration/inquiry email alert (Decision 7). Gated on its
 * own flag (EMAIL_ALERT_REG_ENABLED, off by default) and never blocks or
 * fails the real intake response -- same pattern as logWorkflowExecution.
 *
 * Content is built from generalPayload only -- the same field already used
 * for workflow_executions logging and never the full raw submission -- so
 * this never emails anything this hub doesn't already treat as shareable
 * (restricted fields are split out before generalPayload exists; see
 * splitRestrictedFields / splitGroupInquiryRestrictedFields).
 */
import { sendEmail, EmailNotConfiguredError } from "./client.js";

const ALERT_RECIPIENT = "hello@wholisticvibeswellness.com";

export interface RegistrationAlertInput {
  automationCode: string;
  correlationId: string;
  notionPageUrl: string;
  generalPayload: Record<string, unknown>;
}

export async function sendRegistrationAlert(entry: RegistrationAlertInput): Promise<void> {
  if (process.env.EMAIL_ALERT_REG_ENABLED !== "true") return;

  try {
    const rows = Object.entries(entry.generalPayload)
      .map(
        ([key, value]) =>
          `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap;">${escapeHtml(key)}</td><td>${escapeHtml(String(value))}</td></tr>`,
      )
      .join("");

    await sendEmail({
      to: ALERT_RECIPIENT,
      subject: `New ${entry.automationCode}: registration/inquiry received`,
      html: `
        <p>A new <strong>${escapeHtml(entry.automationCode)}</strong> submission was just written to Notion.</p>
        <table cellspacing="0" cellpadding="0">${rows}</table>
        <p><a href="${escapeHtml(entry.notionPageUrl)}">Open in Notion</a></p>
        <p style="color:#999;font-size:12px;">Correlation ID: ${escapeHtml(entry.correlationId)}</p>
      `,
    });
  } catch (err) {
    if (err instanceof EmailNotConfiguredError) {
      console.error(
        "[registration-alert] EMAIL_ALERT_REG_ENABLED is true but RESEND_API_KEY is not set -- skipping email, not failing the request.",
      );
      return;
    }
    console.error("[registration-alert] failed to send email (best-effort, not failing the request):", err);
  }
}

function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
