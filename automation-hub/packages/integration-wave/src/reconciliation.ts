/**
 * AUTO-02 Payment Confirmation replacement (MHFA-PAY-01).
 *
 * Individual public MHFA registrants pay via the existing public Wave pay
 * link, not a per-person Wave Invoice — confirmed live 2026-08-07: the real
 * Wave business has only 2 formal Invoice records (both Wesley Shelter's
 * group booking), but 20+ real individual Customer records with real
 * emails. So payment confirmation for public registrations can't use
 * invoice-matching like the group-booking reconciliation does; it has to
 * match on Wave Customer records instead.
 *
 * Signal used: `Customer.outstandingAmount`. Confirmed live that every real
 * customer currently shows 0.00 outstanding. BUT a customer who was never
 * charged anything also shows 0.00 — Wave's API doesn't expose a clean
 * "has this person ever paid us" field distinct from "do they currently owe
 * us nothing." Because of that ambiguity, this module only ever *reports*
 * candidate matches — it does not write anything to Notion. Turning
 * candidate matches into actual Payment Status updates is a deliberate,
 * separate, human-reviewed step, not something this function does alone.
 */

export interface WaveCustomerBalance {
  name: string;
  email: string | null;
  outstandingAmount: string;
  overdueAmount: string;
}

const WAVE_GRAPHQL_ENDPOINT = "https://gql.waveapps.com/graphql/public";

async function waveGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = process.env.WAVE_API_TOKEN;
  if (!token) throw new Error("WAVE_API_TOKEN is not set.");
  const res = await fetch(WAVE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json()) as { data?: T; errors?: unknown };
  if (body.errors) throw new Error(`Wave API error: ${JSON.stringify(body.errors)}`);
  return body.data as T;
}

export async function getCustomerBalances(businessId: string, page = 1, pageSize = 100): Promise<WaveCustomerBalance[]> {
  const data = await waveGraphQL<{
    business: { customers: { edges: Array<{ node: WaveCustomerBalance }> } };
  }>(
    `query($businessId: ID!, $page: Int!, $pageSize: Int!) {
      business(id: $businessId) {
        customers(page: $page, pageSize: $pageSize) {
          edges {
            node {
              name
              email
              outstandingAmount { value }
              overdueAmount { value }
            }
          }
        }
      }
    }`,
    { businessId, page, pageSize }
  );
  return data.business.customers.edges.map((e) => e.node);
}

export interface PaymentReconciliationCandidate {
  email: string;
  waveName: string;
  waveOutstanding: string;
  notionRegistrationCode: string;
  notionPageId: string;
  currentPaymentStatus: string;
  confidence: "zero_balance_only";
}

/**
 * Cross-references Wave customer balances against a list of Notion
 * registrations (caller supplies the registrations already queried from
 * MHFA-02 — this module has no Notion dependency itself, kept pure for
 * testability). Returns candidates only; never writes anything.
 */
export function findPaymentCandidates(
  waveCustomers: WaveCustomerBalance[],
  notionRegistrations: Array<{ email: string; registrationCode: string; pageId: string; paymentStatus: string }>
): PaymentReconciliationCandidate[] {
  const waveByEmail = new Map(
    waveCustomers.filter((c) => c.email).map((c) => [c.email!.toLowerCase(), c] as const)
  );

  const candidates: PaymentReconciliationCandidate[] = [];
  for (const reg of notionRegistrations) {
    if (reg.paymentStatus === "Paid") continue;
    const match = waveByEmail.get(reg.email.toLowerCase());
    if (!match) continue;
    if (Number(match.outstandingAmount.replace(/,/g, "")) > 0) continue;

    candidates.push({
      email: reg.email,
      waveName: match.name,
      waveOutstanding: match.outstandingAmount,
      notionRegistrationCode: reg.registrationCode,
      notionPageId: reg.pageId,
      currentPaymentStatus: reg.paymentStatus,
      confidence: "zero_balance_only",
    });
  }
  return candidates;
}
