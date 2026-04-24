/**
 * POST /api/integrations/ms365/notify
 * Send a custom message to Teams or a structured audit/finding notification.
 * Body: { type: "teams-message" | "teams-finding" | "teams-audit", ...payload }
 */
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api-response";
import { getTeamsWebhook, postToTeams } from "@/lib/ms365";
import { z } from "zod";

const schema = z.discriminatedUnion("type", [
  z.object({
    type:    z.literal("teams-message"),
    title:   z.string().min(1),
    text:    z.string().min(1),
    color:   z.enum(["default", "warning", "attention", "good"]).optional(),
    actionUrl:   z.string().optional(),
    actionLabel: z.string().optional(),
  }),
]);

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const webhook = await getTeamsWebhook(user.orgId);
    if (!webhook) return badRequest("Microsoft Teams integration not connected. Go to Settings → Integrations.");

    if (parsed.data.type === "teams-message") {
      await postToTeams(webhook, {
        title:       parsed.data.title,
        text:        parsed.data.text,
        color:       parsed.data.color,
        actionUrl:   parsed.data.actionUrl,
        actionLabel: parsed.data.actionLabel,
      });
      return ok({ sent: true });
    }

    return badRequest("Unknown notification type");
  } catch (e) {
    return serverError(e);
  }
}
