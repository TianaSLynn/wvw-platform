import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { sendWelcomeEmail } from "@/lib/email";

// ─────────────────────────────────────────────────────────────────────────────
//  Auth helpers for Server Components & Route Handlers
// ─────────────────────────────────────────────────────────────────────────────

const ORG_INCLUDE = {
  org: {
    select: {
      id: true, name: true, slug: true,
      logoUrl: true, currency: true, timezone: true, settings: true,
    },
  },
} as const;

/**
 * Get the current authenticated WVW user from the database.
 * Always syncs profile data from Clerk so updates are reflected without a webhook.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  // Always fetch from Clerk — Clerk caches this per-request so it's cheap
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email     = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
                 ?? clerkUser.emailAddresses[0]?.emailAddress
                 ?? "";
  const firstName = clerkUser.firstName ?? email.split("@")[0] ?? "User";
  const lastName  = clerkUser.lastName  ?? "";
  const avatarUrl = clerkUser.imageUrl  ?? undefined;

  // Upsert — provisions new users and keeps existing users in sync with Clerk
  await provisionUser({ clerkUserId: userId, email, firstName, lastName, avatarUrl });

  return db.user.findUnique({
    where: { clerkUserId: userId },
    include: ORG_INCLUDE,
  });
}

/**
 * Require authentication — redirects to /sign-in if not authed.
 * Use in Server Components that must be protected.
 * The return type is non-nullable because redirect() throws (never returns).
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/sign-in");
    // unreachable — redirect() throws, but we need this for TypeScript
    return null as never;
  }
  return user;
}

/**
 * Check if current user has one of the required roles.
 */
export async function hasRole(...roles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Provision a new WVW user after Clerk sign-up (called from webhook).
 */
export async function provisionUser(params: {
  clerkUserId: string;
  clerkOrgId?: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}) {
  // Find or create org
  let org = params.clerkOrgId
    ? await db.organization.findUnique({ where: { clerkOrgId: params.clerkOrgId } })
    : null;

  if (!org) {
    // Default org — in production you'd handle org creation via Clerk org webhooks
    org = await db.organization.findFirst();
    if (!org) {
      org = await db.organization.create({
        data: {
          name: "WVW Consulting",
          slug: "wvw",
          clerkOrgId: params.clerkOrgId,
        },
      });
    }
  }

  const isNew = !(await db.user.findUnique({ where: { clerkUserId: params.clerkUserId }, select: { id: true } }));

  const user = await db.user.upsert({
    where: { clerkUserId: params.clerkUserId },
    create: {
      clerkUserId: params.clerkUserId,
      orgId: org.id,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      avatarUrl: params.avatarUrl,
      role: "CONSULTANT",
    },
    update: {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      avatarUrl: params.avatarUrl,
    },
  });

  // Send welcome email to new users (fire-and-forget)
  if (isNew) {
    sendWelcomeEmail(user.email, user.firstName).catch(() => {});
  }

  return user;
}

/**
 * Role hierarchy check — is userRole >= requiredRole in terms of permissions?
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  CLIENT_USER:   0,
  CLIENT_ADMIN:  1,
  CONSULTANT:    2,
  AUDITOR:       3,
  MANAGER:       4,
  PARTNER:       5,
  ADMIN:         6,
  SUPER_ADMIN:   7,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
