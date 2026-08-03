import { describe, it, expect } from "vitest";
import {
  mhfaGroupTrainingInquirySchema,
  splitGroupInquiryRestrictedFields,
} from "../packages/validation/src/mhfa-group-training-inquiry.schema.js";
import {
  mhfaAccommodationRequestSchema,
  toGeneralAccommodationPointer,
  toRestrictedAccommodationRecord,
} from "../packages/validation/src/mhfa-accommodation-request.schema.js";
import { handler } from "../netlify/functions/intake.js";

const validGroupInquiry = {
  "bot-field": "",
  "contact-name": "Morgan Lee",
  email: "morgan@example.org",
  "business-name": "Wesley Shelter",
  "number-of-participants": "12",
};

const validAccommodationRequest = {
  "bot-field": "",
  "learner-name": "Sam Okafor",
  email: "sam@example.org",
  "accommodation-needs": "Requires a screen reader-compatible pre-work platform.",
};

describe("mhfaGroupTrainingInquirySchema", () => {
  it("accepts a valid inquiry", () => {
    expect(mhfaGroupTrainingInquirySchema.safeParse(validGroupInquiry).success).toBe(true);
  });

  it("rejects a non-positive participant count", () => {
    const result = mhfaGroupTrainingInquirySchema.safeParse({ ...validGroupInquiry, "number-of-participants": "0" });
    expect(result.success).toBe(false);
  });

  it("splits accommodation-needs out of the general payload", () => {
    const parsed = mhfaGroupTrainingInquirySchema.parse({ ...validGroupInquiry, "accommodation-needs": "Wheelchair access required." });
    const { general, restricted } = splitGroupInquiryRestrictedFields(parsed);
    expect(general["accommodation-needs"]).toBeUndefined();
    expect(restricted["accommodation-needs"]).toBe("Wheelchair access required.");
  });
});

describe("mhfaAccommodationRequestSchema", () => {
  it("accepts a valid request", () => {
    expect(mhfaAccommodationRequestSchema.safeParse(validAccommodationRequest).success).toBe(true);
  });

  it("requires accommodation-needs to be non-empty", () => {
    const result = mhfaAccommodationRequestSchema.safeParse({ ...validAccommodationRequest, "accommodation-needs": "" });
    expect(result.success).toBe(false);
  });

  it("never leaks accommodation-needs content into the general pointer", () => {
    const parsed = mhfaAccommodationRequestSchema.parse(validAccommodationRequest);
    const pointer = toGeneralAccommodationPointer(parsed);
    expect(JSON.stringify(pointer)).not.toContain("screen reader");
    expect(pointer["accommodation-requested"]).toBe(true);
  });

  it("keeps the full content only in the restricted record", () => {
    const parsed = mhfaAccommodationRequestSchema.parse(validAccommodationRequest);
    const restricted = toRestrictedAccommodationRecord(parsed);
    expect(restricted["accommodation-needs"]).toContain("screen reader");
  });
});

describe("intake handler routing", () => {
  it("dispatches mhfa-group-training-inquiry to MHFA-GRP-01", async () => {
    const body = new URLSearchParams({ "form-name": "mhfa-group-training-inquiry", ...validGroupInquiry }).toString();
    const res = await handler(
      { httpMethod: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body } as any,
      {} as any,
      () => {}
    );
    const parsedBody = JSON.parse((res as any).body);
    expect((res as any).statusCode).toBe(200);
    expect(parsedBody.automationCode).toBe("MHFA-GRP-01");
    expect(parsedBody.persisted).toBe(false);
  });

  it("dispatches mhfa-accommodation-request to MHFA-ACC-01 and always reports restricted data", async () => {
    const body = new URLSearchParams({ "form-name": "mhfa-accommodation-request", ...validAccommodationRequest }).toString();
    const res = await handler(
      { httpMethod: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body } as any,
      {} as any,
      () => {}
    );
    const parsedBody = JSON.parse((res as any).body);
    expect(parsedBody.automationCode).toBe("MHFA-ACC-01");
    expect(parsedBody.hasRestrictedData).toBe(true);
  });

  it("rejects a completely unknown form name", async () => {
    const body = new URLSearchParams({ "form-name": "not-a-real-form" }).toString();
    const res = await handler(
      { httpMethod: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body } as any,
      {} as any,
      () => {}
    );
    expect((res as any).statusCode).toBe(422);
  });
});
