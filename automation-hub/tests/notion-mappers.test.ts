import { describe, it, expect } from "vitest";
import {
  registrationToNotionProperties,
  buildNotesWithCorrelationId,
  extractCorrelationIdFromNotes,
  type HubRegistration,
} from "../packages/integration-notion/src/mappers.js";

const baseReg: HubRegistration = {
  correlationId: "WVW|MHFA|MHFA-REG-01|20260803|01J000000000000000000000",
  firstName: "Jordan",
  lastName: "Rivera",
  email: "jordan@example.com",
  registrationCode: "REG-2026-0001",
  paymentStatus: "pending",
  accommodationRequested: false,
};

describe("buildNotesWithCorrelationId / extractCorrelationIdFromNotes", () => {
  it("round-trips a correlation id through Notes", () => {
    const notes = buildNotesWithCorrelationId(baseReg.correlationId);
    expect(extractCorrelationIdFromNotes(notes)).toBe(baseReg.correlationId);
  });

  it("preserves existing notes content alongside the correlation id", () => {
    const notes = buildNotesWithCorrelationId(baseReg.correlationId, "Learner called about session date.");
    expect(notes).toContain("Learner called about session date.");
    expect(extractCorrelationIdFromNotes(notes)).toBe(baseReg.correlationId);
  });

  it("returns null when no correlation id line is present", () => {
    expect(extractCorrelationIdFromNotes("just a regular note")).toBeNull();
  });
});

describe("registrationToNotionProperties", () => {
  it("maps required fields to the real Notion property shapes", () => {
    const props = registrationToNotionProperties(baseReg);
    expect((props["Registration Code"] as any).title[0].text.content).toBe("REG-2026-0001");
    expect((props.Email as any).email).toBe("jordan@example.com");
    expect((props["Payment Status"] as any).status.name).toBe("Pending");
    expect((props["Accommodation Requested"] as any).checkbox).toBe(false);
  });

  it("embeds the correlation id in Notes since no dedicated property exists", () => {
    const props = registrationToNotionProperties(baseReg);
    const notesText = (props.Notes as any).rich_text[0].text.content as string;
    expect(extractCorrelationIdFromNotes(notesText)).toBe(baseReg.correlationId);
  });

  it("maps 'failed' payment status to Pending and preserves the real status in Notes", () => {
    const props = registrationToNotionProperties({ ...baseReg, paymentStatus: "failed" });
    expect((props["Payment Status"] as any).status.name).toBe("Pending");
    const notesText = (props.Notes as any).rich_text[0].text.content as string;
    expect(notesText).toContain("failed");
  });

  it("only includes optional relation fields when page ids are known", () => {
    const withoutRelations = registrationToNotionProperties(baseReg);
    expect(withoutRelations.Session).toBeUndefined();
    expect(withoutRelations.Organization).toBeUndefined();

    const withRelations = registrationToNotionProperties({
      ...baseReg,
      sessionPageId: "session-page-id",
      organizationPageId: "org-page-id",
    });
    expect((withRelations.Session as any).relation[0].id).toBe("session-page-id");
    expect((withRelations.Organization as any).relation[0].id).toBe("org-page-id");
  });
});
