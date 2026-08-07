/**
 * AUTO-09 Attendance and Closeout replacement, closeout portion
 * (MHFA-CLOSEOUT-01) — REPORT ONLY, pure aggregation logic.
 *
 * Real live spec confirmed via Notion 2026-08-07 (MHFA Automation Registry,
 * "Attendance and Closeout" build sheet, Risk: High): the attendance-intake
 * half is already covered by MHFA-ATT-01 (FORM-MHFA-014, dev-tested in an
 * earlier session). What's missing is "mark session closeout status when
 * reconciled" -- but the real build sheet's own "Connection values still
 * required" lists "attendance status rules" and "minimum-hours rule" as
 * undefined, and MHFA-01's real `Closeout Complete` checkbox is a genuine
 * confirmatory claim about a real session ("this is fully reconciled") that
 * shouldn't be set automatically without Tiána's own definition of
 * "reconciled." So this only aggregates and reports readiness -- whether
 * every registration linked to an ended session has a recorded (non-
 * Pending) Attendance Status -- never writes `Closeout Complete` itself.
 * See session-closeout-check.ts.
 */

export type AttendanceStatusName = "Pending" | "Partial" | "Attended" | "No Show";

export interface SessionForCloseout {
  pageId: string;
  sessionCode: string;
  endReferenceIso: string; // End Date if set, else Start Date -- "session ends" per the real trigger
}

export interface RegistrationAttendance {
  pageId: string;
  attendanceStatus: AttendanceStatusName;
}

export interface SessionCloseoutSummary {
  sessionPageId: string;
  sessionCode: string;
  endReferenceIso: string;
  totalRegistrations: number;
  attended: number;
  noShow: number;
  partial: number;
  pending: number;
  readyForCloseout: boolean;
}

export function summarizeCloseout(session: SessionForCloseout, registrations: RegistrationAttendance[]): SessionCloseoutSummary {
  const counts = { attended: 0, noShow: 0, partial: 0, pending: 0 };
  for (const reg of registrations) {
    if (reg.attendanceStatus === "Attended") counts.attended++;
    else if (reg.attendanceStatus === "No Show") counts.noShow++;
    else if (reg.attendanceStatus === "Partial") counts.partial++;
    else counts.pending++;
  }
  return {
    sessionPageId: session.pageId,
    sessionCode: session.sessionCode,
    endReferenceIso: session.endReferenceIso,
    totalRegistrations: registrations.length,
    ...counts,
    // "Ready" only means every registrant has SOME recorded status -- not a
    // judgment about hours or completion eligibility, which needs Tiana's
    // still-undefined minimum-hours rule.
    readyForCloseout: registrations.length > 0 && counts.pending === 0,
  };
}
