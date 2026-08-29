/** Clerk webhook endpoint for user lifecycle synchronization. */

import { Webhook } from "svix";
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
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) return unauthorized();

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) return unauthorized();

  const payload = await req.text();
  let event: ClerkUserEvent;
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return unauthorized();
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
