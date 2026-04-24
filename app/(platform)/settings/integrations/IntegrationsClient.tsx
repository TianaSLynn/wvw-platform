"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Puzzle, Check, Zap, RefreshCw, Trash2, ExternalLink,
  AlertCircle, X, Loader2, CheckCircle2, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  id: string; name: string; slug: string; status: string;
  lastSyncAt: Date | null; lastSyncStatus: string | null; createdAt: Date;
}

type IntegrationDef = {
  slug: string;
  name: string;
  description: string;
  category: string;
  logoLetter: string;
  logoColor: string;
  setupFields: string[];
  docsUrl: string;
  oauthNote?: string;
};

const AVAILABLE_INTEGRATIONS: IntegrationDef[] = [
  // ── CRM ──────────────────────────────────────────────────────────
  {
    slug: "hubspot", name: "HubSpot",
    description: "Sync contacts, companies, and deals. Push WVW client engagements into HubSpot pipelines.",
    category: "CRM", logoLetter: "HS", logoColor: "bg-orange-600",
    setupFields: ["Portal ID", "Private App Token"],
    docsUrl: "https://developers.hubspot.com/docs/api/private-apps",
    oauthNote: "Create a Private App in HubSpot → Settings → Integrations → Private Apps",
  },
  {
    slug: "salesforce", name: "Salesforce",
    description: "Bi-directional sync of accounts, contacts, and opportunities.",
    category: "CRM", logoLetter: "SF", logoColor: "bg-blue-500",
    setupFields: ["Instance URL", "Client ID", "Client Secret"],
    docsUrl: "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_rest.htm",
  },
  // ── Productivity & Communications ────────────────────────────────
  {
    slug: "microsoft-teams", name: "Microsoft Teams",
    description: "Post audit findings, onboarding alerts, and action-plan updates directly to Teams channels.",
    category: "Productivity & Communications", logoLetter: "T", logoColor: "bg-indigo-600",
    setupFields: ["Webhook URL"],
    docsUrl: "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook",
    oauthNote: "In Teams: open a channel → ··· → Connectors → Incoming Webhook → Configure → copy URL here",
  },
  {
    slug: "microsoft-365", name: "Microsoft 365 (SharePoint / Outlook)",
    description: "Sync SharePoint document libraries, Outlook calendar for scheduling, and OneDrive storage.",
    category: "Productivity & Communications", logoLetter: "M", logoColor: "bg-blue-700",
    setupFields: ["Tenant ID", "Client ID", "Client Secret"],
    docsUrl: "https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app",
    oauthNote: "Register an app in Azure AD → API permissions: Files.Read, Calendars.Read, Sites.Read",
  },
  {
    slug: "google-workspace", name: "Google Workspace",
    description: "Sync Google Calendar events, import Drive documents as evidence, and Gmail notifications.",
    category: "Productivity & Communications", logoLetter: "G", logoColor: "bg-emerald-500",
    setupFields: ["Service Account JSON"],
    docsUrl: "https://developers.google.com/workspace/guides/create-credentials",
    oauthNote: "Create a Service Account in Google Cloud Console and download the JSON key",
  },
  {
    slug: "slack", name: "Slack",
    description: "Real-time notifications for audit findings, overdue invoices, and onboarding milestones.",
    category: "Productivity & Communications", logoLetter: "S", logoColor: "bg-purple-600",
    setupFields: ["Bot Token", "Webhook URL"],
    docsUrl: "https://api.slack.com/authentication/basics",
    oauthNote: "Create a Slack App → add Bot Token Scopes (chat:write) → install to workspace",
  },
  {
    slug: "zoom", name: "Zoom",
    description: "Schedule and launch Zoom meetings for mentoring sessions, workshops, and office hours.",
    category: "Productivity & Communications", logoLetter: "Z", logoColor: "bg-blue-500",
    setupFields: ["Account ID", "Client ID", "Client Secret"],
    docsUrl: "https://developers.zoom.us/docs/internal-apps/",
    oauthNote: "Create a Server-to-Server OAuth app in Zoom Marketplace → copy Account ID, Client ID, Secret",
  },
  // ── HRIS ─────────────────────────────────────────────────────────
  {
    slug: "bamboohr", name: "BambooHR",
    description: "Sync employee records, org structure, and onboarding status into the Workforce module.",
    category: "HRIS", logoLetter: "BB", logoColor: "bg-green-600",
    setupFields: ["Subdomain", "API Key"],
    docsUrl: "https://documentation.bamboohr.com/docs/getting-started",
    oauthNote: "BambooHR → your name (top right) → API Keys → Add New Key",
  },
  {
    slug: "workday", name: "Workday",
    description: "Pull workers, departments, and managers from Workday HCM.",
    category: "HRIS", logoLetter: "WD", logoColor: "bg-orange-500",
    setupFields: ["Tenant Name", "Client ID", "Client Secret"],
    docsUrl: "https://community.workday.com/articles/connected-apps",
  },
  {
    slug: "adp", name: "ADP Workforce Now",
    description: "Import employee roster and payroll group data for workforce analytics.",
    category: "HRIS", logoLetter: "ADP", logoColor: "bg-red-600",
    setupFields: ["Client ID", "Client Secret"],
    docsUrl: "https://developers.adp.com/articles/api/adp-workforce-now-api",
  },
  // ── ATS & Recruiting ─────────────────────────────────────────────
  {
    slug: "greenhouse", name: "Greenhouse",
    description: "Receive candidate-to-onboarding handoff data. Trigger preboarding when an offer is accepted.",
    category: "ATS & Recruiting", logoLetter: "GH", logoColor: "bg-green-700",
    setupFields: ["API Key", "Webhook Secret"],
    docsUrl: "https://developers.greenhouse.io/harvest.html",
    oauthNote: "Greenhouse → Configure → Dev Center → API Credential Management → Create new credential",
  },
  {
    slug: "lever", name: "Lever",
    description: "Sync candidate pipeline and trigger onboarding journeys when a hire is confirmed.",
    category: "ATS & Recruiting", logoLetter: "LV", logoColor: "bg-teal-600",
    setupFields: ["API Key"],
    docsUrl: "https://hire.lever.co/developer/documentation",
  },
  // ── Surveys ──────────────────────────────────────────────────────
  {
    slug: "qualtrics", name: "Qualtrics",
    description: "Import survey responses for scoring and heatmap analysis.",
    category: "Surveys", logoLetter: "Q", logoColor: "bg-blue-600",
    setupFields: ["API Token", "Data Center"],
    docsUrl: "https://api.qualtrics.com/",
    oauthNote: "Qualtrics → Account Settings → Qualtrics IDs → API Token",
  },
  {
    slug: "typeform", name: "Typeform",
    description: "Embed Typeform surveys in onboarding and mentoring journeys.",
    category: "Surveys", logoLetter: "TF", logoColor: "bg-pink-500",
    setupFields: ["Personal Access Token"],
    docsUrl: "https://www.typeform.com/developers/get-started/personal-access-token/",
    oauthNote: "Typeform → Admin panel → Personal tokens → Generate a new token",
  },
  // ── Documents & E-Sign ───────────────────────────────────────────
  {
    slug: "docusign", name: "DocuSign",
    description: "Send audit reports and engagement letters for e-signature.",
    category: "Documents & E-Sign", logoLetter: "DS", logoColor: "bg-indigo-600",
    setupFields: ["Integration Key", "Account ID"],
    docsUrl: "https://developers.docusign.com/platform/auth/",
  },
  {
    slug: "google-drive", name: "Google Drive",
    description: "Attach Drive files as evidence and sync document libraries.",
    category: "Documents & E-Sign", logoLetter: "GD", logoColor: "bg-yellow-500",
    setupFields: ["Service Account JSON", "Shared Drive ID"],
    docsUrl: "https://developers.google.com/drive/api/guides/about-sdk",
  },
  // ── Accounting ───────────────────────────────────────────────────
  {
    slug: "quickbooks", name: "QuickBooks Online",
    description: "Sync invoices, payments, and clients with QuickBooks Online.",
    category: "Accounting", logoLetter: "QB", logoColor: "bg-green-600",
    setupFields: ["Company ID", "Client ID", "Client Secret"],
    docsUrl: "https://developer.intuit.com/app/developer/qbo/docs/get-started",
  },
  // ── Automation ───────────────────────────────────────────────────
  {
    slug: "zapier", name: "Zapier",
    description: "Connect WVW Intelligence to 5,000+ apps via Zapier automations.",
    category: "Automation", logoLetter: "ZP", logoColor: "bg-orange-500",
    setupFields: ["API Key"],
    docsUrl: "https://zapier.com/app/developer",
  },
  {
    slug: "make", name: "Make (formerly Integromat)",
    description: "Build advanced multi-step automation scenarios connecting WVW to your client tech stack.",
    category: "Automation", logoLetter: "MK", logoColor: "bg-purple-500",
    setupFields: ["API Key", "Team ID"],
    docsUrl: "https://www.make.com/en/api-documentation",
  },
  {
    slug: "n8n", name: "n8n",
    description: "Self-hosted or cloud n8n workflows for WVW internal automations.",
    category: "Automation", logoLetter: "n8", logoColor: "bg-red-600",
    setupFields: ["Instance URL", "API Key"],
    docsUrl: "https://docs.n8n.io/api/",
    oauthNote: "n8n → Settings → n8n API → Enable API → copy key",
  },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ACTIVE:       { label: "Connected",     color: "text-green-600 bg-green-50 border-green-200" },
  PENDING_AUTH: { label: "Pending Setup", color: "text-amber-600 bg-amber-50 border-amber-200" },
  ERROR:        { label: "Error",         color: "text-red-600 bg-red-50 border-red-200" },
  INACTIVE:     { label: "Disabled",      color: "text-gray-500 bg-gray-50 border-gray-200" },
};

interface SetupModalProps {
  def: IntegrationDef;
  existing?: Integration;
  onClose: () => void;
  onSaved: () => void;
}

function SetupModal({ def, existing, onClose, onSaved }: SetupModalProps) {
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(def.setupFields.map((f) => [f, ""]))
  );
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const isSecret = (field: string) =>
    /token|secret|key|password|json/i.test(field);

  const setField = (k: string, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }));

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/integrations/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: def.slug, config: fields }),
    });
    const data = await res.json() as { data: { ok: boolean; message: string } };
    setTestResult(data.data);
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (existing) {
      await fetch(`/api/integrations/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: fields,
          status: testResult?.ok ? "ACTIVE" : "PENDING_AUTH",
        }),
      });
    } else {
      await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: def.slug, name: def.name, config: fields }),
      });
    }
    setSaving(false);
    onSaved();
  };

  const allFilled = def.setupFields.every((f) => fields[f]?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-scale">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold", def.logoColor)}>
              {def.logoLetter}
            </div>
            <div>
              <h2 className="text-sm font-semibold">Connect {def.name}</h2>
              <p className="text-[11px] text-muted-foreground">{def.category}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Setup note */}
          {def.oauthNote && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3.5 py-3 text-xs text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-0.5">How to get credentials</p>
              <p className="leading-relaxed">{def.oauthNote}</p>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            {def.setupFields.map((field) => {
              const secret = isSecret(field);
              const show   = showSecrets[field];
              return (
                <div key={field}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{field}</label>
                  <div className="relative">
                    {field === "Service Account JSON" ? (
                      <textarea
                        rows={4}
                        value={fields[field] ?? ""}
                        onChange={(e) => setField(field, e.target.value)}
                        className="input-base w-full text-xs resize-none font-mono"
                        placeholder='{"type": "service_account", ...}'
                      />
                    ) : (
                      <input
                        type={secret && !show ? "password" : "text"}
                        value={fields[field] ?? ""}
                        onChange={(e) => setField(field, e.target.value)}
                        className="input-base w-full pr-10"
                        placeholder={
                          field.includes("URL") ? "https://" :
                          field.includes("ID") ? "Your " + field :
                          "Paste your " + field.toLowerCase()
                        }
                      />
                    )}
                    {secret && field !== "Service Account JSON" && (
                      <button
                        type="button"
                        onClick={() => setShowSecrets((p) => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {show ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test result */}
          {testResult && (
            <div className={cn(
              "flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs",
              testResult.ok
                ? "bg-green-500/10 border border-green-500/20 text-green-700"
                : "bg-red-500/10 border border-red-500/20 text-red-700"
            )}>
              {testResult.ok
                ? <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" />
                : <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />}
              <p>{testResult.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-border">
          <a
            href={def.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink size={11} /> View docs
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !allFilled}
              className="btn-ghost text-xs flex items-center gap-1.5"
            >
              {testing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              Test Connection
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !allFilled}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {testResult?.ok ? "Save & Activate" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props { integrations: Integration[] }

export default function IntegrationsClient({ integrations }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [setupSlug, setSetupSlug] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const connected = (slug: string) => integrations.find((i) => i.slug === slug);
  const setupDef   = AVAILABLE_INTEGRATIONS.find((i) => i.slug === setupSlug);

  const refresh = () => startTransition(() => router.refresh());

  const disconnect = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/integrations/${id}`, { method: "DELETE" });
    setDeletingId(null);
    refresh();
  };

  const sync = async (id: string) => {
    await fetch(`/api/integrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastSyncAt: new Date().toISOString() }),
    });
    refresh();
  };

  const categories = Array.from(new Set(AVAILABLE_INTEGRATIONS.map((i) => i.category)));
  const activeCount = integrations.filter((i) => i.status === "ACTIVE").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Setup Modal */}
      {setupSlug && setupDef && (
        <SetupModal
          def={setupDef}
          existing={connected(setupSlug)}
          onClose={() => setSetupSlug(null)}
          onSaved={() => { setSetupSlug(null); refresh(); }}
        />
      )}

      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Back to Settings
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
            <Puzzle size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Integrations</h1>
            <p className="text-xs text-muted-foreground">{activeCount} active · {AVAILABLE_INTEGRATIONS.length} available</p>
          </div>
        </div>
      </div>

      {/* Connected */}
      {integrations.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold">Connected ({integrations.length})</p>
          {integrations.map((intg) => {
            const info = AVAILABLE_INTEGRATIONS.find((a) => a.slug === intg.slug);
            const statusInfo = STATUS_MAP[intg.status] ?? STATUS_MAP["INACTIVE"]!;
            return (
              <div key={intg.id} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0", info?.logoColor ?? "bg-gray-500")}>
                  {info?.logoLetter ?? intg.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{intg.name}</p>
                    <span className={cn("px-1.5 py-0.5 rounded-full text-xs font-medium border", statusInfo.color)}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {intg.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">Last sync: {new Date(intg.lastSyncAt).toLocaleString()}</p>
                  )}
                  {intg.status === "ERROR" && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertCircle size={11} /> Re-authentication required
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSetupSlug(intg.slug)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    Edit
                  </button>
                  {intg.status === "ACTIVE" && (
                    <button
                      type="button"
                      onClick={() => sync(intg.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-1"
                    >
                      <RefreshCw size={11} /> Sync
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => disconnect(intg.id)}
                    disabled={deletingId === intg.id}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Available by category */}
      {categories.map((category) => {
        const items = AVAILABLE_INTEGRATIONS.filter((i) => i.category === category);
        return (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</p>
            <div className="space-y-2">
              {items.map((intg) => {
                const existing = connected(intg.slug);
                const statusInfo = existing ? STATUS_MAP[existing.status] : null;
                return (
                  <div key={intg.slug} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 hover:border-gold/20 transition-colors">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0", intg.logoColor)}>
                      {intg.logoLetter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm">{intg.name}</p>
                        {statusInfo && (
                          <span className={cn("px-1.5 py-0.5 rounded-full text-xs font-medium border", statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{intg.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!existing ? (
                        <button
                          type="button"
                          onClick={() => setSetupSlug(intg.slug)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center gap-1.5"
                        >
                          <Zap size={11} /> Connect
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSetupSlug(intg.slug)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-1.5"
                        >
                          <Check size={11} className="text-green-500" /> Connected · Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
