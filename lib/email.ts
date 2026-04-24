/**
 * WVW Email Service — uses Resend when RESEND_API_KEY is set.
 * Falls back to console logging in development so all code paths work without credentials.
 */

const FROM = process.env.EMAIL_FROM ?? "noreply@wvwconsulting.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "WVW Intelligence";

type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

// ─── Base HTML wrapper ────────────────────────────────────────────────────────

function baseTemplate(content: string, preheader = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:#f4f4f5">${preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr><td style="background:#0F1C3F;padding:24px 32px;">
          <p style="margin:0;color:#C9A84C;font-size:18px;font-weight:700;letter-spacing:-0.3px;">${APP_NAME}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#f8f8fa;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.5;">
            You received this email because you are a member of ${APP_NAME}.<br/>
            <a href="${APP_URL}/settings/notifications" style="color:#C9A84C;">Manage notification preferences</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#0F1C3F;color:#ffffff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;margin-top:16px;">${text}</a>`;
}

function h1(text: string) {
  return `<h1 style="margin:0 0 8px;color:#0F1C3F;font-size:20px;font-weight:700;">${text}</h1>`;
}

function p(text: string) {
  return `<p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">${text}</p>`;
}

function badge(text: string, color: string) {
  return `<span style="display:inline-block;background:${color}20;color:${color};border:1px solid ${color}40;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;">${text}</span>`;
}

// ─── Email sender ─────────────────────────────────────────────────────────────

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback — log to console
    const to = Array.isArray(payload.to) ? payload.to.join(", ") : payload.to;
    console.log(`\n📧 [EMAIL — no RESEND_API_KEY set]\nTo: ${to}\nSubject: ${payload.subject}\n`);
    return { ok: true, id: "dev-console" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      replyTo: payload.replyTo,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false };
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName: string) {
  return sendEmail({
    to,
    subject: `Welcome to ${APP_NAME}`,
    html: baseTemplate(
      h1(`Welcome, ${firstName}!`) +
      p(`You now have access to <strong>${APP_NAME}</strong> — the WVW workplace culture operating system.`) +
      p("From here you can manage audits, track findings, run workforce diagnostics, and access your organization's dashboard.") +
      btn("Open Dashboard", `${APP_URL}/dashboard`),
      `Welcome to ${APP_NAME}`
    ),
  });
}

export async function sendFindingAlert(opts: {
  to: string;
  firstName: string;
  findingTitle: string;
  severity: string;
  auditName: string;
  auditId: string;
  findingId: string;
}) {
  const severityColor = opts.severity === "CRITICAL" ? "#ef4444" : opts.severity === "HIGH" ? "#f97316" : "#eab308";
  return sendEmail({
    to: opts.to,
    subject: `${opts.severity} finding: ${opts.findingTitle}`,
    html: baseTemplate(
      h1("New Finding Added") +
      p(`Hi ${opts.firstName}, a new finding has been added to <strong>${opts.auditName}</strong>.`) +
      `<div style="background:#f8f8fa;border-radius:10px;padding:16px;margin:16px 0;">
        <div style="margin-bottom:8px;">${badge(opts.severity, severityColor)}</div>
        <p style="margin:0;color:#0F1C3F;font-size:14px;font-weight:600;">${opts.findingTitle}</p>
      </div>` +
      btn("View Finding", `${APP_URL}/audits/${opts.auditId}/findings/${opts.findingId}`),
      `New ${opts.severity} finding in ${opts.auditName}`
    ),
  });
}

export async function sendInvoiceOverdueAlert(opts: {
  to: string;
  firstName: string;
  clientName: string;
  invoiceNumber: string;
  amount: string;
  daysOverdue: number;
  invoiceId: string;
}) {
  return sendEmail({
    to: opts.to,
    subject: `Invoice overdue: ${opts.invoiceNumber} — ${opts.clientName}`,
    html: baseTemplate(
      h1("Invoice Overdue") +
      p(`Hi ${opts.firstName}, invoice <strong>${opts.invoiceNumber}</strong> for <strong>${opts.clientName}</strong> is ${opts.daysOverdue} day${opts.daysOverdue === 1 ? "" : "s"} overdue.`) +
      `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#b91c1c;font-size:14px;font-weight:600;">Amount due: ${opts.amount}</p>
        <p style="margin:4px 0 0;color:#ef4444;font-size:12px;">${opts.daysOverdue} days overdue</p>
      </div>` +
      btn("View Invoice", `${APP_URL}/invoices/${opts.invoiceId}`),
      `Overdue invoice for ${opts.clientName}`
    ),
  });
}

export async function sendAuditStatusUpdate(opts: {
  to: string;
  firstName: string;
  auditName: string;
  newStatus: string;
  clientName: string;
  auditId: string;
}) {
  return sendEmail({
    to: opts.to,
    subject: `Audit status updated: ${opts.auditName}`,
    html: baseTemplate(
      h1("Audit Status Updated") +
      p(`Hi ${opts.firstName}, the status of audit <strong>${opts.auditName}</strong> for <strong>${opts.clientName}</strong> has been updated.`) +
      `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#15803d;font-size:14px;font-weight:600;">New status: ${opts.newStatus.replace(/_/g, " ")}</p>
      </div>` +
      btn("View Audit", `${APP_URL}/audits/${opts.auditId}`),
      `${opts.auditName} status: ${opts.newStatus}`
    ),
  });
}

export async function sendOnboardingMilestoneAlert(opts: {
  to: string;
  firstName: string;
  employeeName: string;
  milestone: string;
  daysOverdue: number;
}) {
  return sendEmail({
    to: opts.to,
    subject: `Onboarding milestone overdue — ${opts.employeeName}`,
    html: baseTemplate(
      h1("Onboarding Milestone Overdue") +
      p(`Hi ${opts.firstName}, an onboarding milestone for <strong>${opts.employeeName}</strong> is overdue.`) +
      `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">${opts.milestone}</p>
        <p style="margin:4px 0 0;color:#b45309;font-size:12px;">${opts.daysOverdue} days overdue</p>
      </div>` +
      btn("View Onboarding", `${APP_URL}/workforce/onboarding`),
      `Onboarding milestone overdue for ${opts.employeeName}`
    ),
  });
}

export async function sendWeeklyDigest(opts: {
  to: string;
  firstName: string;
  stats: {
    openAudits: number;
    criticalFindings: number;
    overdueInvoices: number;
    newResponses: number;
  };
}) {
  const { openAudits, criticalFindings, overdueInvoices, newResponses } = opts.stats;
  const now = new Date();
  const weekStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return sendEmail({
    to: opts.to,
    subject: `WVW Weekly Digest — ${weekStr}`,
    html: baseTemplate(
      h1(`Weekly Digest`) +
      p(`Hi ${opts.firstName}, here's your summary for the week of ${weekStr}.`) +
      `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr>
          ${[
            { label: "Open Audits",        value: openAudits,       color: "#0F1C3F" },
            { label: "Critical Findings",  value: criticalFindings, color: "#ef4444" },
            { label: "Overdue Invoices",   value: overdueInvoices,  color: "#f97316" },
            { label: "Survey Responses",   value: newResponses,     color: "#10b981" },
          ].map(s => `
            <td width="25%" style="padding:0 6px;">
              <div style="background:#f8f8fa;border-radius:10px;padding:16px;text-align:center;">
                <p style="margin:0;font-size:24px;font-weight:800;color:${s.color};">${s.value}</p>
                <p style="margin:4px 0 0;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">${s.label}</p>
              </div>
            </td>`).join("")}
        </tr>
      </table>` +
      btn("Open Dashboard", `${APP_URL}/dashboard`),
      `Your WVW weekly summary`
    ),
  });
}

export async function sendTaskAssigned(opts: {
  to: string;
  firstName: string;
  taskTitle: string;
  dueDate?: string;
  assignedBy: string;
}) {
  return sendEmail({
    to: opts.to,
    subject: `Task assigned to you: ${opts.taskTitle}`,
    html: baseTemplate(
      h1("Task Assigned") +
      p(`Hi ${opts.firstName}, <strong>${opts.assignedBy}</strong> has assigned you a task.`) +
      `<div style="background:#f8f8fa;border-radius:10px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#0F1C3F;font-size:14px;font-weight:600;">${opts.taskTitle}</p>
        ${opts.dueDate ? `<p style="margin:4px 0 0;color:#6b7280;font-size:12px;">Due: ${opts.dueDate}</p>` : ""}
      </div>` +
      btn("View Task", `${APP_URL}/dashboard`),
      `New task: ${opts.taskTitle}`
    ),
  });
}
