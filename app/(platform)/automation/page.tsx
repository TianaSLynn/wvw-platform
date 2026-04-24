import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AutomationBuilder from "./AutomationBuilder";

export const metadata: Metadata = { title: "Automation" };

export default async function AutomationPage() {
  const user = await requireUser();
  if (!["ADMIN", "SUPER_ADMIN", "PARTNER", "MANAGER"].includes(user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-5xl mx-auto">
      <AutomationBuilder />
    </div>
  );
}
