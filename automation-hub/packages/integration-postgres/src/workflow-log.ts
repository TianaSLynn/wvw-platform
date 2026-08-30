/**
 * Persists a workflow_executions row for every intake run, closing the
 * "Log the run, related record URLs, status, and timestamps" requirement
 * every single MHFA automation's real spec has listed under "Required
 * Logic" (docs/ from the live MHFA Automation Registry) but that nothing
 * in this hub actually did until Neon persistence was connected
 * (2026-08-07).
 *
 * Best-effort by design: a logging failure must never break the real
 * response to the caller (Notion write success/failure is the thing that
 * actually matters to whoever submitted the form). Errors are swallowed
 * here and surfaced only via Netlify's function logs, never thrown.
 *
 * Feature-flag gated like every other capability in this hub, even though
 * it's purely additive and changes no caller-visible behavior -- kept
 * consistent with the explicit-approval-per-capability pattern used
 * throughout, so it doesn't start writing real data until Tiána reviews it.
 */

import { getPool, PostgresNotConfiguredError } from "./client.js";

export interface WorkflowExecutionLog {
  correlationId: string;
  automationCode: string;
  status: "completed" | "completed_with_warning" | "failed_retryable" | "failed_terminal";
  trigger: string;
  inputSnapshot?: Record<string, unknown>;
  outputSnapshot?: Record<string, unknown>;
  errorCode?: string;
  errorSummary?: string;
  retryable?: boolean;
}

export async function logWorkflowExecution(entry: WorkflowExecutionLog): Promise<void> {
  if (process.env.PERSISTENCE_LOG_ENABLED !== "true") return;

  try {
    const pool = getPool();
    await pool.query(
      `insert into workflow_executions
        (correlation_id, automation_code, status, trigger, input_snapshot, output_snapshot,
         error_code, error_summary, retryable, environment, completed_at, duration_ms)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'production', now(), 0)`,
      [
        entry.correlationId,
        entry.automationCode,
        entry.status,
        entry.trigger,
        entry.inputSnapshot ? JSON.stringify(entry.inputSnapshot) : null,
        entry.outputSnapshot ? JSON.stringify(entry.outputSnapshot) : null,
        entry.errorCode ?? null,
        entry.errorSummary ?? null,
        entry.retryable ?? false,
      ]
    );
  } catch (err) {
    if (err instanceof PostgresNotConfiguredError) {
      console.error("[workflow-log] PERSISTENCE_LOG_ENABLED is true but DATABASE_URL is not set -- skipping log, not failing the request.");
      return;
    }
    console.error("[workflow-log] failed to write workflow_executions row (best-effort, not failing the request):", err);
  }
}
