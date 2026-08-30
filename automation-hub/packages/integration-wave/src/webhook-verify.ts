/**
 * Wave webhook signature verification. Wave signs webhook deliveries the
 * same way Stripe does: the `x-wave-signature` header contains
 * `t=<unix-seconds>,v1=<hex-hmac>`, and the signed payload is the literal
 * string `{timestamp}.{raw_body}`, HMAC-SHA256'd with the webhook's secret
 * token (shown once in Wave's Developer Portal after the endpoint URL is
 * saved). Confirmed against Wave's own Webhooks Setup Guide, 2026-08-11.
 *
 * The raw body (not a re-serialized JSON.stringify of the parsed object)
 * must be used -- any reformatting breaks the signature.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export class WaveWebhookNotConfiguredError extends Error {
  constructor() {
    super("WAVE_WEBHOOK_SECRET is not set -- cannot verify webhook signatures.");
    this.name = "WaveWebhookNotConfiguredError";
  }
}

const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

export interface VerifyResult {
  valid: boolean;
  reason?: "missing_header" | "malformed_header" | "timestamp_skew" | "signature_mismatch";
}

function parseSignatureHeader(header: string): { timestamp: string; signature: string } | null {
  const parts = Object.fromEntries(
    header
      .split(",")
      .map((part) => part.trim().split("="))
      .filter((kv): kv is [string, string] => kv.length === 2)
  );
  if (!parts.t || !parts.v1) return null;
  return { timestamp: parts.t, signature: parts.v1 };
}

/** Pure, testable verification -- no network calls, no env var reads (secret is passed in). */
export function verifyWaveWebhookSignature(rawBody: string, signatureHeader: string | undefined | null, secret: string, now: Date = new Date()): VerifyResult {
  if (!signatureHeader) return { valid: false, reason: "missing_header" };

  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return { valid: false, reason: "malformed_header" };

  const timestampSeconds = Number(parsed.timestamp);
  if (!Number.isFinite(timestampSeconds)) return { valid: false, reason: "malformed_header" };

  const skewSeconds = Math.abs(now.getTime() / 1000 - timestampSeconds);
  if (skewSeconds > MAX_TIMESTAMP_SKEW_SECONDS) return { valid: false, reason: "timestamp_skew" };

  const signedPayload = `${parsed.timestamp}.${rawBody}`;
  const expectedSignature = createHmac("sha256", secret).update(signedPayload).digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const actualBuf = Buffer.from(parsed.signature, "hex");
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return { valid: false, reason: "signature_mismatch" };
  }

  return { valid: true };
}

export function requireWebhookSecret(): string {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret) throw new WaveWebhookNotConfiguredError();
  return secret;
}
