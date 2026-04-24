/**
 * GET  /api/integrations/ms365/calendar?userId=...&start=ISO&end=ISO
 *      Returns calendar events from Outlook for the given user/date range.
 *
 * POST /api/integrations/ms365/calendar
 *      Creates an Outlook calendar event (e.g. audit deadline reminder).
 *      Body: { userId, subject, start, end, body?, location? }
 *
 * Requires active microsoft-365 integration with Calendars.ReadWrite permission.
 */
import { getCurrentUser } from "@/lib/auth";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getMS365Config, getGraphToken, listCalendarEvents, createCalendarEvent } from "@/lib/ms365";
import { z } from "zod";

const createEventSchema = z.object({
  userId:   z.string().min(1),
  subject:  z.string().min(1),
  start:    z.string(),
  end:      z.string(),
  body:     z.string().optional(),
  location: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const userId    = searchParams.get("userId");
    const startDate = searchParams.get("start");
    const endDate   = searchParams.get("end");

    if (!userId || !startDate || !endDate) {
      return badRequest("userId, start, and end are required");
    }

    const cfg = await getMS365Config(user.orgId);
    if (!cfg) return badRequest("Microsoft 365 integration not configured");

    const token  = await getGraphToken(cfg);
    const events = await listCalendarEvents(token, userId, startDate, endDate);
    return ok({ events });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body   = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const cfg = await getMS365Config(user.orgId);
    if (!cfg) return badRequest("Microsoft 365 integration not configured");

    const token = await getGraphToken(cfg);
    const event = await createCalendarEvent(token, parsed.data.userId, {
      subject:  parsed.data.subject,
      start:    parsed.data.start,
      end:      parsed.data.end,
      body:     parsed.data.body,
      location: parsed.data.location,
    });

    return created(event);
  } catch (e) {
    return serverError(e);
  }
}
