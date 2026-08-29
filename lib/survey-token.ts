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

export function generateSurveyToken(auditId: string): string {
  const nonce = randomBytes(8).toString("base64url");
  const payload = `${Buffer.from(auditId).toString("base64url")}.${nonce}`;
  const mac = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifySurveyToken(token: string): string | null {
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
  return Buffer.from(parts[0]!, "base64url").toString("utf-8");
}
