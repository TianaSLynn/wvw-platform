import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Client Portal", template: "%s | WVW Intelligence" },
  description: "Secure client portal powered by WVW Intelligence",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {children}
    </div>
  );
}
