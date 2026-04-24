import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import OrgSettingsForm from "./OrgSettingsForm";

export const metadata: Metadata = { title: "Organization Settings" };

export default async function OrgSettingsPage() {
  const user = await requireUser();
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/settings");

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    select: {
      id: true, name: true, website: true, industry: true,
      timezone: true, currency: true, fiscalYearStart: true, settings: true,
      logoUrl: true, slug: true,
    },
  });

  if (!org) redirect("/settings");

  return (
    <div className="max-w-2xl mx-auto">
      <OrgSettingsForm org={org} />
    </div>
  );
}
