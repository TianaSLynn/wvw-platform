/**
 * Live testers for stored integration credentials.
 * Shared between POST /api/integrations/verify and the verify-integrations script.
 */

export type TestResult = { ok: boolean; message: string };

async function testSlack(c: Record<string, string>): Promise<TestResult> {
  const token = c["Bot Token"] ?? c.bot_token;
  const webhook = c["Webhook URL"] ?? c.webhook_url;
  if (!token && !webhook) return { ok: false, message: "Bot Token or Webhook URL not configured" };
  if (token) {
    const r = await fetch("https://slack.com/api/auth.test", { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json() as { ok: boolean; error?: string; team?: string };
    return d.ok ? { ok: true, message: `Connected to workspace: ${d.team}` } : { ok: false, message: d.error ?? "Auth failed" };
  }
  const r = await fetch(webhook!, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "WVW verify ✓" }) });
  return r.ok ? { ok: true, message: "Webhook reachable" } : { ok: false, message: `Webhook ${r.status}` };
}

async function testMicrosoftTeams(c: Record<string, string>): Promise<TestResult> {
  const webhook = c["Webhook URL"] ?? c.webhook_url;
  if (!webhook) return { ok: false, message: "Webhook URL not configured" };
  try {
    const r = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ "@type": "MessageCard", text: "WVW verify ✓" }) });
    return r.ok ? { ok: true, message: "Teams webhook reachable" } : { ok: false, message: `Teams ${r.status}` };
  } catch { return { ok: false, message: "Could not reach Teams webhook" }; }
}

async function testMicrosoft365(c: Record<string, string>): Promise<TestResult> {
  const tenantId = c["Tenant ID"] ?? c.tenant_id;
  const clientId = c["Client ID"] ?? c.client_id;
  const secret = c["Client Secret"] ?? c.client_secret;
  if (!tenantId || !clientId || !secret) return { ok: false, message: "Missing Tenant ID, Client ID, or Client Secret" };
  try {
    const r = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: secret, scope: "https://graph.microsoft.com/.default" }),
    });
    const d = await r.json() as { access_token?: string; error_description?: string };
    return d.access_token ? { ok: true, message: "Microsoft 365 credentials valid" } : { ok: false, message: d.error_description ?? "Auth failed" };
  } catch { return { ok: false, message: "Could not reach Microsoft identity endpoint" }; }
}

async function testN8n(c: Record<string, string>): Promise<TestResult> {
  const url = (c["Instance URL"] ?? c.url ?? process.env.N8N_API_URL ?? "").replace(/\/$/, "");
  const apiKey = c["API Key"] ?? c.api_key ?? process.env.N8N_API_KEY ?? "";
  if (!url || !apiKey) return { ok: false, message: "Instance URL and API Key required" };
  try {
    const r = await fetch(`${url}/api/v1/workflows?limit=1`, { headers: { "X-N8N-API-KEY": apiKey } });
    return r.ok ? { ok: true, message: "n8n reachable — workflows API accessible" } : { ok: false, message: `n8n ${r.status} — check URL and API key` };
  } catch { return { ok: false, message: "Could not reach n8n instance" }; }
}

async function testHubSpot(c: Record<string, string>): Promise<TestResult> {
  const token = c["Private App Token"] ?? c.token;
  if (!token) return { ok: false, message: "Private App Token not configured" };
  const r = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", { headers: { Authorization: `Bearer ${token}` } });
  return r.ok ? { ok: true, message: "HubSpot CRM access confirmed" } : { ok: false, message: `HubSpot ${r.status} — check token` };
}

async function testBambooHR(c: Record<string, string>): Promise<TestResult> {
  const subdomain = c["Subdomain"] ?? c.subdomain;
  const apiKey = c["API Key"] ?? c.api_key;
  if (!subdomain || !apiKey) return { ok: false, message: "Subdomain and API Key required" };
  const encoded = Buffer.from(`${apiKey}:x`).toString("base64");
  const r = await fetch(`https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/directory`, { headers: { Authorization: `Basic ${encoded}`, Accept: "application/json" } });
  return r.ok ? { ok: true, message: "BambooHR employee directory accessible" } : { ok: false, message: `BambooHR ${r.status}` };
}

async function testZoom(c: Record<string, string>): Promise<TestResult> {
  const accountId = c["Account ID"] ?? c.account_id;
  const clientId = c["Client ID"] ?? c.client_id;
  const secret = c["Client Secret"] ?? c.client_secret;
  if (!accountId || !clientId || !secret) return { ok: false, message: "Account ID, Client ID, Client Secret required" };
  const encoded = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, { method: "POST", headers: { Authorization: `Basic ${encoded}` } });
  const d = await r.json() as { access_token?: string; reason?: string };
  return d.access_token ? { ok: true, message: "Zoom OAuth verified" } : { ok: false, message: d.reason ?? "Zoom auth failed" };
}

async function testTypeform(c: Record<string, string>): Promise<TestResult> {
  const token = c["Personal Access Token"] ?? c.token;
  if (!token) return { ok: false, message: "Personal Access Token not configured" };
  const r = await fetch("https://api.typeform.com/me", { headers: { Authorization: `Bearer ${token}` } });
  const d = await r.json() as { alias?: string };
  return r.ok ? { ok: true, message: `Typeform connected as ${d.alias ?? "verified"}` } : { ok: false, message: `Typeform ${r.status}` };
}

async function testWave(c: Record<string, string>): Promise<TestResult> {
  const token = c["Full Access Token"] ?? c.token;
  if (!token) return { ok: false, message: "Full Access Token not configured" };
  const r = await fetch("https://gql.waveapps.com/graphql/public", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "{ user { id } }" }),
  });
  const d = await r.json() as { data?: { user?: { id: string } }; errors?: unknown[] };
  return d.data?.user ? { ok: true, message: "Wave Accounting connected" } : { ok: false, message: "Wave token invalid or expired" };
}

async function testDocuSign(c: Record<string, string>): Promise<TestResult> {
  const integrationKey = c["Integration Key"] ?? c.integration_key;
  const accountId = c["Account ID"] ?? c.account_id;
  if (!integrationKey || !accountId) return { ok: false, message: "Integration Key and Account ID required" };
  // DocuSign requires a JWT/OAuth consent flow we don't perform here — just confirm shape.
  return { ok: true, message: "Credentials stored — DocuSign requires OAuth consent grant; full verification not yet automated" };
}

async function testZapier(c: Record<string, string>): Promise<TestResult> {
  const apiKey = c["API Key"] ?? c.api_key;
  if (!apiKey) return { ok: false, message: "API Key not configured" };
  return { ok: true, message: "Credentials stored — Zapier verifies per-Zap at trigger time" };
}

export const TESTERS: Record<string, (c: Record<string, string>) => Promise<TestResult>> = {
  "slack":                  testSlack,
  "microsoft-teams":        testMicrosoftTeams,
  "microsoft-365":          testMicrosoft365,
  "microsoft-outlook-mail": testMicrosoft365,
  "microsoft-planner":      testMicrosoft365,
  "azure-active-directory": testMicrosoft365,
  "n8n":                    testN8n,
  "hubspot":                testHubSpot,
  "bamboohr":               testBambooHR,
  "zoom":                   testZoom,
  "typeform":               testTypeform,
  "wave":                   testWave,
  "docusign":               testDocuSign,
  "zapier":                 testZapier,
};

export async function runIntegrationTest(slug: string, config: Record<string, string>): Promise<TestResult> {
  const tester = TESTERS[slug];
  if (tester) return tester(config);
  const hasConfig = Object.values(config).some((v) => v?.toString().trim());
  return hasConfig
    ? { ok: true, message: "Credentials stored — no live verification available for this service" }
    : { ok: false, message: "No credentials configured yet" };
}
