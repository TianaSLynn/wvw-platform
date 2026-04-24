import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import IntegrationsClient from "./IntegrationsClient";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const user = await requireUser();
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/settings");

  const integrations = await db.integration.findMany({
    where: { orgId: user.orgId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <IntegrationsClient integrations={integrations} />
    </div>
  );
}
