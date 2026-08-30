/**
 * AUTO-14 Data Reconciliation replacement (MHFA-RECONCILE-01) — SCOPED,
 * REPORT ONLY, pure detection logic.
 *
 * Real live spec confirmed via Notion 2026-08-07 (MHFA Automation Registry,
 * "Data Reconciliation" build sheet, Risk: High): compare Forms/Excel
 * intake, TRAIN OS records, Wave payments, MHFA Connect status,
 * attendance, and certification across systems; identify orphan/
 * duplicate/mismatch records; never auto-delete. The real build sheet's
 * own "Connection values still required" lists "tolerance rules" (e.g.
 * what dollar/day mismatch counts as significant) and "report
 * destination" as undefined -- inventing either would mean guessing a
 * business threshold or a new persistence target, so this is deliberately
 * scoped down to checks that need neither: internal Notion consistency
 * only (duplicate registrations by email, registrations with no linked
 * session). Wave-vs-Notion payment reconciliation is intentionally NOT
 * duplicated here -- that's already covered by MHFA-PAY-01
 * (reconcile-payments.ts). Cross-system reconciliation against Forms/Excel
 * intake, MHFA Connect, attendance, and certification -- the harder,
 * multi-source part of the real spec -- is not attempted; it needs
 * Tiana's tolerance rules first. Never writes or deletes anything -- see
 * data-consistency-check.ts.
 */

export interface RegistrationForConsistency {
  pageId: string;
  registrationCode: string;
  email: string;
  sessionPageId?: string;
}

export interface DuplicateEmailGroup {
  email: string;
  registrations: Array<{ pageId: string; registrationCode: string }>;
}

/** Real duplicate detection -- no tolerance rule needed, an exact email match is either a duplicate or it isn't. */
export function findDuplicateEmails(registrations: RegistrationForConsistency[]): DuplicateEmailGroup[] {
  const byEmail = new Map<string, RegistrationForConsistency[]>();
  for (const reg of registrations) {
    const key = reg.email.trim().toLowerCase();
    const existing = byEmail.get(key) ?? [];
    existing.push(reg);
    byEmail.set(key, existing);
  }
  return Array.from(byEmail.entries())
    .filter(([, regs]) => regs.length > 1)
    .map(([email, regs]) => ({ email, registrations: regs.map((r) => ({ pageId: r.pageId, registrationCode: r.registrationCode })) }));
}

/** Real orphan detection -- a registration with no Session relation, regardless of tolerance rules. */
export function findOrphanRegistrations(registrations: RegistrationForConsistency[]): Array<{ pageId: string; registrationCode: string }> {
  return registrations.filter((r) => !r.sessionPageId).map((r) => ({ pageId: r.pageId, registrationCode: r.registrationCode }));
}
