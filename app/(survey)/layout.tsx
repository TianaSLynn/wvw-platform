import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "WVW Survey", template: "%s | WVW Intelligence" },
  description: "Confidential organizational health survey powered by WVW Intelligence",
};

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
