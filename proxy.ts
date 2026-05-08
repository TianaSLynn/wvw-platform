import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that are publicly accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk(.*)",
  "/api/portal/(.*)",
  "/manifest.json",
  "/sw.js",
  // Token-gated public pages
  "/audit/submit/(.*)",
  "/portal/(.*)",
  "/survey/(.*)",
  "/api/survey/(.*)",
  // Invite acceptance
  "/invite/(.*)",
  "/api/invites/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;

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

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
