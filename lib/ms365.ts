/**
 * Microsoft 365 / Graph API helper
 * Supports client-credentials (app-only) auth for orgs that configured
 * microsoft-365 integration with Tenant ID + Client ID + Client Secret.
 */
import { db } from "@/lib/db";

export type MS365Config = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
};

/** Fetch a client-credentials access token from Microsoft identity platform */
export async function getGraphToken(cfg: MS365Config): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "client_credentials",
        client_id:     cfg.clientId,
        client_secret: cfg.clientSecret,
        scope:         "https://graph.microsoft.com/.default",
      }),
    }
  );
  const data = await res.json() as { access_token?: string; error_description?: string };
  if (!data.access_token) {
    throw new Error(data.error_description ?? "Microsoft 365: failed to obtain access token");
  }
  return data.access_token;
}

/** Retrieve the MS365 config for an org from the Integration record */
export async function getMS365Config(orgId: string): Promise<MS365Config | null> {
  const integration = await db.integration.findFirst({
    where: { orgId, slug: "microsoft-365", status: "ACTIVE" },
    select: { config: true },
  });
  if (!integration) return null;
  const cfg = integration.config as Record<string, string>;
  const tenantId    = cfg["Tenant ID"]    ?? cfg.tenant_id    ?? "";
  const clientId    = cfg["Client ID"]    ?? cfg.client_id    ?? "";
  const clientSecret = cfg["Client Secret"] ?? cfg.client_secret ?? "";
  if (!tenantId || !clientId || !clientSecret) return null;
  return { tenantId, clientId, clientSecret };
}

/** Get the Teams webhook URL for an org */
export async function getTeamsWebhook(orgId: string): Promise<string | null> {
  const integration = await db.integration.findFirst({
    where: { orgId, slug: "microsoft-teams", status: "ACTIVE" },
    select: { config: true },
  });
  if (!integration) return null;
  const cfg = integration.config as Record<string, string>;
  return cfg["Webhook URL"] ?? cfg.webhook_url ?? null;
}

// ─── Teams Notifications ──────────────────────────────────────────────────────

type TeamsCard = {
  title: string;
  text: string;
  color?: "default" | "warning" | "attention" | "good";
  facts?: Array<{ name: string; value: string }>;
  actionUrl?: string;
  actionLabel?: string;
};

/** Post an Adaptive Card to a Teams channel via incoming webhook */
export async function postToTeams(webhookUrl: string, card: TeamsCard): Promise<void> {
  const colorMap: Record<string, string> = {
    default: "default", warning: "warning", attention: "attention", good: "good",
  };
  const body = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          msTeams: { width: "Full" },
          body: [
            {
              type: "TextBlock",
              text: card.title,
              weight: "Bolder",
              size: "Medium",
              color: colorMap[card.color ?? "default"],
            },
            {
              type: "TextBlock",
              text: card.text,
              wrap: true,
              color: "Default",
            },
            ...(card.facts && card.facts.length > 0
              ? [{
                  type: "FactSet",
                  facts: card.facts.map((f) => ({ title: f.name, value: f.value })),
                }]
              : []),
          ],
          actions: card.actionUrl
            ? [{ type: "Action.OpenUrl", title: card.actionLabel ?? "Open", url: card.actionUrl }]
            : [],
        },
      },
    ],
  };
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Send a finding alert to Teams */
export async function sendTeamsFindingAlert(opts: {
  orgId: string;
  findingTitle: string;
  severity: string;
  auditName: string;
  auditId: string;
  findingId: string;
  appUrl?: string;
}): Promise<void> {
  const webhook = await getTeamsWebhook(opts.orgId);
  if (!webhook) return;
  const sevColor: Record<string, TeamsCard["color"]> = {
    CRITICAL: "attention", HIGH: "attention", MEDIUM: "warning", LOW: "default", INFORMATIONAL: "default",
  };
  const base = opts.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  await postToTeams(webhook, {
    title: `🚨 New ${opts.severity} Finding — ${opts.auditName}`,
    text: opts.findingTitle,
    color: sevColor[opts.severity] ?? "default",
    facts: [
      { name: "Severity", value: opts.severity },
      { name: "Audit",    value: opts.auditName },
    ],
    actionUrl: `${base}/audits/${opts.auditId}?tab=findings`,
    actionLabel: "View Finding",
  });
}

/** Send an audit status update to Teams */
export async function sendTeamsAuditStatusUpdate(opts: {
  orgId: string;
  auditName: string;
  auditId: string;
  newStatus: string;
  clientName: string;
  appUrl?: string;
}): Promise<void> {
  const webhook = await getTeamsWebhook(opts.orgId);
  if (!webhook) return;
  const base = opts.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  await postToTeams(webhook, {
    title: `📋 Audit Status Updated — ${opts.auditName}`,
    text: `Status changed to **${opts.newStatus}**`,
    color: opts.newStatus === "COMPLETED" ? "good" : "default",
    facts: [
      { name: "Client", value: opts.clientName },
      { name: "Status", value: opts.newStatus },
    ],
    actionUrl: `${base}/audits/${opts.auditId}`,
    actionLabel: "View Audit",
  });
}

// ─── SharePoint / OneDrive ─────────────────────────────────────────────────────

export type DriveItem = {
  id: string;
  name: string;
  size: number | null;
  webUrl: string;
  mimeType: string | null;
  isFolder: boolean;
  lastModified: string;
};

/** List items in a OneDrive folder (drive root by default) */
export async function listOneDriveFiles(
  token: string,
  folderId?: string
): Promise<DriveItem[]> {
  const path = folderId
    ? `/me/drive/items/${folderId}/children`
    : `/me/drive/root/children`;
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}?$select=id,name,size,webUrl,file,folder,lastModifiedDateTime`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`OneDrive API error: ${res.status}`);
  const data = await res.json() as { value: Array<{
    id: string; name: string; size?: number; webUrl: string;
    file?: { mimeType: string }; folder?: object; lastModifiedDateTime: string;
  }> };
  return (data.value ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    size: item.size ?? null,
    webUrl: item.webUrl,
    mimeType: item.file?.mimeType ?? null,
    isFolder: !!item.folder,
    lastModified: item.lastModifiedDateTime,
  }));
}

/** List SharePoint document library items */
export async function listSharePointFiles(
  token: string,
  siteId: string,
  folderId?: string
): Promise<DriveItem[]> {
  const path = folderId
    ? `/sites/${siteId}/drive/items/${folderId}/children`
    : `/sites/${siteId}/drive/root/children`;
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}?$select=id,name,size,webUrl,file,folder,lastModifiedDateTime`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`SharePoint API error: ${res.status}`);
  const data = await res.json() as { value: Array<{
    id: string; name: string; size?: number; webUrl: string;
    file?: { mimeType: string }; folder?: object; lastModifiedDateTime: string;
  }> };
  return (data.value ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    size: item.size ?? null,
    webUrl: item.webUrl,
    mimeType: item.file?.mimeType ?? null,
    isFolder: !!item.folder,
    lastModified: item.lastModifiedDateTime,
  }));
}

/** List SharePoint sites the app has access to */
export async function listSharePointSites(token: string): Promise<Array<{ id: string; name: string; webUrl: string }>> {
  const res = await fetch("https://graph.microsoft.com/v1.0/sites?search=*&$select=id,name,webUrl", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`SharePoint sites API error: ${res.status}`);
  const data = await res.json() as { value: Array<{ id: string; name: string; webUrl: string }> };
  return data.value ?? [];
}

// ─── Outlook Calendar ─────────────────────────────────────────────────────────

export type CalendarEvent = {
  id: string;
  subject: string;
  start: string;
  end: string;
  location: string | null;
  webLink: string;
  isAllDay: boolean;
};

/** List calendar events for the app's service account for a date range */
export async function listCalendarEvents(
  token: string,
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    startDateTime: new Date(startDate).toISOString(),
    endDateTime: new Date(endDate).toISOString(),
    "$select": "id,subject,start,end,location,webLink,isAllDay",
    "$orderby": "start/dateTime",
    "$top": "50",
  });
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userId}/calendarView?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
  const data = await res.json() as { value: Array<{
    id: string; subject: string;
    start: { dateTime: string }; end: { dateTime: string };
    location?: { displayName: string }; webLink: string; isAllDay: boolean;
  }> };
  return (data.value ?? []).map((e) => ({
    id: e.id,
    subject: e.subject,
    start: e.start.dateTime,
    end: e.end.dateTime,
    location: e.location?.displayName ?? null,
    webLink: e.webLink,
    isAllDay: e.isAllDay,
  }));
}

/** Create a calendar event (e.g. audit deadline) */
export async function createCalendarEvent(
  token: string,
  userId: string,
  event: { subject: string; start: string; end: string; body?: string; location?: string }
): Promise<{ id: string; webLink: string }> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userId}/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: event.subject,
        start: { dateTime: event.start, timeZone: "UTC" },
        end:   { dateTime: event.end,   timeZone: "UTC" },
        body:  event.body ? { contentType: "text", content: event.body } : undefined,
        location: event.location ? { displayName: event.location } : undefined,
      }),
    }
  );
  if (!res.ok) throw new Error(`Calendar create event error: ${res.status}`);
  const data = await res.json() as { id: string; webLink: string };
  return { id: data.id, webLink: data.webLink };
}
