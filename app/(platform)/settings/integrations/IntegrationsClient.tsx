"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Puzzle, Check, Zap, Trash2, ExternalLink, AlertCircle, X,
  Loader2, CheckCircle2, Eye, EyeOff, Search, RefreshCw,
  Activity, Link2, ShieldAlert, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Integration {
  id: string; name: string; slug: string; status: string;
  lastSyncAt: Date | null; lastSyncStatus: string | null; createdAt: Date;
  config: Record<string, string> | null;
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

// ─── Integration Catalog ─────────────────────────────────────────────────────

const AVAILABLE_INTEGRATIONS: IntegrationDef[] = [
  // CRM
  { slug: "hubspot", name: "HubSpot", description: "Sync contacts, companies, and deals. Push WVW client engagements into HubSpot pipelines.", category: "CRM", logoLetter: "HS", logoColor: "bg-orange-500", setupFields: ["Portal ID", "Private App Token"], docsUrl: "https://developers.hubspot.com/docs/api/private-apps", oauthNote: "Create a Private App in HubSpot → Settings → Integrations → Private Apps" },
  { slug: "salesforce", name: "Salesforce", description: "Bi-directional sync of accounts, contacts, and opportunities.", category: "CRM", logoLetter: "SF", logoColor: "bg-blue-500", setupFields: ["Instance URL", "Client ID", "Client Secret"], docsUrl: "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_rest.htm" },
  // Microsoft 365
  { slug: "microsoft-teams", name: "Microsoft Teams", description: "Post audit findings, onboarding alerts, and action-plan updates directly to Teams channels.", category: "Microsoft 365", logoLetter: "T", logoColor: "bg-indigo-600", setupFields: ["Webhook URL"], docsUrl: "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook", oauthNote: "In Teams: open a channel → ··· → Connectors → Incoming Webhook → Configure → copy the Webhook URL here" },
  { slug: "microsoft-365", name: "Microsoft 365 — SharePoint / OneDrive / Outlook", description: "Sync SharePoint libraries, OneDrive storage, and Outlook calendar via Azure App Registration.", category: "Microsoft 365", logoLetter: "M", logoColor: "bg-blue-700", setupFields: ["Tenant ID", "Client ID", "Client Secret"], docsUrl: "https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app", oauthNote: "Azure Portal → App Registrations → New → copy Tenant ID + App (Client) ID → Certificates & Secrets → New Secret. Grant Graph API permissions: Files.ReadWrite.All, Calendars.ReadWrite, Sites.Read.All, Mail.ReadWrite." },
  { slug: "microsoft-outlook-mail", name: "Microsoft Outlook Mail", description: "Read your Outlook inbox and send emails — including invoices, client updates, and audit notifications.", category: "Microsoft 365", logoLetter: "OL", logoColor: "bg-blue-600", setupFields: ["Tenant ID", "Client ID", "Client Secret", "User Email"], docsUrl: "https://learn.microsoft.com/en-us/graph/api/user-list-messages", oauthNote: "Same Azure App Registration as microsoft-365. Add Mail.Read + Mail.Send to Graph API permissions." },
  { slug: "microsoft-forms", name: "Microsoft Forms", description: "Receive job application responses from MS Forms automatically via Power Automate.", category: "Microsoft 365", logoLetter: "F", logoColor: "bg-teal-600", setupFields: ["Job Posting ID", "Form ID", "Power Automate Webhook URL"], docsUrl: "https://support.microsoft.com/en-us/office/use-power-automate-to-process-microsoft-forms-responses-67c01e9c-3db8-4bf7-862d-13e63eb94cf3", oauthNote: "1. In Power Automate, create a flow: Trigger = Microsoft Forms 'When a new response is submitted', Action = HTTP POST to your webhook URL. 2. Paste your Job Posting ID and Form ID." },
  { slug: "microsoft-planner", name: "Microsoft Planner", description: "Create Planner tasks from audit findings, onboarding steps, and action items.", category: "Microsoft 365", logoLetter: "P", logoColor: "bg-green-600", setupFields: ["Tenant ID", "Client ID", "Client Secret", "Plan ID"], docsUrl: "https://learn.microsoft.com/en-us/graph/api/resources/planner-overview", oauthNote: "Same Azure App Registration. Add Tasks.ReadWrite to Graph API permissions. Plan ID: open Planner → copy ID from URL." },
  { slug: "azure-active-directory", name: "Azure Active Directory / Entra ID", description: "Sync your Microsoft Entra ID user directory into the WVW Workforce module.", category: "Microsoft 365", logoLetter: "AD", logoColor: "bg-sky-700", setupFields: ["Tenant ID", "Client ID", "Client Secret"], docsUrl: "https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app", oauthNote: "Same Azure App Registration. Add User.Read.All and Directory.Read.All permissions." },
  // Productivity
  { slug: "google-workspace", name: "Google Workspace", description: "Sync Google Calendar events, import Drive documents as evidence, and Gmail notifications.", category: "Productivity & Communications", logoLetter: "G", logoColor: "bg-emerald-500", setupFields: ["Service Account JSON"], docsUrl: "https://developers.google.com/workspace/guides/create-credentials", oauthNote: "Create a Service Account in Google Cloud Console and download the JSON key" },
  { slug: "slack", name: "Slack", description: "Real-time notifications for audit findings, overdue invoices, and onboarding milestones.", category: "Productivity & Communications", logoLetter: "S", logoColor: "bg-purple-600", setupFields: ["Bot Token", "Webhook URL"], docsUrl: "https://api.slack.com/authentication/basics", oauthNote: "Create a Slack App → add Bot Token Scopes (chat:write) → install to workspace" },
  { slug: "zoom", name: "Zoom", description: "Schedule and launch Zoom meetings for mentoring sessions, workshops, and office hours.", category: "Productivity & Communications", logoLetter: "Z", logoColor: "bg-blue-500", setupFields: ["Account ID", "Client ID", "Client Secret"], docsUrl: "https://developers.zoom.us/docs/internal-apps/", oauthNote: "Create a Server-to-Server OAuth app in Zoom Marketplace → copy Account ID, Client ID, Secret" },
  // HRIS
  { slug: "bamboohr", name: "BambooHR", description: "Sync employee records, org structure, and onboarding status into the Workforce module.", category: "HRIS", logoLetter: "BB", logoColor: "bg-green-600", setupFields: ["Subdomain", "API Key"], docsUrl: "https://documentation.bamboohr.com/docs/getting-started", oauthNote: "BambooHR → your name (top right) → API Keys → Add New Key" },
  { slug: "workday", name: "Workday", description: "Pull workers, departments, and managers from Workday HCM.", category: "HRIS", logoLetter: "WD", logoColor: "bg-orange-500", setupFields: ["Tenant Name", "Client ID", "Client Secret"], docsUrl: "https://community.workday.com/articles/connected-apps" },
  { slug: "adp", name: "ADP Workforce Now", description: "Import employee roster and payroll group data for workforce analytics.", category: "HRIS", logoLetter: "ADP", logoColor: "bg-red-600", setupFields: ["Client ID", "Client Secret"], docsUrl: "https://developers.adp.com/articles/api/adp-workforce-now-api" },
  // ATS
  { slug: "greenhouse", name: "Greenhouse", description: "Receive candidate-to-onboarding handoff data. Trigger preboarding when an offer is accepted.", category: "ATS & Recruiting", logoLetter: "GH", logoColor: "bg-green-700", setupFields: ["API Key", "Webhook Secret"], docsUrl: "https://developers.greenhouse.io/harvest.html", oauthNote: "Greenhouse → Configure → Dev Center → API Credential Management → Create new credential" },
  { slug: "lever", name: "Lever", description: "Sync candidate pipeline and trigger onboarding journeys when a hire is confirmed.", category: "ATS & Recruiting", logoLetter: "LV", logoColor: "bg-teal-600", setupFields: ["API Key"], docsUrl: "https://hire.lever.co/developer/documentation" },
  // Surveys
  { slug: "qualtrics", name: "Qualtrics", description: "Import survey responses for scoring and heatmap analysis.", category: "Surveys", logoLetter: "Q", logoColor: "bg-blue-600", setupFields: ["API Token", "Data Center"], docsUrl: "https://api.qualtrics.com/", oauthNote: "Qualtrics → Account Settings → Qualtrics IDs → API Token" },
  { slug: "typeform", name: "Typeform", description: "Embed Typeform surveys in onboarding and mentoring journeys.", category: "Surveys", logoLetter: "TF", logoColor: "bg-pink-500", setupFields: ["Personal Access Token"], docsUrl: "https://www.typeform.com/developers/get-started/personal-access-token/", oauthNote: "Typeform → Admin panel → Personal tokens → Generate a new token" },
  // Documents
  { slug: "docusign", name: "DocuSign", description: "Send audit reports and engagement letters for e-signature.", category: "Documents & E-Sign", logoLetter: "DS", logoColor: "bg-indigo-600", setupFields: ["Integration Key", "Account ID"], docsUrl: "https://developers.docusign.com/platform/auth/" },
  { slug: "google-drive", name: "Google Drive", description: "Attach Drive files as evidence and sync document libraries.", category: "Documents & E-Sign", logoLetter: "GD", logoColor: "bg-yellow-500", setupFields: ["Service Account JSON", "Shared Drive ID"], docsUrl: "https://developers.google.com/drive/api/guides/about-sdk" },
  // Accounting
  { slug: "wave", name: "Wave Accounting", description: "Sync invoices, payments, and customers from your Wave account into WVW financials.", category: "Accounting", logoLetter: "WV", logoColor: "bg-blue-500", setupFields: ["Full Access Token", "Business ID"], docsUrl: "https://developer.waveapps.com/hc/en-us/articles/360019434011-API-Reference", oauthNote: "Wave → Settings → Developer Data → create a Full Access Token. Your Business ID is in the URL when viewing your business." },
  { slug: "quickbooks", name: "QuickBooks Online", description: "Sync invoices, payments, and clients with QuickBooks Online.", category: "Accounting", logoLetter: "QB", logoColor: "bg-green-600", setupFields: ["Company ID", "Client ID", "Client Secret"], docsUrl: "https://developer.intuit.com/app/developer/qbo/docs/get-started" },
  // Automation
  { slug: "zapier", name: "Zapier", description: "Connect WVW Intelligence to 5,000+ apps via Zapier automations.", category: "Automation", logoLetter: "ZP", logoColor: "bg-orange-500", setupFields: ["API Key"], docsUrl: "https://zapier.com/app/developer" },
  { slug: "make", name: "Make (formerly Integromat)", description: "Build advanced multi-step automation scenarios connecting WVW to your client tech stack.", category: "Automation", logoLetter: "MK", logoColor: "bg-purple-500", setupFields: ["API Key", "Team ID"], docsUrl: "https://www.make.com/en/api-documentation" },
  { slug: "n8n", name: "n8n", description: "Self-hosted or cloud n8n workflows for WVW internal automations.", category: "Automation", logoLetter: "n8", logoColor: "bg-red-600", setupFields: ["Instance URL", "API Key"], docsUrl: "https://docs.n8n.io/api/", oauthNote: "n8n → Settings → n8n API → Enable API → copy key" },
];

const CATEGORIES = Array.from(new Set(AVAILABLE_INTEGRATIONS.map((i) => i.category)));

const STATUS_MAP: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  ACTIVE:       { label: "Connected",     dot: "bg-green-500",  text: "text-green-700", bg: "bg-green-50",  border: "border-green-200" },
  PENDING_AUTH: { label: "Pending Setup", dot: "bg-amber-400",  text: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200" },
  ERROR:        { label: "Error",         dot: "bg-red-500",    text: "text-red-700",   bg: "bg-red-50",    border: "border-red-200" },
  INACTIVE:     { label: "Disabled",      dot: "bg-gray-400",   text: "text-gray-500",  bg: "bg-gray-50",   border: "border-gray-200" },
};

// ─── Setup Modal ─────────────────────────────────────────────────────────────

interface SetupModalProps {
  def: IntegrationDef;
  existing?: Integration;
  onClose: () => void;
  onSaved: () => void;
}

function SetupModal({ def, existing, onClose, onSaved }: SetupModalProps) {
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(def.setupFields.map((f) => [f, existing?.config?.[f] ?? ""]))
  );
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const isSecret = (f: string) => /token|secret|key|password|json/i.test(f);
  const setField = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));
  const allFilled = def.setupFields.every((f) => fields[f]?.trim());

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    const res = await fetch("/api/integrations/test", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: def.slug, config: fields }),
    });
    const data = await res.json() as { data: { ok: boolean; message: string } };
    setTestResult(data.data); setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      let res: Response;
      if (existing) {
        res = await fetch(`/api/integrations/${existing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: fields,
            status: testResult?.ok ? "ACTIVE" : existing.status === "ACTIVE" ? "ACTIVE" : "PENDING_AUTH",
          }),
        });
      } else {
        res = await fetch("/api/integrations", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: def.slug, name: def.name, config: fields }),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        setSaveError(err.message ?? `Save failed (${res.status})`); setSaving(false); return;
      }
      setSaving(false); onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Network error"); setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-scale">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold", def.logoColor)}>
              {def.logoLetter}
            </div>
            <div>
              <h2 className="text-sm font-semibold">{existing ? "Edit" : "Connect"} {def.name}</h2>
              <p className="text-[11px] text-muted-foreground">{def.category}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {def.oauthNote && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3.5 py-3 text-xs text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-0.5">How to get credentials</p>
              <p className="leading-relaxed">{def.oauthNote}</p>
            </div>
          )}
          <div className="space-y-3">
            {def.setupFields.map((field) => {
              const secret = isSecret(field);
              const show = showSecrets[field];
              return (
                <div key={field}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{field}</label>
                  <div className="relative">
                    {field === "Service Account JSON" ? (
                      <textarea rows={4} value={fields[field] ?? ""} onChange={(e) => setField(field, e.target.value)}
                        className="input-base w-full text-xs resize-none font-mono" placeholder='{"type": "service_account", ...}' />
                    ) : (
                      <input
                        type={secret && !show ? "password" : "text"}
                        value={fields[field] ?? ""}
                        onChange={(e) => setField(field, e.target.value)}
                        className="input-base w-full pr-10"
                        placeholder={field.includes("URL") ? "https://" : field.includes("ID") ? "Your " + field : "Paste your " + field.toLowerCase()}
                      />
                    )}
                    {secret && field !== "Service Account JSON" && (
                      <button type="button" onClick={() => setShowSecrets((p) => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {show ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {testResult && (
            <div className={cn("flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs",
              testResult.ok ? "bg-green-500/10 border border-green-500/20 text-green-700" : "bg-red-500/10 border border-red-500/20 text-red-700"
            )}>
              {testResult.ok ? <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />}
              <p>{testResult.message}</p>
            </div>
          )}
        </div>

        <div className="border-t border-border">
          {saveError && (
            <div className="flex items-start gap-2 mx-5 mt-3 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{saveError}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 px-5 py-4">
            <a href={def.docsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink size={11} /> View docs
            </a>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleTest} disabled={testing || !allFilled} className="btn-ghost text-xs flex items-center gap-1.5">
                {testing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Test Connection
              </button>
              <button type="button" onClick={handleSave} disabled={saving || !allFilled} className="btn-primary text-xs flex items-center gap-1.5">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {testResult?.ok ? "Save & Activate" : existing ? "Save Changes" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Connected Integration Card ───────────────────────────────────────────────

function ConnectedCard({
  intg, info, liveResult, isVerifying,
  onVerify, onEdit, onRemove,
}: {
  intg: Integration;
  info?: IntegrationDef;
  liveResult?: { ok: boolean; message: string };
  isVerifying: boolean;
  onVerify: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const effectiveStatus = liveResult ? (liveResult.ok ? "ACTIVE" : "ERROR") : intg.status;
  const s = STATUS_MAP[effectiveStatus] ?? STATUS_MAP["INACTIVE"]!;

  return (
    <div className="section-card flex flex-col gap-3 hover:border-gold/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0", info?.logoColor ?? "bg-gray-500")}>
            {info?.logoLetter ?? intg.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">{intg.name}</p>
            <p className="text-[11px] text-muted-foreground">{info?.category ?? "Integration"}</p>
          </div>
        </div>
        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border flex-shrink-0", s.text, s.bg, s.border)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
          {s.label}
        </span>
      </div>

      {/* Status detail */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        {intg.lastSyncAt ? (
          <p>Verified {new Date(intg.lastSyncAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        ) : (
          <p className="text-amber-600">Never verified — click Verify below</p>
        )}
        {(liveResult ?? (intg.lastSyncStatus ? { ok: effectiveStatus === "ACTIVE", message: intg.lastSyncStatus } : null)) && (
          <p className={cn(effectiveStatus === "ACTIVE" ? "text-green-600" : "text-red-500")}>
            {liveResult?.message ?? intg.lastSyncStatus}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 mt-auto">
        <button type="button" onClick={onVerify} disabled={isVerifying}
          className="flex-1 text-xs py-1.5 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1">
          {isVerifying ? <Loader2 size={11} className="animate-spin" /> : <Activity size={11} />}
          Verify
        </button>
        <button type="button" onClick={onEdit}
          className="flex-1 text-xs py-1.5 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1">
          <RefreshCw size={11} /> Edit
        </button>
        <button type="button" onClick={onRemove}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200/60 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  integrations: Integration[];
  envDetected?: Record<string, boolean>;
}

export default function IntegrationsClient({ integrations, envDetected = {} }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [setupSlug, setSetupSlug] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const connected = (slug: string) => integrations.find((i) => i.slug === slug);
  const setupDef = AVAILABLE_INTEGRATIONS.find((i) => i.slug === setupSlug);
  const refresh = () => startTransition(() => router.refresh());

  const disconnect = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/integrations/${id}`, { method: "DELETE" });
    setDeletingId(null);
    refresh();
  };

  const verify = async (id: string) => {
    setVerifyingId(id);
    const res = await fetch("/api/integrations/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json() as { data: { verified: boolean; message: string } };
    setVerifyResults((prev) => ({ ...prev, [id]: { ok: data.data.verified, message: data.data.message } }));
    setVerifyingId(null);
    refresh();
  };

  // Stats
  const activeCount = integrations.filter((i) => i.status === "ACTIVE").length;
  const errorCount  = integrations.filter((i) => i.status === "ERROR").length;
  const pendingCount = integrations.filter((i) => i.status === "PENDING_AUTH").length;
  const envOnlyEntries = Object.entries(envDetected).filter(([slug, detected]) => detected && !connected(slug));
  const totalConnected = integrations.length + envOnlyEntries.length;
  const availableCount = AVAILABLE_INTEGRATIONS.length - integrations.length - envOnlyEntries.length;

  // Filter for available section
  const filtered = AVAILABLE_INTEGRATIONS.filter((i) => {
    const alreadyConnected = connected(i.slug) || (envDetected[i.slug] && !connected(i.slug));
    if (alreadyConnected) return false;
    const matchCat = activeCategory === "All" || i.category === activeCategory;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const groupedFiltered = CATEGORIES.reduce<Record<string, IntegrationDef[]>>((acc, cat) => {
    const items = filtered.filter((i) => i.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {setupSlug && setupDef && (
        <SetupModal
          def={setupDef}
          existing={connected(setupSlug)}
          onClose={() => setSetupSlug(null)}
          onSaved={() => { setSetupSlug(null); refresh(); }}
        />
      )}

      {/* Header */}
      <PageHeader
        title="Integrations"
        subtitle="Connect WVW Intelligence to your tools — CRM, HRIS, Microsoft 365, accounting, and automation"
        icon={Puzzle}
        iconColor="text-gold"
        iconBg="bg-gold/10 border-gold/20"
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Integrations" }]}
      />

      {/* Stat Cards */}
      <section className="stagger-children grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Connected" value={totalConnected} icon={Link2} iconColor="text-gold" subvalue={`of ${AVAILABLE_INTEGRATIONS.length} available`} />
        <StatCard label="Active & Healthy" value={activeCount} icon={CheckCircle2} iconColor="text-green-500" subvalue={activeCount === totalConnected && totalConnected > 0 ? "All good" : undefined} />
        <StatCard label="Needs Attention" value={errorCount + pendingCount} icon={ShieldAlert} iconColor={errorCount > 0 ? "text-red-500" : "text-amber-500"} subvalue={errorCount > 0 ? `${errorCount} error${errorCount > 1 ? "s" : ""}` : pendingCount > 0 ? `${pendingCount} unverified` : "All verified"} />
        <StatCard label="Available to Add" value={availableCount} icon={Plus} iconColor="text-blue-500" subvalue="Click to connect" />
      </section>

      {/* Connected Integrations */}
      {(totalConnected > 0) && (
        <div className="section-card">
          <div className="section-card-header">
            <h2 className="font-semibold text-sm">Connected ({totalConnected})</h2>
            <p className="text-xs text-muted-foreground">Click Verify to confirm each connection is still working</p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Env-only integrations */}
            {envOnlyEntries.map(([slug]) => {
              const info = AVAILABLE_INTEGRATIONS.find((a) => a.slug === slug);
              if (!info) return null;
              return (
                <div key={slug} className="section-card flex flex-col gap-3 border-blue-200/60 hover:border-blue-300/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0", info.logoColor)}>
                        {info.logoLetter}
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{info.name}</p>
                        <p className="text-[11px] text-muted-foreground">{info.category}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border text-blue-700 bg-blue-50 border-blue-200 flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Env configured
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Detected in environment variables. Register it to track status and enable verify.</p>
                  <div className="pt-1 border-t border-border/50 mt-auto">
                    <button type="button" onClick={() => setSetupSlug(slug)}
                      className="w-full text-xs py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                      <Plus size={11} /> Register in Dashboard
                    </button>
                  </div>
                </div>
              );
            })}

            {/* DB-backed integrations */}
            {integrations.map((intg) => (
              <ConnectedCard
                key={intg.id}
                intg={intg}
                info={AVAILABLE_INTEGRATIONS.find((a) => a.slug === intg.slug)}
                liveResult={verifyResults[intg.id]}
                isVerifying={verifyingId === intg.id}
                onVerify={() => verify(intg.id)}
                onEdit={() => setSetupSlug(intg.slug)}
                onRemove={() => disconnect(intg.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="section-card">
        <div className="section-card-header">
          <div>
            <h2 className="font-semibold text-sm">Available Integrations</h2>
            <p className="text-xs text-muted-foreground">{availableCount} integrations ready to connect</p>
          </div>
        </div>

        {/* Search + Category Filter */}
        <div className="px-5 pt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search integrations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base w-full pl-8 text-sm h-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["All", ...CATEGORIES].map((cat) => (
              <button key={cat} type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors",
                  activeCategory === cat
                    ? "bg-navy-900 text-white border-navy-900"
                    : "border-border hover:bg-muted text-muted-foreground"
                )}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="p-5 space-y-6">
          {Object.keys(groupedFiltered).length === 0 ? (
            <div className="empty-state py-10">
              <div className="empty-state-icon"><Puzzle size={24} className="text-muted-foreground" /></div>
              <p className="text-sm font-medium mt-3">No integrations match your search</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different keyword or category</p>
            </div>
          ) : (
            Object.entries(groupedFiltered).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((intg) => (
                    <div key={intg.slug}
                      className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-gold/30 hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setSetupSlug(intg.slug)}
                    >
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0", intg.logoColor)}>
                        {intg.logoLetter}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm group-hover:text-gold transition-colors">{intg.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{intg.description}</p>
                      </div>
                      <Zap size={14} className="text-muted-foreground group-hover:text-gold transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
