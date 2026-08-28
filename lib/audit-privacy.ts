type AuditCustomFields = Record<string, unknown> | null | undefined;

export const DEFAULT_ANONYMITY_THRESHOLD = 5;

export function getAnonymityThreshold(customFields: AuditCustomFields): number {
  const raw = customFields?.minimumAnonymousResponses;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_ANONYMITY_THRESHOLD;
  return Math.max(5, Math.min(50, Math.floor(parsed)));
}

export function isAnonymousAudit(customFields: AuditCustomFields): boolean {
  return customFields?.anonymousCollection !== false;
}

export function getReleaseStatus(responseCount: number, threshold: number) {
  return {
    released: responseCount >= threshold,
    responseCount,
    threshold,
    responsesNeeded: Math.max(0, threshold - responseCount),
  };
}
