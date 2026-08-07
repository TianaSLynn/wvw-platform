/**
 * AUTO-10 Certification Follow-Up replacement (MHFA-CERTFOLLOWUP-01) —
 * REPORT ONLY, pure classification logic.
 *
 * Real live spec confirmed via Notion 2026-08-07 (MHFA Automation Registry,
 * "Certification Follow-Up" build sheet, Risk: Medium): find attended
 * learners whose certification is incomplete, follow up on a cadence, stop
 * when certified, create an exception after a final deadline. Same blocker
 * shape as AUTO-03/07/08: the real build sheet's own "Connection values
 * still required" lists "follow-up days," "final deadline," and "exception
 * owner" as undefined -- so rather than guess a cadence or invent an
 * escalation owner, this only reports which Attended registrations still
 * have an incomplete Certificate Status, with how many days have passed
 * since the session ended so a human can judge urgency. Never writes or
 * sends -- see certification-followup-check.ts.
 */

export type CertificateStatusName = "Pending" | "Processing" | "Issued" | "Not Earned";

export interface SessionInfo {
  pageId: string;
  sessionCode: string;
  endReferenceIso: string;
}

export interface RegistrationCertInfo {
  pageId: string;
  registrationCode: string;
  certificateStatus: CertificateStatusName;
  sessionPageId?: string;
}

export interface CertFollowupCandidate extends RegistrationCertInfo {
  sessionCode?: string;
  daysSinceSessionEnd?: number;
}

/** Issued (done) and Not Earned (terminal, no cert coming) both need no follow-up -- only Pending/Processing do. */
export function needsFollowup(certificateStatus: CertificateStatusName): boolean {
  return certificateStatus === "Pending" || certificateStatus === "Processing";
}

export function classifyCertFollowup(reg: RegistrationCertInfo, sessionsByPageId: Map<string, SessionInfo>, now: Date): CertFollowupCandidate {
  const session = reg.sessionPageId ? sessionsByPageId.get(reg.sessionPageId) : undefined;
  if (!session) return { ...reg };
  const daysSinceSessionEnd = (now.getTime() - new Date(session.endReferenceIso).getTime()) / (1000 * 60 * 60 * 24);
  return { ...reg, sessionCode: session.sessionCode, daysSinceSessionEnd };
}
