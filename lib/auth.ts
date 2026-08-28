import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { sendWelcomeEmail } from "@/lib/email";
import { headers } from "next/headers";
import { timingSafeEqual } from "node:crypto";

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

function secretsMatch(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length
    && timingSafeEqual(candidateBuffer, expectedBuffer);
}

/**
 * A deliberately narrow test identity for isolated Netlify deploy previews.
 * It requires both the deploy-preview runtime context and a secret request
 * header. Production can never opt into this path, even if the secret were
 * accidentally copied into that environment.
 */
async function getPreviewQaUser() {
  if (process.env.CONTEXT !== "deploy-preview") return null;

  const expectedToken = process.env.WVW_QA_TEST_TOKEN;
  const qaEmail = process.env.WVW_QA_USER_EMAIL;
  if (!expectedToken || !qaEmail) return null;

  const candidateToken = (await headers()).get("x-wvw-qa-token") ?? "";
  if (!secretsMatch(candidateToken, expectedToken)) return null;

  return db.user.findFirst({
    where: { email: qaEmail },
    include: ORG_INCLUDE,
  });
}

/**
 * Get the current authenticated WVW user from the database.
 * Always syncs profile data from Clerk so updates are reflected without a webhook.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const previewQaUser = await getPreviewQaUser();
  if (previewQaUser) return previewQaUser;

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
