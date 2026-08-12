import type { Handler } from "@netlify/functions";
import { runCheck } from "./payment-deadline-cron.js";

/**
 * TEMPORARY, one-time internal test endpoint for AUTO-03/MHFA-PAY-02.
 * Calls the real check logic directly (bypassing MHFA_PAY_02_CRON_ENABLED,
 * which only gates the scheduled handler wrapper, not runCheck itself)
 * against the one real test registration
 * (ZZZ-TEST-DELETE-ME-PAY02, hello@wholisticvibeswellness.com).
 * Confirmed via direct query 2026-08-12 that no other MHFA-02 registration
 * has a Payment Deadline set, so this cannot touch anything real. Delete
 * after use.
 */
export const handler: Handler = async () => {
  const summary = await runCheck();
  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(summary) };
};
