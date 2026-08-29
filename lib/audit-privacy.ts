type AuditCustomFields = Record<string, unknown> | null | undefined;

export const DEFAULT_ANONYMITY_THRESHOLD = 5;
export const PARTICIPANT_CONSENT_VERSION = "WVW-OHI-CONSENT-2026-08-29";

export function getAnonymityThreshold(customFields: AuditCustomFields): number {
  const raw = customFields?.minimumAnonymousResponses;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_ANONYMITY_THRESHOLD;
  return Math.max(5, Math.min(50, Math.floor(parsed)));
}

export function isAnonymousAudit(customFields: AuditCustomFields): boolean {
  return customFields?.anonymousCollection !== false;
}

export function getPrivacyConfigurationStatus(customFields: AuditCustomFields) {
  const responseRetentionDays = Number(customFields?.responseRetentionDays);
  const evidenceRetentionDays = Number(customFields?.evidenceRetentionDays);
  const deletionPolicy = customFields?.deletionPolicy;
  const validPolicy = ["DELETE_AFTER_RETENTION", "ANONYMIZE_AFTER_RETENTION", "LEGAL_HOLD_OVERRIDE"].includes(String(deletionPolicy));
  const ready = Number.isInteger(responseRetentionDays) && responseRetentionDays >= 30
    && Number.isInteger(evidenceRetentionDays) && evidenceRetentionDays >= 30
    && validPolicy;
  return { ready, responseRetentionDays: ready ? responseRetentionDays : null, evidenceRetentionDays: ready ? evidenceRetentionDays : null, deletionPolicy: validPolicy ? String(deletionPolicy) : null };
}

export function getReleaseStatus(responseCount: number, threshold: number) {
  return {
    released: responseCount >= threshold,
    responseCount,
    threshold,
    responsesNeeded: Math.max(0, threshold - responseCount),
  };
}

type ProtectionStep = {
  title: string;
  sortOrder: number;
  status: string;
  documentRequired: boolean;
  documentCollected: boolean;
};

export function getCollectionGateStatus(questionCount: number, steps: ProtectionStep[] | null | undefined) {
  if (questionCount < 1) return { ready: false, reason: "Collection cannot open because this audit has no questions." };
  if (!steps) return { ready: false, reason: "Collection cannot open until client onboarding is created." };
  const protectionSteps = steps.filter((step) => step.sortOrder <= 9);
  const incomplete = protectionSteps.filter((step) => !["COMPLETED", "SKIPPED"].includes(step.status));
  if (protectionSteps.length < 9 || incomplete.length > 0) {
    const next = incomplete[0]?.title ?? "Complete the first nine onboarding protection steps";
    return { ready: false, reason: `Collection protection gate is incomplete. Next required step: ${next}.` };
  }
  const missingDocument = protectionSteps.find((step) => step.documentRequired && !step.documentCollected);
  if (missingDocument) {
    return { ready: false, reason: `Collection protection gate is incomplete. Record the required document for: ${missingDocument.title}.` };
  }
  return { ready: true, reason: null };
}
