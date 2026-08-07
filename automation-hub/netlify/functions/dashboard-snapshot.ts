import type { Handler } from "@netlify/functions";
import { queryDatabaseLegacy, NotionNotConfiguredError } from "../../packages/integration-notion/src/client.js";
import { countByField, sum } from "../../packages/integration-notion/src/dashboard-aggregation.js";

/**
 * AUTO-12 Executive Dashboard Refresh replacement (MHFA-DASHBOARD-01).
 *
 * GET /.netlify/functions/dashboard-snapshot
 *
 * Computes the same aggregates the real spec describes (sessions, seats,
 * payments, readiness, attendance, certification, exceptions) live from
 * MHFA-01/02/05, instead of writing to a "dashboard snapshot destination"
 * that doesn't exist yet -- see
 * packages/integration-notion/src/dashboard-aggregation.ts. Read-only, Risk:
 * Low, but still feature-flag gated for consistency with every other path
 * in this hub.
 */

const MHFA_01_DATABASE_ID = "89649428-f379-405d-a66f-b9215d757b42";
const MHFA_02_DATABASE_ID = "790b794d-fa82-40eb-beb1-b24be9d0ef01";
const MHFA_05_DATABASE_ID = "0e62593f-c1df-4cb3-a156-284947e11d43";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  if (process.env.MHFA_DASHBOARD_01_ENABLED !== "true") {
    return json(200, {
      status: "dry_run_feature_disabled",
      note: "MHFA_DASHBOARD_01_ENABLED is not set. This endpoint is read-only regardless of this flag, but stays consistent with every other path in this hub by still gating on a flag.",
    });
  }

  let sessionsResult, registrationsResult, exceptionsResult;
  try {
    [sessionsResult, registrationsResult, exceptionsResult] = await Promise.all([
      queryDatabaseLegacy(MHFA_01_DATABASE_ID),
      queryDatabaseLegacy(MHFA_02_DATABASE_ID),
      queryDatabaseLegacy(MHFA_05_DATABASE_ID),
    ]);
  } catch (err) {
    if (err instanceof NotionNotConfiguredError) {
      return json(502, { status: "notion_not_configured" });
    }
    return json(502, { status: "notion_query_failed", detail: String(err) });
  }

  const sessions = sessionsResult.results.map((p) => (p.properties as Record<string, any>).Status?.status?.name as string | undefined);

  const registrations = registrationsResult.results.map((p) => p.properties as Record<string, any>);
  const seatStatuses = registrations.map((r) => r["Seat Status"]?.status?.name as string | undefined);
  const paymentStatuses = registrations.map((r) => r["Payment Status"]?.status?.name as string | undefined);
  const mhfaConnectStatuses = registrations.map((r) => r["MHFA Connect Status"]?.status?.name as string | undefined);
  const attendanceStatuses = registrations.map((r) => r["Attendance Status"]?.status?.name as string | undefined);
  const certificateStatuses = registrations.map((r) => r["Certificate Status"]?.status?.name as string | undefined);
  const amountPaid = registrations.map((r) => r["Amount Paid"]?.number as number | undefined);
  const amountDue = registrations.map((r) => r["Amount Due"]?.number as number | undefined);

  const exceptions = exceptionsResult.results.map((p) => p.properties as Record<string, any>);
  const exceptionStatuses = exceptions.map((e) => e.Status?.status?.name as string | undefined);
  const exceptionTypes = exceptions.map((e) => e["Exception Type"]?.select?.name as string | undefined);

  return json(200, {
    status: "computed_live",
    refreshedAt: new Date().toISOString(),
    sessions: {
      total: sessions.length,
      byStatus: countByField(sessions),
    },
    seats: {
      totalRegistrations: registrations.length,
      byStatus: countByField(seatStatuses),
    },
    payments: {
      byStatus: countByField(paymentStatuses),
      totalAmountPaid: sum(amountPaid),
      totalAmountDue: sum(amountDue),
    },
    mhfaConnectReadiness: {
      byStatus: countByField(mhfaConnectStatuses),
    },
    attendance: {
      byStatus: countByField(attendanceStatuses),
    },
    certification: {
      byStatus: countByField(certificateStatuses),
    },
    exceptions: {
      total: exceptions.length,
      byStatus: countByField(exceptionStatuses),
      byType: countByField(exceptionTypes),
    },
    note: "Computed live from real Notion data at request time -- not a persisted snapshot (no 'dashboard snapshot destination' exists yet, per the real AUTO-12 build sheet).",
  });
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
