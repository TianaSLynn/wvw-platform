import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

// Routes that are publicly accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk(.*)",
  "/api/webhooks/ms-forms(.*)",
  "/api/webhooks/typeform(.*)",
  "/api/portal/(.*)",
  "/manifest.json",
  "/sw.js",
  // Token-gated public pages
  "/audit/submit/(.*)",
  "/portal/(.*)",
  "/survey/(.*)",
  "/api/survey/(.*)",
  "/s/(.*)",
  "/api/s/(.*)",
  // Invite acceptance
  "/invite/(.*)",
  "/api/invites/(.*)",
  // Informational pages
  "/privacy",
  "/terms",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;

  // Token-gated participant routes do not need a Clerk session. Checking them
  // before auth also keeps the secure survey journey available when the
  // administrative Clerk UI is not configured in an isolated preview.
  if (isPublicRoute(req) && url.pathname !== "/") {
    return NextResponse.next();
  }

  const { userId } = await auth();

  if (!isPublicRoute(req) && !userId) {
    // Manual redirect instead of auth.protect() to avoid Clerk's
    // "protect-rewrite" behavior which sends unauthenticated users to /404
    // when using a dev publishable key without the dev-browser cookie.
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("redirect_url", url.pathname);
    return NextResponse.redirect(signIn);
  }

  // If authenticated user hits root, redirect to dashboard
  if (userId && url.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

function isPreviewQaRequest(req: NextRequest): boolean {
  return process.env.WVW_QA_PREVIEW_AUTH_ENABLED === "true"
    && req.nextUrl.hostname.startsWith("deploy-preview-")
    && Boolean(process.env.WVW_QA_TEST_TOKEN)
    && req.headers.get("x-wvw-qa-token") === process.env.WVW_QA_TEST_TOKEN;
}

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  // Bypass Clerk's middleware wrapper entirely for public token-gated routes.
  // The route handlers verify their signed survey/invitation tokens directly.
  if (isPublicRoute(req) && req.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }
  if (isPreviewQaRequest(req)) return NextResponse.next();
  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
