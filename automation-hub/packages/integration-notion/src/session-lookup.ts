/**
 * Session lookup against MHFA-01 | Training Sessions -- the database the
 * LIVE registration form actually links to (not TRAIN-03, a separate,
 * disconnected "TRAIN OS" system with its own Sessions database -- see
 * docs/DECISION_REGISTER.md Decision 8). Confirmed live schema 2026-08-11:
 * "Session Code" (title), "Course Name" (plain text), "Start Date"/"Start
 * Time" (Start Time is a plain text field, not part of the date object),
 * "Time Zone" (select: ET/CT/MT/PT/AKT/HT), "Delivery Format" (select).
 */
import { queryDatabaseLegacy, titleFilter, NotionApiError } from "./client.js";

const MHFA_01_DATABASE_ID = "89649428-f379-405d-a66f-b9215d757b42";

const TIME_ZONE_IANA_MAP: Record<string, string> = {
  ET: "America/New_York",
  CT: "America/Chicago",
  MT: "America/Denver",
  PT: "America/Los_Angeles",
  AKT: "America/Anchorage",
  HT: "Pacific/Honolulu",
};

export interface Mhfa01Session {
  pageId: string;
  sessionCode: string;
  courseName?: string;
  startDate?: string; // ISO date, e.g. "2026-09-15"
  startTime?: string; // as stored, e.g. "10:00 AM"
  timeZoneAbbreviation?: string; // "ET", "CT", etc.
  timeZoneIana?: string; // "America/New_York", derived -- undefined if abbreviation isn't a known mapping
  deliveryFormat?: string;
}

/** Search-before-create governance: find the real session a form's `selected-session` value refers to. Returns null (not an error) if no match -- caller decides how to handle a genuinely missing session. */
export async function findSessionByCode(sessionCode: string): Promise<Mhfa01Session | null> {
  const result = await queryDatabaseLegacy(MHFA_01_DATABASE_ID, titleFilter("Session Code", sessionCode));
  if (result.results.length === 0) return null;

  const page = result.results[0];
  const props = page.properties as Record<string, any>;
  const timeZoneAbbreviation = props["Time Zone"]?.select?.name as string | undefined;

  return {
    pageId: page.id,
    sessionCode: props["Session Code"]?.title?.[0]?.plain_text ?? sessionCode,
    courseName: props["Course Name"]?.rich_text?.[0]?.plain_text,
    startDate: props["Start Date"]?.date?.start,
    startTime: props["Start Time"]?.rich_text?.[0]?.plain_text,
    timeZoneAbbreviation,
    timeZoneIana: timeZoneAbbreviation ? TIME_ZONE_IANA_MAP[timeZoneAbbreviation] : undefined,
    deliveryFormat: props["Delivery Format"]?.select?.name,
  };
}

export { NotionApiError };
