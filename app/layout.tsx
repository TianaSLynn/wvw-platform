import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";
import { CookieBanner } from "@/components/ui/CookieBanner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WVW Intelligence",
    template: "%s | WVW Intelligence",
  },
  description:
    "The all-in-one audit management, consulting, and intelligence platform for Wholistic Vibes Wellness.",
  applicationName: "WVW Intelligence",
  keywords: ["audit", "compliance", "consulting", "PSA", "WVW"],
  authors: [{ name: "Wholistic Vibes Wellness" }],
  creator: "WVW",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WVW Intelligence",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F1C3F" },
    { media: "(prefers-color-scheme: dark)", color: "#080f22" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// ClerkProvider throws synchronously if NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is
// unset, which previously took down `next build` for every page in the app
// (including pages with no auth requirement, like /_not-found) whenever a
// build environment didn't have the key configured. Skipping the provider
// in that case does NOT weaken access control: route protection for
// (platform)/* goes through requireUser() in lib/auth.ts, which uses
// @clerk/nextjs/server's auth() against CLERK_SECRET_KEY server-side and is
// completely independent of this client-side provider. What this does
// affect is client components that call Clerk's client hooks (useUser(),
// <SignedIn>, etc.) — those will throw if rendered without a key configured,
// which is a loud, visible failure rather than a silent auth bypass.
const hasClerkPublishableKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

if (!hasClerkPublishableKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[wvw-platform] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set — rendering without ClerkProvider. " +
      "Client-side Clerk components will not work in this build. Server-side route protection (requireUser()) is unaffected."
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const body = (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
            <CookieBanner />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );

  if (!hasClerkPublishableKey) {
    return body;
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#C9A84C",       // gold
          colorBackground: "#0F1C3F",    // navy
          colorInputBackground: "#1e3169",
          colorText: "#ffffff",
          colorTextSecondary: "rgba(255,255,255,0.6)",
          borderRadius: "0.5rem",
        },
      }}
    >
      {body}
    </ClerkProvider>
  );
}
