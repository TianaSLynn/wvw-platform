import { describe, it, expect } from "vitest";
import { mhfaCertificateCorrectionSchema } from "../packages/validation/src/mhfa-certificate-correction.schema.js";
import { handler } from "../netlify/functions/intake.js";

const validCorrection = {
  "bot-field": "",
  "current-learner-name": "Jon Smith",
  email: "jon@example.org",
  "information-to-correct": "name-spelling",
  "correct-information": "Jonathan Smith",
};

describe("mhfaCertificateCorrectionSchema", () => {
  it("accepts a valid correction request", () => {
    expect(mhfaCertificateCorrectionSchema.safeParse(validCorrection).success).toBe(true);
  });

  it("requires correct-information", () => {
    expect(mhfaCertificateCorrectionSchema.safeParse({ ...validCorrection, "correct-information": "" }).success).toBe(false);
  });
});

describe("intake handler routing for MHFA-CERT-CORR-01", () => {
  it("dispatches FORM-MHFA-008 to MHFA-CERT-CORR-01", async () => {
    const body = new URLSearchParams({ "form-name": "FORM-MHFA-008", ...validCorrection }).toString();
    const res: any = await handler({ httpMethod: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body } as any, {} as any, () => {});
    expect(JSON.parse(res.body).automationCode).toBe("MHFA-CERT-CORR-01");
  });
});
