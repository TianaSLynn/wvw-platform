"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Users, Globe, Mail, Phone, Building2, DollarSign,
  ClipboardList, Briefcase, Plus, TrendingUp, Edit,
  ChevronRight, Star, FileText, ExternalLink, Copy, Check,
} from "lucide-react";

interface Props {
  client: {
    id: string;
    name: string;
    legalName: string | null;
    industry: string | null;
    website: string | null;
    description: string | null;
    logoUrl: string | null;
    isActive: boolean;
    onboardedAt: Date | null;
    healthScore: number | null;
    paymentTerms: number;
    billingEmail: string | null;
    contacts: Array<{
      id: string; firstName: string; lastName: string;
      email: string | null; phone: string | null;
      title: string | null; isPrimary: boolean; isDecisionMaker: boolean;
    }>;
    projects: Array<{
      id: string; name: string; status: string; type: string;
      completionPct: number; targetEndDate: Date | null;
      members: Array<{ user: { firstName: string; lastName: string } }>;
      _count: { tasks: number };
    }>;
    audits: Array<{
      id: string; name: string; status: string; type: string;
      updatedAt: Date; _count: { findings: number };
    }>;
    invoices: Array<{
      id: string; invoiceNumber: string; status: string;
      issueDate: Date; dueDate: Date; total: number; currency: string;
    }>;
    onboardingWorkflows: Array<{
      id: string; status: string; targetDate: Date | null; notes: string | null;
      steps: Array<{ id: string; title: string; status: string; sortOrder: number; documentRequired: boolean; documentCollected: boolean }>;
    }>;
    _count: { projects: number; audits: number; contacts: number; invoices: number };
  };
  totalBilled: number;
  openBalance: number;
  currentUserId: string;
}

type Tab = "overview" | "onboarding" | "contacts" | "projects" | "audits" | "invoices";

const STATUS_BADGE: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  ACTIVE: "success", COMPLETED: "secondary", ON_HOLD: "warning",
  DRAFT: "secondary", PLANNING: "default", FIELDWORK: "default",
  REVIEW: "warning", PAID: "success", SENT: "default",
  OVERDUE: "destructive", VOID: "secondary", CANCELLED: "secondary",
};

export default function ClientDetail({ client, totalBilled, openBalance }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [portalCopied, setPortalCopied] = useState(false);

  const sharePortal = async () => {
    const res = await fetch("/api/org/portal-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id }),
    });
    if (res.ok) {
      const data = await res.json() as { data: { portalUrl: string } };
      await navigator.clipboard.writeText(data.data.portalUrl);
      setPortalCopied(true);
      setTimeout(() => setPortalCopied(false), 3000);
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview",  label: "Overview" },
    { id: "onboarding", label: "Client Onboarding", count: client.onboardingWorkflows[0]?.steps.length ?? 0 },
    { id: "contacts",  label: "Contacts",  count: client._count.contacts },
    { id: "projects",  label: "Projects",  count: client._count.projects },
    { id: "audits",    label: "Audits",    count: client._count.audits },
    { id: "invoices",  label: "Invoices",  count: client._count.invoices },
  ];

  return (
    <>
      {/* Header */}
      <PageHeader
        title={client.name}
        subtitle={[client.industry, client.legalName].filter(Boolean).join(" · ")}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={client.isActive ? "success" : "secondary"}>
              {client.isActive ? "Active Client" : "Inactive"}
            </Badge>
            <button
              onClick={sharePortal}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
            >
              {portalCopied ? <><Check size={13} className="text-green-500" /> Copied!</> : <><ExternalLink size={13} /> Share Portal</>}
            </button>
            <Link
              href={`/clients/${client.id}/edit`}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
            >
              <Edit size={13} /> Manage Client Account
            </Link>
          </div>
        }
      />

      {/* Client journey status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Onboarding", value: client.onboardingWorkflows[0] ? `${client.onboardingWorkflows[0].steps.filter((step) => step.status === "COMPLETED").length}/${client.onboardingWorkflows[0].steps.length}` : "Needs setup", icon: Users, color: "text-gold" },
          { label: "Initial Audit", value: client.audits.find((audit) => audit.name.includes("Organizational Initial Audit"))?.status ?? "Not assigned", icon: ClipboardList, color: "text-purple-500" },
          { label: "Client Contacts", value: client._count.contacts, icon: Users, color: "text-blue-500" },
          { label: "Open Balance", value: formatCurrency(openBalance, "USD", true), icon: FileText, color: openBalance > 0 ? "text-amber-500" : "text-green-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <div className="flex items-center gap-2 mt-2">
              <Icon size={16} className={color} />
              <span className="text-xl font-bold">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 -mb-px overflow-x-auto scrollbar-thin">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5",
                tab === t.id
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-slide-in-right">
        {tab === "overview" && <OverviewTab client={client} />}
        {tab === "onboarding" && <OnboardingTab client={client} />}
        {tab === "contacts" && <ContactsTab client={client} />}
        {tab === "projects" && <ProjectsTab client={client} />}
        {tab === "audits"   && <AuditsTab   client={client} />}
        {tab === "invoices" && <InvoicesTab  client={client} />}
      </div>
    </>
  );
}

function OnboardingTab({ client }: { client: Props["client"] }) {
  const workflow = client.onboardingWorkflows[0];
  if (!workflow) {
    return <div className="bg-card rounded-xl border border-border p-8 text-center"><h3 className="font-semibold">No client onboarding workflow</h3><p className="mt-1 text-sm text-muted-foreground">This client was created before automatic onboarding was connected. Start or repair onboarding before launching the audit.</p></div>;
  }

  const completed = workflow.steps.filter((step) => step.status === "COMPLETED").length;
  const percent = workflow.steps.length ? Math.round((completed / workflow.steps.length) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Onboarding progress</h2><p className="text-xs text-muted-foreground">{completed} of {workflow.steps.length} steps complete</p></div><span className="text-2xl font-bold text-gold">{percent}%</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} /></div>
      </div>
      <div className="bg-card rounded-xl border border-border divide-y divide-border shadow-card">
        {workflow.steps.map((step) => (
          <div key={step.id} className="flex items-start gap-3 p-4">
            <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${step.status === "COMPLETED" ? "bg-green-500/15 text-green-600" : step.status === "BLOCKED" ? "bg-muted text-muted-foreground" : "bg-gold/15 text-gold"}`}>{step.sortOrder}</div>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{step.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{step.status.replaceAll("_", " ")}{step.documentRequired ? ` · ${step.documentCollected ? "Document received" : "Document needed"}` : ""}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ client }: { client: Props["client"] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Details */}
      <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Client Details</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {[
            { label: "Legal Name",     value: client.legalName },
            { label: "Industry",       value: client.industry },
            { label: "Website",        value: client.website, href: client.website ?? undefined },
            { label: "Health Score",   value: client.healthScore != null ? `${client.healthScore}/100` : null },
            { label: "Onboarding", value: client.onboardedAt ? `Completed ${formatDate(client.onboardedAt, "MMMM yyyy")}` : "In progress" },
          ].map(({ label, value, href }) => value ? (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-medium text-foreground mt-0.5">
                {href
                  ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">{value}</a>
                  : value}
              </dd>
            </div>
          ) : null)}
        </dl>

        {client.description && (
          <>
            <div className="border-t border-border pt-4">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">About</h3>
              <p className="text-sm text-foreground leading-relaxed">{client.description}</p>
            </div>
          </>
        )}
      </div>

      {/* Quick stats / primary contact */}
      <div className="space-y-4">
        {/* Primary contact card */}
        {client.contacts.filter((c) => c.isPrimary).map((contact) => (
          <div key={contact.id} className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Primary Contact</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-navy-900/10 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-navy-900 dark:text-white">
                  {contact.firstName[0]}{contact.lastName[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm">{contact.firstName} {contact.lastName}</p>
                {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                {contact.isDecisionMaker && <Badge variant="gold" size="sm" className="mt-1">Decision Maker</Badge>}
              </div>
            </div>
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-1">
                <Mail size={12} />{contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                <Phone size={12} />{contact.phone}
              </a>
            )}
          </div>
        ))}

        {/* Health score */}
        {client.healthScore !== null && (
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Client Health</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold">{client.healthScore}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", client.healthScore >= 70 ? "bg-green-500" : client.healthScore >= 40 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${client.healthScore}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Contacts ────────────────────────────────────────────────────────────
function ContactsTab({ client }: { client: Props["client"] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{client.contacts.length} contacts</p>
        <Link href={`/clients/${client.id}/contacts/new`} className="flex items-center gap-1 text-xs text-gold hover:underline">
          <Plus size={12} /> Add contact
        </Link>
      </div>
      {client.contacts.map((c) => (
        <div key={c.id} className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold">{c.firstName[0]}{c.lastName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{c.firstName} {c.lastName}</p>
              {c.isPrimary && <Badge variant="gold" size="sm">Primary</Badge>}
              {c.isDecisionMaker && <Badge variant="default" size="sm">DM</Badge>}
            </div>
            {c.title && <p className="text-xs text-muted-foreground">{c.title}</p>}
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-0.5">
            {c.email && <p>{c.email}</p>}
            {c.phone && <p>{c.phone}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Projects ────────────────────────────────────────────────────────────
function ProjectsTab({ client }: { client: Props["client"] }) {
  return (
    <div className="space-y-3">
      {client.projects.map((p) => (
        <Link key={p.id} href={`/engagements/${p.id}`}
          className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center gap-4 hover:border-gold/30 transition-all group block"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm group-hover:text-gold transition-colors">{p.name}</p>
              <Badge variant={STATUS_BADGE[p.status] ?? "secondary"} size="sm">{p.status}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{p.type}</span>
              <span>{p._count.tasks} tasks</span>
              {p.targetEndDate && <span>Due {formatDate(p.targetEndDate)}</span>}
            </div>
            {p.completionPct > 0 && (
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden w-48">
                <div className="h-full bg-gold rounded-full" style={{ width: `${p.completionPct}%` }} />
              </div>
            )}
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground" />
        </Link>
      ))}
    </div>
  );
}

// ─── Tab: Audits ──────────────────────────────────────────────────────────────
function AuditsTab({ client }: { client: Props["client"] }) {
  return (
    <div className="space-y-3">
      {client.audits.map((a) => (
        <Link key={a.id} href={`/audits/${a.id}`}
          className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center gap-4 hover:border-gold/30 transition-all group block"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm group-hover:text-gold transition-colors">{a.name}</p>
              <Badge variant={STATUS_BADGE[a.status] ?? "secondary"} size="sm">{a.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {a.type} · {a._count.findings} findings · Updated {formatDate(a.updatedAt)}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground" />
        </Link>
      ))}
    </div>
  );
}

// ─── Tab: Invoices ────────────────────────────────────────────────────────────
function InvoicesTab({ client }: { client: Props["client"] }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Invoice #", "Issue Date", "Due Date", "Amount", "Status"].map((h) => (
              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {client.invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-5 py-3.5">
                <Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-semibold text-foreground hover:text-gold">
                  {inv.invoiceNumber}
                </Link>
              </td>
              <td className="px-5 py-3.5 text-xs text-muted-foreground">{formatDate(inv.issueDate)}</td>
              <td className="px-5 py-3.5 text-xs text-muted-foreground">{formatDate(inv.dueDate)}</td>
              <td className="px-5 py-3.5 font-semibold">{formatCurrency(inv.total)}</td>
              <td className="px-5 py-3.5">
                <Badge variant={STATUS_BADGE[inv.status] ?? "secondary"} size="sm">{inv.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
