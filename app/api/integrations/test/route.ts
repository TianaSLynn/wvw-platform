import { getCurrentUser } from "@/lib/auth";
import { unauthorized, ok, badRequest, serverError } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  slug:   z.string(),
  config: z.record(z.string()),
});

// ─── Per-service test functions ───────────────────────────────────────────────

async function testSlack(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const token = config["Bot Token"] ?? config.bot_token;
  const webhook = config["Webhook URL"] ?? config.webhook_url;
  if (!token && !webhook) return { ok: false, message: "Bot Token or Webhook URL required" };
  if (token) {
    const r = await fetch("https://slack.com/api/auth.test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json() as { ok: boolean; error?: string; team?: string };
    return d.ok
      ? { ok: true, message: `Connected to workspace: ${d.team ?? "Slack"}` }
      : { ok: false, message: d.error ?? "Authentication failed" };
  }
  // Webhook test
  const r = await fetch(webhook!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "WVW Intelligence connected successfully ✓" }),
  });
  return r.ok
    ? { ok: true, message: "Webhook delivered successfully" }
    : { ok: false, message: `Webhook returned ${r.status}` };
}

async function testMicrosoftTeams(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const webhook = config["Webhook URL"] ?? config.webhook_url;
  if (!webhook) return { ok: false, message: "Webhook URL required. Create an Incoming Webhook connector in Teams." };
  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        text: "WVW Intelligence connected to Microsoft Teams ✓",
      }),
    });
    return r.ok
      ? { ok: true, message: "Teams webhook delivered successfully" }
      : { ok: false, message: `Teams returned ${r.status} — check webhook URL` };
  } catch {
    return { ok: false, message: "Could not reach Teams webhook URL" };
  }
}

async function testMicrosoft365(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const tenantId  = config["Tenant ID"]    ?? config.tenant_id;
  const clientId  = config["Client ID"]    ?? config.client_id;
  const clientSecret = config["Client Secret"] ?? config.client_secret;
  if (!tenantId || !clientId || !clientSecret) return { ok: false, message: "Tenant ID, Client ID, and Client Secret required" };
  try {
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
        }),
      }
    );
    const d = await tokenRes.json() as { access_token?: string; error_description?: string };
    return d.access_token
      ? { ok: true, message: "Microsoft 365 credentials verified — access token obtained" }
      : { ok: false, message: d.error_description ?? "Authentication failed" };
  } catch {
    return { ok: false, message: "Could not reach Microsoft identity endpoint" };
  }
}

async function testHubSpot(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const token = config["Private App Token"] ?? config.token;
  if (!token) return { ok: false, message: "Private App Token required" };
  const r = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.ok
    ? { ok: true, message: "HubSpot connected — CRM access confirmed" }
    : { ok: false, message: `HubSpot returned ${r.status} — check token permissions` };
}

async function testBambooHR(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const subdomain = config["Subdomain"] ?? config.subdomain;
  const apiKey    = config["API Key"]   ?? config.api_key;
  if (!subdomain || !apiKey) return { ok: false, message: "Subdomain and API Key required" };
  const encoded = Buffer.from(`${apiKey}:x`).toString("base64");
  const r = await fetch(`https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/directory`, {
    headers: { Authorization: `Basic ${encoded}`, Accept: "application/json" },
  });
  return r.ok
    ? { ok: true, message: "BambooHR connected — employee directory accessible" }
    : { ok: false, message: `BambooHR returned ${r.status} — check subdomain and API key` };
}

async function testZoom(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const accountId    = config["Account ID"]    ?? config.account_id;
  const clientId     = config["Client ID"]     ?? config.client_id;
  const clientSecret = config["Client Secret"] ?? config.client_secret;
  if (!accountId || !clientId || !clientSecret) return { ok: false, message: "Account ID, Client ID, and Client Secret required" };
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch("https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" + accountId, {
    method: "POST",
    headers: { Authorization: `Basic ${encoded}` },
  });
  const d = await tokenRes.json() as { access_token?: string; reason?: string };
  return d.access_token
    ? { ok: true, message: "Zoom Server-to-Server OAuth verified" }
    : { ok: false, message: d.reason ?? "Zoom authentication failed" };
}

async function testN8n(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const url    = (config["Instance URL"] ?? config.url ?? "").replace(/\/$/, "");
  const apiKey = config["API Key"] ?? config.api_key;
  if (!url || !apiKey) return { ok: false, message: "Instance URL and API Key required" };
  try {
    const r = await fetch(`${url}/api/v1/workflows?limit=1`, {
      headers: { "X-N8N-API-KEY": apiKey },
    });
    return r.ok
      ? { ok: true, message: "n8n instance reachable — workflows API accessible" }
      : { ok: false, message: `n8n returned ${r.status} — check URL and API key` };
  } catch {
    return { ok: false, message: "Could not reach n8n instance URL" };
  }
}

async function testGreenhouse(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const apiKey = config["API Key"] ?? config.api_key;
  if (!apiKey) return { ok: false, message: "API Key required" };
  const encoded = Buffer.from(`${apiKey}:`).toString("base64");
  const r = await fetch("https://harvest.greenhouse.io/v1/users?per_page=1", {
    headers: { Authorization: `Basic ${encoded}` },
  });
  return r.ok
    ? { ok: true, message: "Greenhouse connected — API access confirmed" }
    : { ok: false, message: `Greenhouse returned ${r.status} — check API key permissions` };
}

async function testTypeform(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const token = config["Personal Access Token"] ?? config.token;
  if (!token) return { ok: false, message: "Personal Access Token required" };
  const r = await fetch("https://api.typeform.com/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d = await r.json() as { alias?: string; email?: string };
  return r.ok
    ? { ok: true, message: `Typeform connected — account: ${d.alias ?? d.email ?? "verified"}` }
    : { ok: false, message: `Typeform returned ${r.status} — check token` };
}

async function testZapier(config: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  // Zapier uses API keys for NLA — we validate the key is non-empty
  const apiKey = config["API Key"] ?? config.api_key;
  if (!apiKey) return { ok: false, message: "API Key required" };
  // Zapier doesn't have a simple ping endpoint; validate format
  if (apiKey.length < 20) return { ok: false, message: "API key looks invalid — check Zapier dashboard" };
  return { ok: true, message: "Zapier API key stored — webhook triggers ready" };
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const TESTERS: Record<string, (c: Record<string, string>) => Promise<{ ok: boolean; message: string }>> = {
  "slack":             testSlack,
  "microsoft-teams":   testMicrosoftTeams,
  "microsoft-365":     testMicrosoft365,
  "hubspot":           testHubSpot,
  "bamboohr":          testBambooHR,
  "zoom":              testZoom,
  "n8n":               testN8n,
  "greenhouse":        testGreenhouse,
  "typeform":          testTypeform,
  "zapier":            testZapier,
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const { slug, config } = parsed.data;
    const tester = TESTERS[slug];

    if (!tester) {
      // No live tester — just validate fields are filled
      const empty = Object.entries(config).filter(([, v]) => !v.trim());
      if (empty.length > 0) {
        return ok({ ok: false, message: `Missing fields: ${empty.map(([k]) => k).join(", ")}` });
      }
      return ok({ ok: true, message: "Credentials stored — connection pending manual verification" });
    }

    const result = await tester(config);
    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}
