import assert from "node:assert/strict";
import {
  getAnonymityThreshold,
  getReleaseStatus,
  getCollectionGateStatus,
  getPrivacyConfigurationStatus,
} from "../lib/audit-privacy";
import {
  computeAuditScores,
  normalizeScore,
  scoreResponse,
  type ChecklistItemMeta,
} from "../lib/scoring";

process.env.ENCRYPTION_KEY = "audit-engine-test-key-that-is-not-used-in-production";

const tests: Array<{ name: string; run: () => void | Promise<void> }> = [];
const test = (name: string, run: () => void | Promise<void>) => tests.push({ name, run });

test("anonymity threshold never falls below five", () => {
  assert.equal(getAnonymityThreshold({ minimumAnonymousResponses: 2 }), 5);
  assert.equal(getAnonymityThreshold({ minimumAnonymousResponses: 8 }), 8);
  assert.deepEqual(getReleaseStatus(4, 5), {
    released: false,
    responseCount: 4,
    threshold: 5,
    responsesNeeded: 1,
  });
  assert.equal(getReleaseStatus(5, 5).released, true);
});

test("collection cannot open before protection gates pass", () => {
  assert.equal(getCollectionGateStatus(0, []).ready, false);
  const steps = Array.from({ length: 9 }, (_, index) => ({
    title: `Step ${index + 1}`,
    sortOrder: index + 1,
    status: "COMPLETED",
    documentRequired: index === 2,
    documentCollected: index !== 2,
  }));
  assert.match(getCollectionGateStatus(21, steps).reason ?? "", /required document/i);
  steps[2]!.documentCollected = true;
  assert.equal(getCollectionGateStatus(21, steps).ready, true);
  steps[7]!.status = "PENDING";
  assert.match(getCollectionGateStatus(21, steps).reason ?? "", /Step 8/);
});

test("privacy configuration requires retention and deletion decisions", () => {
  assert.equal(getPrivacyConfigurationStatus({}).ready, false);
  assert.equal(getPrivacyConfigurationStatus({ responseRetentionDays: 365, evidenceRetentionDays: 730, deletionPolicy: "DELETE_AFTER_RETENTION" }).ready, true);
  assert.equal(getPrivacyConfigurationStatus({ responseRetentionDays: 10, evidenceRetentionDays: 730, deletionPolicy: "DELETE_AFTER_RETENTION" }).ready, false);
});

test("Likert scoring and reverse scoring are correct", () => {
  assert.equal(normalizeScore(1, false), 0);
  assert.equal(normalizeScore(5, false), 100);
  assert.equal(normalizeScore(1, true), 100);
  assert.equal(scoreResponse("4", "Likert", false), 75);
  assert.equal(scoreResponse("4", "Likert", true), 25);
});

test("audit scoring aggregates separate anonymous submissions", () => {
  const items: ChecklistItemMeta[] = [
    {
      id: "trust-1",
      guidance: null,
      riskWeight: 1,
      sectionId: "leadership",
      sectionTitle: "Leadership Trust & Integrity",
      questionType: "Likert",
      reverseScored: false,
      riskTag: "leadership-trust",
      pathwayTriggers: [],
    },
    {
      id: "fear-1",
      guidance: null,
      riskWeight: 1,
      sectionId: "safety",
      sectionTitle: "Psychological Safety & Communication",
      questionType: "Likert",
      reverseScored: true,
      riskTag: "retaliation-fear",
      pathwayTriggers: ["retaliation-prevention"],
    },
  ];
  const responses = [
    { responses: { "trust-1": "5", "fear-1": "1" } },
    { responses: { "trust-1": "4", "fear-1": "2" } },
    { responses: { "trust-1": "5", "fear-1": "1" } },
    { responses: { "trust-1": "4", "fear-1": "2" } },
    { responses: { "trust-1": "5", "fear-1": "1" } },
  ];
  const result = computeAuditScores(items, responses);
  assert.equal(result.responseCount, 5);
  assert.equal(result.domainScores.length, 2);
  assert.equal(result.domainScores[0]?.answeredCount, 1);
  assert.ok(result.overallScore >= 80);
});

test("survey invitation signatures reject tampering", async () => {
  const { generateSurveyToken, verifySurveyToken, verifySurveyTokenDetails } = await import("../lib/survey-token");
  const token = generateSurveyToken("audit-test-123");
  assert.equal(verifySurveyToken(token), "audit-test-123");
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
  assert.equal(verifySurveyToken(tampered), null);
  const participantToken = generateSurveyToken("audit-test-123", "participant-456");
  assert.deepEqual(verifySurveyTokenDetails(participantToken), { auditId: "audit-test-123", participantId: "participant-456" });
});

async function main() {
  let passed = 0;
  for (const item of tests) {
    await item.run();
    passed += 1;
    console.log(`✓ ${item.name}`);
  }
  console.log(`\n${passed} audit-engine tests passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
