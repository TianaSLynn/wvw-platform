import type { Handler } from "@netlify/functions";
import { listBusinesses } from "../../packages/integration-wave/src/client.js";
import { getCustomerBalances, findPaymentCandidates } from "../../packages/integration-wave/src/reconciliation.js";
import { queryDatabaseLegacy, NotionNotConfiguredError } from "../../packages/integration-notion/src/client.js";

/**
 * AUTO-02 Payment Confirmation replacement (MHFA-PAY-01) — REPORT ONLY.
 *
 * GET /.netlify/functions/reconcile-payments
 *
 * Cross-references Wave customer balances against MHFA-02 registrations
 * that aren't yet marked Paid, and reports candidates. Deliberately never
 * writes to Notion — see packages/integration-wave/src/reconciliation.ts
 * for why a zero Wave balance isn't reliable enough proof of payment to
 * auto-write without a human in the loop. Always feature-flag gated like
 * every other path in this hub, even though it's read-only, so its
 * presence/absence in a response is consistent with the rest of the system.
 */

// Database page ID (not data source ID) -- queryDatabaseLegacy uses the
// pre-2025-09-03 /databases/{id}/query endpoint. See NOTION_MAPPING.md.
const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  if (process.env.MHFA_PAY_01_ENABLED !== "true") {
    return json(200, {
      status: "dry_run_feature_disabled",
      note: "MHFA_PAY_01_ENABLED is not set. This endpoint only ever reports candidates -- it never writes to Notion regardless of this flag -- but stays consistent with every other path in this hub by still gating on a flag.",
    });
  }

  let waveCustomers;
  try {
    const businesses = await listBusinesses();
    const wvw = businesses.find((b) => !b.isPersonal);
    if (!wvw) return json(502, { status: "wave_business_not_found" });
    waveCustomers = await getCustomerBalances(wvw.id);
  } catch (err) {
    return json(502, { status: "wave_not_configured", detail: String(err) });
  }

  let notionRegistrations: Array<{ email: string; registrationCode: string; pageId: string; paymentStatus: string }>;
  try {
    const result = await queryDatabaseLegacy(MHFA_02_DATABASE_ID, {
      property: "Payment Status",
      status: { does_not_equal: "Paid" },
    });
    notionRegistrations = result.results
      .map((page) => {
        const props = page.properties as Record<string, any>;
        const email = props.Email?.email;
        const registrationCode = props["Registration Code"]?.title?.[0]?.plain_text;
        const paymentStatus = props["Payment Status"]?.status?.name;
        if (!email || !registrationCode || !paymentStatus) return null;
        return { email, registrationCode, pageId: page.id, paymentStatus };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed", detail: String(err) });
  }

  const candidates = findPaymentCandidates(waveCustomers, notionRegistrations);

  return json(200, {
    status: "report_only_no_writes",
    registrationsChecked: notionRegistrations.length,
    waveCustomersChecked: waveCustomers.length,
    candidates,
    note: "These are candidates for human review, not confirmed payments. A zero Wave balance can also mean a customer was never charged -- see packages/integration-wave/src/reconciliation.ts. Nothing was written to Notion.",
  });
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
