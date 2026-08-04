import { describe, it, expect } from "vitest";
import { mhfaAttendanceSchema } from "../packages/validation/src/mhfa-attendance.schema.js";
import { mhfaEvaluationSchema, splitEvaluationFreeText } from "../packages/validation/src/mhfa-evaluation.schema.js";
import { mhfaComplaintSchema, toGeneralComplaintPointer, toRestrictedComplaintRecord } from "../packages/validation/src/mhfa-complaint.schema.js";
import { handler } from "../netlify/functions/intake.js";

const validAttendance = {
  "bot-field": "",
  "session-id": "2026-09-12-adult-mhfa",
  learner: "learner_abc123",
  "attendance-status": "present",
};

const validEvaluation = {
  "bot-field": "",
  session: "2026-09-12-adult-mhfa",
  "improvement-suggestions": "More breakout time.",
};

const validComplaint = {
  "bot-field": "",
  name: "Riley Chen",
  email: "riley@example.org",
  "concern-type": "instructor-conduct",
  "concern-or-incident": "The instructor dismissed a question about accommodations.",
};

describe("mhfaAttendanceSchema", () => {
  it("accepts a valid record", () => {
    expect(mhfaAttendanceSchema.safeParse(validAttendance).success).toBe(true);
  });

  it("requires session-id and learner", () => {
    expect(mhfaAttendanceSchema.safeParse({ ...validAttendance, "session-id": "" }).success).toBe(false);
  });
});

describe("mhfaEvaluationSchema", () => {
  it("accepts a valid evaluation", () => {
    expect(mhfaEvaluationSchema.safeParse(validEvaluation).success).toBe(true);
  });

  it("splits free-text fields out of the scores payload", () => {
    const parsed = mhfaEvaluationSchema.parse(validEvaluation);
    const { scores, freeText } = splitEvaluationFreeText(parsed);
    expect(scores["improvement-suggestions"]).toBeUndefined();
    expect(freeText["improvement-suggestions"]).toBe("More breakout time.");
  });
});

describe("mhfaComplaintSchema", () => {
  it("accepts a valid complaint", () => {
    expect(mhfaComplaintSchema.safeParse(validComplaint).success).toBe(true);
  });

  it("requires concern-or-incident", () => {
    expect(mhfaComplaintSchema.safeParse({ ...validComplaint, "concern-or-incident": "" }).success).toBe(false);
  });

  it("never leaks the narrative into the general pointer", () => {
    const parsed = mhfaComplaintSchema.parse(validComplaint);
    const pointer = toGeneralComplaintPointer(parsed);
    expect(JSON.stringify(pointer)).not.toContain("dismissed");
    expect(pointer["complaint-open"]).toBe(true);
  });

  it("keeps the full narrative only in the restricted record", () => {
    const parsed = mhfaComplaintSchema.parse(validComplaint);
    const restricted = toRestrictedComplaintRecord(parsed);
    expect(restricted["concern-or-incident"]).toContain("dismissed");
  });
});

describe("intake handler routing for the new paths", () => {
  it("dispatches FORM-MHFA-014 to MHFA-ATT-01", async () => {
    const body = new URLSearchParams({ "form-name": "FORM-MHFA-014", ...validAttendance }).toString();
    const res: any = await handler({ httpMethod: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body } as any, {} as any, () => {});
    expect(JSON.parse(res.body).automationCode).toBe("MHFA-ATT-01");
    expect(JSON.parse(res.body).hasRestrictedData).toBe(false);
  });

  it("dispatches FORM-MHFA-011 to MHFA-EVAL-01", async () => {
    const body = new URLSearchParams({ "form-name": "FORM-MHFA-011", ...validEvaluation }).toString();
    const res: any = await handler({ httpMethod: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body } as any, {} as any, () => {});
    expect(JSON.parse(res.body).automationCode).toBe("MHFA-EVAL-01");
  });

  it("dispatches FORM-MHFA-013 to MHFA-COMP-01 and always reports restricted data", async () => {
    const body = new URLSearchParams({ "form-name": "FORM-MHFA-013", ...validComplaint }).toString();
    const res: any = await handler({ httpMethod: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body } as any, {} as any, () => {});
    expect(JSON.parse(res.body).automationCode).toBe("MHFA-COMP-01");
    expect(JSON.parse(res.body).hasRestrictedData).toBe(true);
  });
});
