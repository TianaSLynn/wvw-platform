import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
