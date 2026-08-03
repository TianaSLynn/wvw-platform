import { ulid } from "ulid";

/**
 * Correlation ID standard: WVW|{DOMAIN}|{AUTOMATION_CODE}|{YYYYMMDD}|{ULID}
 * e.g. WVW|MHFA|MHFA-REG-01|20260803|01J...
 */

const CORRELATION_ID_PATTERN =
  /^WVW\|[A-Z]+\|[A-Z0-9-]+\|\d{8}\|[0-9A-HJKMNP-TV-Z]{26}$/;

export function generateCorrelationId(domain: string, automationCode: string, at: Date = new Date()): string {
  const yyyymmdd = at.toISOString().slice(0, 10).replace(/-/g, "");
  return `WVW|${domain.toUpperCase()}|${automationCode.toUpperCase()}|${yyyymmdd}|${ulid()}`;
}

export function isValidCorrelationId(value: string): boolean {
  return CORRELATION_ID_PATTERN.test(value);
}

export interface ParsedCorrelationId {
  domain: string;
  automationCode: string;
  date: string;
  ulid: string;
}

export function parseCorrelationId(value: string): ParsedCorrelationId | null {
  if (!isValidCorrelationId(value)) return null;
  const [, domain, automationCode, date, id] = value.split("|");
  return { domain, automationCode, date, ulid: id };
}
