import { describe, it, expect } from "vitest";
import { mhfaPreworkSupportSchema, mhfaPaymentReconciliationSchema } from "../packages/validation/src/mhfa-postwork.schema.js";
import { handler } from "../netlify/functions/intake.js";

const validPreworkSupport = {
  "bot-field": "",
  learner: "learner_abc123",
  email: "learner@example.org",
  "support-needed": "Cannot access the pre-work platform.",
};

const validPaymentReconciliation = {
  "bot-field": "",
  "registration-id": "reg_789",
  learner: "learner_abc123",
  "reconciliation-type": "duplicate-charge",
};

describe("mhfaPreworkSupportSchema", () => {
  it("accepts a valid request", () => {
    expect(mhfaPreworkSupportSchema.safeParse(validPreworkSupport).success).toBe(true);
  });
  it("requires learner", () => {
    expect(mhfaPreworkSupportSchema.safeParse({ ...validPreworkSupport, learner: "" }).success).toBe(false);
  });
});

describe("mhfaPaymentReconciliationSchema", () => {
  it("accepts a valid request", () => {
    expect(mhfaPaymentReconciliationSchema.safeParse(validPaymentReconciliation).success).toBe(true);
  });
  it("requires reconciliation-type", () => {
    expect(mhfaPaymentReconciliationSchema.safeParse({ ...validPaymentReconciliation, "reconciliation-type": "" }).success).toBe(false);
  });
});

describe("intake handler routing for MHFA-POST-01", () => {
  it("dispatches FORM-MHFA-010 to MHFA-POST-01", async () => {
    const body = new URLSearchParams({ "form-name": "FORM-MHFA-010", ...validPreworkSupport }).toString();
    const res: any = await handler({ httpMethod: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body } as any, {} as any, () => {});
    expect(JSON.parse(res.body).automationCode).toBe("MHFA-POST-01");
  });

  it("dispatches FORM-MHFA-016 to MHFA-POST-01", async () => {
    const body = new URLSearchParams({ "form-name": "FORM-MHFA-016", ...validPaymentReconciliation }).toString();
    const res: any = await handler({ httpMethod: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body } as any, {} as any, () => {});
    expect(JSON.parse(res.body).automationCode).toBe("MHFA-POST-01");
  });
});
