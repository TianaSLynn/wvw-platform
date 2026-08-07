/**
 * AUTO-13 Exception Alert and Retry replacement (MHFA-EXCEPTION-01)
 * orchestration: the real Notion search-then-create-or-increment calls.
 * See exception-recorder.ts for the spec and the two real schema gaps
 * (no Correlation ID or Occurrence Count properties) this works around.
 */

import { createPage, updatePage, queryDatabaseLegacy } from "./client.js";
import {
  buildInitialExceptionProperties,
  appendOccurrenceNotes,
  countOccurrences,
  matchesOpenException,
  type ExceptionInput,
} from "./exception-recorder.js";

// MHFA-05 | Automation & Exception Queue, confirmed live 2026-08-03 (docs/NOTION_MAPPING.md).
const MHFA_05_DATABASE_ID = "0e62593f-c1df-4cb3-a156-284947e11d43";

export interface RecordExceptionResult {
  action: "created" | "incremented";
  exceptionPageId: string;
  exceptionUrl: string;
  occurrenceCount: number;
}

export async function recordException(input: ExceptionInput, now: Date = new Date()): Promise<RecordExceptionResult> {
  // Narrow the search with a real filter (Workflow Code + Resolution Notes
  // substring match on the correlation ID's own ULID, which is unique
  // enough to avoid scanning the whole queue), then confirm the exact
  // match and open status in code -- there's no dedicated Correlation ID
  // property to filter on directly.
  const ulid = input.correlationId.split("|").pop() ?? input.correlationId;
  const searchResult = await queryDatabaseLegacy(MHFA_05_DATABASE_ID, {
    and: [
      { property: "Workflow Code", select: { equals: input.workflowCode } },
      { property: "Resolution Notes", rich_text: { contains: ulid } },
    ],
  });

  for (const page of searchResult.results) {
    const props = page.properties as Record<string, any>;
    const notes = props["Resolution Notes"]?.rich_text?.[0]?.plain_text as string | undefined;
    const status = props.Status?.status?.name as string | undefined;
    if (matchesOpenException(notes, status, input.correlationId)) {
      const updatedNotes = appendOccurrenceNotes(notes ?? "", input.errorDetail, now);
      const updated = await updatePage(page.id, { "Resolution Notes": { rich_text: [{ text: { content: updatedNotes } }] } });
      return { action: "incremented", exceptionPageId: updated.id, exceptionUrl: updated.url, occurrenceCount: countOccurrences(updatedNotes) };
    }
  }

  const page = await createPage(MHFA_05_DATABASE_ID, buildInitialExceptionProperties(input, now));
  return { action: "created", exceptionPageId: page.id, exceptionUrl: page.url, occurrenceCount: 1 };
}
