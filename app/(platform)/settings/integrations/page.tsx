import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import IntegrationsClient from "./IntegrationsClient";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const user = await requireUser();
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/settings");

  const raw = await db.integration.findMany({
    where: { orgId: user.orgId },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, slug: true, status: true,
      lastSyncAt: true, lastSyncStatus: true, createdAt: true,
      config: true,
    },
  });

  // Cast config JsonValue → Record<string, string> for the client
  const integrations = raw.map((r) => ({
    ...r,
    status: r.status as string,
    config: (r.config && typeof r.config === "object" && !Array.isArray(r.config))
      ? (r.config as Record<string, string>)
      : null,
  }));

  // Detect which integrations are configured via environment variables.
  // These show as "Env configured" even if no DB record exists yet.
  const envDetected: Record<string, boolean> = {
    "n8n": !!(process.env.N8N_API_URL && process.env.N8N_API_KEY),
    "microsoft-365": !!(process.env.MICROSOFT_TENANT_ID && process.env.MICROSOFT_CLIENT_ID),
    "microsoft-teams": !!process.env.MICROSOFT_TEAMS_WEBHOOK_URL,
    "slack": !!process.env.SLACK_BOT_TOKEN,
    "wave": !!process.env.WAVE_ACCESS_TOKEN,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <IntegrationsClient integrations={integrations} envDetected={envDetected} />
    </div>
  );
}
