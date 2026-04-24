/**
 * Survey token — encodes auditId + optional respondent slot into a signed URL-safe token.
 * Format: base64url(auditId).base64url(nonce).hmac
 */
import { createHmac, randomBytes } from "crypto";

const SECRET = process.env.ENCRYPTION_KEY ?? "wvw-survey-secret-change-in-production";

export function generateSurveyToken(auditId: string): string {
  const nonce = randomBytes(8).toString("base64url");
  const payload = `${Buffer.from(auditId).toString("base64url")}.${nonce}`;
  const mac = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifySurveyToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (expected !== parts[2]) return null;
  return Buffer.from(parts[0]!, "base64url").toString("utf-8");
}
