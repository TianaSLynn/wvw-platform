import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest } from "@/lib/api-response";

interface TeamsNotification {
  title: string;
  body: string;
  color?: "good" | "warning" | "attention" | "default";
  facts?: Array<{ name: string; value: string }>;
  actionUrl?: string;
  actionLabel?: string;
}

async function sendTeamsNotification(webhookUrl: string, notification: TeamsNotification) {
  // Teams Adaptive Card format
  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: notification.title,
              weight: "Bolder",
              size: "Medium",
              color: notification.color === "attention" ? "Attention" : notification.color === "good" ? "Good" : notification.color === "warning" ? "Warning" : "Default",
            },
            {
              type: "TextBlock",
              text: notification.body,
              wrap: true,
              color: "Default",
            },
            ...(notification.facts?.length
              ? [{
                  type: "FactSet",
                  facts: notification.facts,
                }]
              : []),
          ],
          actions: notification.actionUrl
            ? [{ type: "Action.OpenUrl", title: notification.actionLabel ?? "View in WVW", url: notification.actionUrl }]
            : [],
        },
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });

  if (!res.ok) throw new Error(`Teams webhook failed: ${res.status}`);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json() as TeamsNotification;
  if (!body.title || !body.body) return badRequest("Missing title or body");

  const integration = await db.integration.findFirst({
    where: { orgId: user.orgId, slug: "microsoft-teams", status: "ACTIVE" },
  });

  if (!integration) return badRequest("Microsoft Teams integration not connected.");

  const config = integration.config as Record<string, string>;
  const webhookUrl = config["Webhook URL"] ?? config["webhookUrl"];

  if (!webhookUrl) return badRequest("No Teams webhook URL configured.");

  try {
    await sendTeamsNotification(webhookUrl, body);

    await db.activityLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: `Teams notification sent — ${body.title}`,
        entityType: "Integration",
        entityId: integration.id,
      },
    }).catch(() => {});

    return ok({ sent: true });
  } catch (e) {
    return badRequest((e as Error).message);
  }
}
