/**
 * Survey token — encodes auditId + optional respondent slot into a signed URL-safe token.
 * Format: base64url(auditId).base64url(nonce).hmac
 */
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret = process.env.ENCRYPTION_KEY;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY is required for survey invitations");
  }
  return "wvw-local-development-only";
}

export type SurveyTokenDetails = { auditId: string; participantId?: string };

export function generateSurveyToken(auditId: string, participantId?: string): string {
  const nonce = randomBytes(8).toString("base64url");
  const details: SurveyTokenDetails = participantId ? { auditId, participantId } : { auditId };
  const payload = `${Buffer.from(JSON.stringify(details)).toString("base64url")}.${nonce}`;
  const mac = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifySurveyTokenDetails(token: string): SurveyTokenDetails | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", getSecret()).update(payload).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(parts[2]!, "base64url");
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) return null;
  const decoded = Buffer.from(parts[0]!, "base64url").toString("utf-8");
  try {
    const details = JSON.parse(decoded) as Partial<SurveyTokenDetails>;
    if (!details.auditId || typeof details.auditId !== "string") return null;
    if (details.participantId !== undefined && typeof details.participantId !== "string") return null;
    return { auditId: details.auditId, ...(details.participantId ? { participantId: details.participantId } : {}) };
  } catch {
    // Backward compatibility for already-issued general survey links.
    return decoded ? { auditId: decoded } : null;
  }
}

export function verifySurveyToken(token: string): string | null {
  return verifySurveyTokenDetails(token)?.auditId ?? null;
}
