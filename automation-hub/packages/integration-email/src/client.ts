/**
 * Thin email client wrapping the Resend HTTP API directly (a single POST
 * /emails call doesn't warrant the SDK dependency), matching this hub's
 * other integrations (integration-notion, integration-postgres):
 * credential-gated, throws rather than silently no-ops.
 *
 * Sending domain: wvwacademy.com, verified in Resend since 2026-05-04.
 * wholisticvibeswellness.com was requested first but isn't verified in
 * Resend yet (no DNS records added) -- Tiána chose to use wvwacademy.com
 * for now rather than block on DNS setup (Decision 7).
 */

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("RESEND_API_KEY is not set -- cannot send email.");
    this.name = "EmailNotConfiguredError";
  }
}

export class EmailApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Resend API error (${status})`);
    this.name = "EmailApiError";
  }
}

const SENDER = "automation@wvwacademy.com";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new EmailNotConfiguredError();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SENDER,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new EmailApiError(response.status, body);
  }
}
