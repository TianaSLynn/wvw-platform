/**
 * Clerk Workflow HTTP action endpoint.
 *
 * Configure in Clerk Dashboard → Workflows:
 *   Trigger: user.created | user.updated | user.deleted
 *   Step: HTTP Request
 *     URL:    {APP_URL}/api/webhooks/clerk
 *     Method: POST
 *     Headers:
 *       Authorization: Bearer {CLERK_WORKFLOW_SECRET}
 *     Body: Use Clerk's default event payload
 *
 * Note: profile data (name, email, avatar) is also synced automatically
 * on every authenticated request via getCurrentUser(), so this endpoint
 * is only strictly required for user.deleted events.
 */

import { provisionUser } from "@/lib/auth";
import { db } from "@/lib/db";

type ClerkUserEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string; id: string }>;
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string;
    organization_memberships?: Array<{ organization: { id: string } }>;
    deleted?: boolean;
  };
};

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

export async function POST(req: Request) {
  // Verify bearer token — set CLERK_WORKFLOW_SECRET in Clerk Dashboard Workflow header
  const secret = process.env.CLERK_WORKFLOW_SECRET ?? process.env.CLERK_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (token !== secret) return unauthorized();
  }
  // If no secret is configured, allow the request (dev mode)

  let event: ClerkUserEvent;
  try {
    event = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created" || type === "user.updated") {
    const primaryEmail = data.email_addresses?.find((e) => e.id === data.primary_email_address_id)
                      ?? data.email_addresses?.[0];
    if (!primaryEmail) return new Response("No primary email", { status: 400 });

    const clerkOrgId = data.organization_memberships?.[0]?.organization?.id;

    await provisionUser({
      clerkUserId: data.id,
      clerkOrgId,
      email:      primaryEmail.email_address,
      firstName:  data.first_name  ?? "",
      lastName:   data.last_name   ?? "",
      avatarUrl:  data.image_url,
    });
  }

  if (type === "user.deleted" && data.id) {
    await db.user.updateMany({
      where: { clerkUserId: data.id },
      data: { status: "INACTIVE", deletedAt: new Date() },
    });
  }

  return new Response("OK", { status: 200 });
}
