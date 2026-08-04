/**
 * Thin Wave GraphQL API client. Credential-gated like every other external
 * integration in this hub: if WAVE_API_TOKEN isn't set, every call throws
 * WaveNotConfiguredError instead of silently no-op'ing.
 *
 * WAVE_API_TOKEN is a Wave "Full Access" business API token (generated
 * directly from Wave's Settings > API page for the Wholistic Vibes Wellness
 * LLC business), not an OAuth app access token — it does not expire on the
 * ~30 minute cycle Wave's OAuth-flow access tokens do. See
 * docs/CREDENTIALS_AND_MANUAL_ACTIONS.md.
 *
 * Confirmed live against the real Wave business 2026-08-04: `business(id)`
 * requires the business's own id (not a plural `businesses` lookup with no
 * id), and `InvoiceStatus` is a plain enum with no subfields.
 */

const WAVE_GRAPHQL_ENDPOINT = "https://gql.waveapps.com/graphql/public";

export class WaveNotConfiguredError extends Error {
  constructor() {
    super("WAVE_API_TOKEN is not set — cannot call the Wave API.");
    this.name = "WaveNotConfiguredError";
  }
}

export class WaveApiError extends Error {
  constructor(public readonly errors: unknown) {
    super(`Wave API error: ${JSON.stringify(errors)}`);
    this.name = "WaveApiError";
  }
}

function requireApiToken(): string {
  const token = process.env.WAVE_API_TOKEN;
  if (!token) throw new WaveNotConfiguredError();
  return token;
}

async function waveGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = requireApiToken();
  const res = await fetch(WAVE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json()) as { data?: T; errors?: unknown };
  if (body.errors) throw new WaveApiError(body.errors);
  return body.data as T;
}

export interface WaveBusiness {
  id: string;
  name: string;
  isPersonal: boolean;
}

export async function listBusinesses(): Promise<WaveBusiness[]> {
  const data = await waveGraphQL<{ businesses: { edges: Array<{ node: WaveBusiness }> } }>(
    `{ businesses(page: 1, pageSize: 25) { edges { node { id name isPersonal } } } }`
  );
  return data.businesses.edges.map((e) => e.node);
}

export type WaveInvoiceStatus = "DRAFT" | "SAVED" | "SENT" | "VIEWED" | "PARTIAL" | "PAID" | "OVERDUE";

export interface WaveInvoice {
  id: string;
  invoiceNumber: string;
  status: WaveInvoiceStatus;
  total: { value: string };
  amountDue: { value: string };
  customer: { name: string };
  createdAt: string;
  dueDate: string;
  lastSentAt: string | null;
  lastSentVia: string;
}

/**
 * Fetches invoices for a business, including delivery status. Wave's own
 * `status` field (e.g. OVERDUE) is purely due-date math and does NOT reflect
 * whether the invoice was actually sent — always check `lastSentVia` before
 * treating an invoice as "sent and awaiting payment" vs. "never sent."
 */
export async function getBusinessInvoices(businessId: string, page = 1, pageSize = 25): Promise<WaveInvoice[]> {
  const data = await waveGraphQL<{ business: { invoices: { edges: Array<{ node: WaveInvoice }> } } }>(
    `query($businessId: ID!, $page: Int!, $pageSize: Int!) {
      business(id: $businessId) {
        invoices(page: $page, pageSize: $pageSize) {
          edges {
            node {
              id
              invoiceNumber
              status
              total { value }
              amountDue { value }
              customer { name }
              createdAt
              dueDate
              lastSentAt
              lastSentVia
            }
          }
        }
      }
    }`,
    { businessId, page, pageSize }
  );
  return data.business.invoices.edges.map((e) => e.node);
}
