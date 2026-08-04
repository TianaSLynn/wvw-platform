/**
 * Thin Notion REST API client. No @notionhq/client dependency — the surface
 * area needed here (query a data source, create a page, update a page) is
 * small enough that a direct fetch wrapper is simpler to audit.
 *
 * Credential-gated like every other external integration in this hub: if
 * NOTION_API_KEY isn't set, every call throws NotionNotConfiguredError
 * instead of silently no-op'ing, so a caller can't mistake "not configured"
 * for "ran and did nothing." No real call in this codebase has been
 * exercised against the live Notion API — there is no NOTION_API_KEY
 * available in this environment (see docs/CREDENTIALS_AND_MANUAL_ACTIONS.md).
 */

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export class NotionNotConfiguredError extends Error {
  constructor() {
    super("NOTION_API_KEY is not set — cannot call the Notion API.");
    this.name = "NotionNotConfiguredError";
  }
}

export class NotionApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`Notion API error ${status}: ${JSON.stringify(body)}`);
    this.name = "NotionApiError";
  }
}

function requireApiKey(): string {
  const key = process.env.NOTION_API_KEY;
  if (!key) throw new NotionNotConfiguredError();
  return key;
}

async function notionFetch(path: string, init: RequestInit): Promise<unknown> {
  const key = requireApiKey();
  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${key}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json();
  if (!res.ok) throw new NotionApiError(res.status, body);
  return body;
}

export interface NotionQueryResult {
  results: Array<{ id: string; properties: Record<string, unknown>; url: string }>;
  has_more: boolean;
  next_cursor: string | null;
}

/** Query a data source (governance: always search before create). */
export async function queryDataSource(
  dataSourceId: string,
  filter?: Record<string, unknown>,
  startCursor?: string
): Promise<NotionQueryResult> {
  return notionFetch(`/data_sources/${dataSourceId}/query`, {
    method: "POST",
    body: JSON.stringify({ filter, start_cursor: startCursor }),
  }) as Promise<NotionQueryResult>;
}

export interface NotionPage {
  id: string;
  url: string;
  properties: Record<string, unknown>;
}

/**
 * Create a page. Returns the real created page's id/url — callers must
 * never claim a Notion write succeeded without this returned id (governance).
 */
export async function createPage(databaseId: string, properties: Record<string, unknown>): Promise<NotionPage> {
  return notionFetch("/pages", {
    method: "POST",
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  }) as Promise<NotionPage>;
}

export async function updatePage(pageId: string, properties: Record<string, unknown>): Promise<NotionPage> {
  return notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  }) as Promise<NotionPage>;
}

/** Simple email-equals filter helper for the common "search before create" case. */
export function emailFilter(propertyName: string, email: string) {
  return { property: propertyName, email: { equals: email } };
}
