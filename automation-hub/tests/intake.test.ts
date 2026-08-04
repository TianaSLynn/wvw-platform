import { describe, it, expect } from "vitest";
import {
  mhfaIndividualRegistrationSchema,
  assertRequiredAcknowledgments,
  splitRestrictedFields,
} from "../packages/validation/src/mhfa-individual-registration.schema.js";
import { generateCorrelationId, isValidCorrelationId } from "../packages/shared-types/src/correlation-id.js";
import { canonicalPayloadHash } from "../packages/shared-types/src/payload-hash.js";

const validSubmission = {
  "bot-field": "",
  "first-name": "Jordan",
  "last-name": "Rivera",
  email: "jordan@example.com",
  "selected-session": "2026-09-12-adult-mhfa",
  "payment-type": "self-pay",
  "acknowledge-seat-pending": "true",
  "acknowledge-tuition": "true",
  "acknowledge-prework": "true",
  "acknowledge-attendance": "true",
  "acknowledge-policies": "true",
  "operational-email-consent": "true",
};

describe("mhfaIndividualRegistrationSchema", () => {
  it("accepts a valid submission", () => {
    const result = mhfaIndividualRegistrationSchema.safeParse(validSubmission);
    expect(result.success).toBe(true);
  });

  it("rejects a honeypot-triggered submission", () => {
    const result = mhfaIndividualRegistrationSchema.safeParse({ ...validSubmission, "bot-field": "spam" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required acknowledgment", () => {
    const parsed = mhfaIndividualRegistrationSchema.parse({ ...validSubmission, "acknowledge-policies": "false" });
    const missing = assertRequiredAcknowledgments(parsed);
    expect(missing).toContain("acknowledge-policies");
  });

  it("splits restricted accommodation data out of the general payload", () => {
    const parsed = mhfaIndividualRegistrationSchema.parse({
      ...validSubmission,
      "accommodation-needed": "yes",
      "accommodation-summary": "Requires ASL interpretation.",
    });
    const { general, restricted } = splitRestrictedFields(parsed);
    expect(general["accommodation-summary"]).toBeUndefined();
    expect(restricted["accommodation-summary"]).toBe("Requires ASL interpretation.");
  });
});

describe("correlation ids", () => {
  it("generates a spec-compliant correlation id", () => {
    const id = generateCorrelationId("MHFA", "MHFA-REG-01", new Date("2026-08-03T00:00:00Z"));
    expect(id.startsWith("WVW|MHFA|MHFA-REG-01|20260803|")).toBe(true);
    expect(isValidCorrelationId(id)).toBe(true);
  });

  it("rejects malformed ids", () => {
    expect(isValidCorrelationId("not-a-correlation-id")).toBe(false);
  });
});

describe("canonicalPayloadHash", () => {
  it("is stable regardless of key order", () => {
    const a = canonicalPayloadHash({ x: 1, y: 2 });
    const b = canonicalPayloadHash({ y: 2, x: 1 });
    expect(a).toBe(b);
  });

  it("differs for different content", () => {
    const a = canonicalPayloadHash({ x: 1 });
    const b = canonicalPayloadHash({ x: 2 });
    expect(a).not.toBe(b);
  });
});
