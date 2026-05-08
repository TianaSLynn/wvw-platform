"use client";

import { useState, useEffect } from "react";
import { Award, Plus, X, Shield, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CredentialCode = "WAA" | "WCA" | "WCS" | "WEP";
type CredentialStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

interface Credential {
  id: string;
  recipientName: string;
  credentialCode: CredentialCode;
  credentialTitle: string;
  issuedAt: string;
  expiresAt: string | null;
  verifyId: string;
  status: CredentialStatus;
  notes: string | null;
}

const CREDENTIAL_TYPES: Record<CredentialCode, { title: string; color: string; bg: string; border: string; requirements: string[] }> = {
  WAA: { title: "WVW Associate Auditor",      color: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   requirements: ["Audit Fundamentals Bootcamp", "Client Advisory Skills", "40-hr Practicum Shadow"] },
  WCA: { title: "WVW Certified Auditor",      color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", requirements: ["WAA credential", "Advanced Risk Assessment", "IT Audit Techniques", "60-hr Practicum Field Lead"] },
  WCS: { title: "WVW Compliance Specialist",  color: "text-gold",       bg: "bg-gold/10",        border: "border-gold/20",       requirements: ["HIPAA Compliance Practitioner", "SOC 2 Examiner Certification", "HR Audit & Employment Law", "1 completed engagement"] },
  WEP: { title: "WVW Engagement Partner",     color: "text-green-500",  bg: "bg-green-500/10",  border: "border-green-500/20",  requirements: ["WCA + WCS credentials", "Financial Controls & Fraud Detection", "80-hr Practicum Engagement Manager", "Partner endorsement"] },
};

const STATUS_CONFIG: Record<CredentialStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:  { label: "Active",  color: "text-green-600",        bg: "bg-green-500/10" },
  EXPIRED: { label: "Expired", color: "text-amber-600",        bg: "bg-amber-500/10" },
  REVOKED: { label: "Revoked", color: "text-red-600",          bg: "bg-red-500/10" },
};

const EMPTY_FORM = {
  recipientName: "", credentialCode: "WAA" as CredentialCode,
  issuedAt: new Date().toISOString().split("T")[0]!,
  expiresAt: "", notes: "",
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [filterCode, setFilterCode]   = useState<CredentialCode | "all">("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credentials");
      if (res.ok) setCredentials((await res.json()).data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleIssue() {
    if (!form.recipientName.trim()) { setError("Recipient name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName:  form.recipientName,
          credentialCode: form.credentialCode,
          issuedAt:       form.issuedAt || undefined,
          expiresAt:      form.expiresAt || undefined,
          notes:          form.notes    || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.message ?? "Failed to issue credential"); return; }
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } finally { setSaving(false); }
  }

  async function revokeCredential(id: string) {
    if (!confirm("Revoke this credential?")) return;
    await fetch(`/api/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVOKED" }),
    });
    await load();
  }

  async function deleteCredential(id: string) {
    if (!confirm("Permanently delete this credential record?")) return;
    await fetch(`/api/credentials/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = filterCode === "all" ? credentials : credentials.filter((c) => c.credentialCode === filterCode);

  const countsByCode = Object.fromEntries(
    (["WAA","WCA","WCS","WEP"] as CredentialCode[]).map((code) => [
      code, credentials.filter((c) => c.credentialCode === code && c.status === "ACTIVE").length,
    ])
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Award size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Credentials</h1>
            <p className="text-xs text-muted-foreground">Issue and track WVW professional credentials</p>
          </div>
        </div>
        <button type="button" onClick={() => { setForm(EMPTY_FORM); setError(""); setModalOpen(true); }} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Plus size={14} /> Issue Credential
        </button>
      </div>

      {/* Credential type overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["WAA","WCA","WCS","WEP"] as CredentialCode[]).map((code) => {
          const cfg = CREDENTIAL_TYPES[code];
          return (
            <div
              key={code}
              className={cn("section-card p-4 cursor-pointer transition-all", filterCode === code ? "ring-2 ring-gold" : "hover:shadow-md")}
              onClick={() => setFilterCode(filterCode === code ? "all" : code)}
            >
              <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold mb-2", cfg.color, cfg.bg, cfg.border)}>
                <Shield size={11} /> {code}
              </div>
              <p className="text-sm font-semibold leading-tight mb-1">{cfg.title}</p>
              <p className="text-2xl font-bold text-foreground">{countsByCode[code] ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">active credentials</p>
            </div>
          );
        })}
      </div>

      {/* Requirements reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["WAA","WCA","WCS","WEP"] as CredentialCode[]).map((code) => {
          const cfg = CREDENTIAL_TYPES[code];
          return (
            <div key={code} className="section-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded border", cfg.color, cfg.bg, cfg.border)}>{code}</span>
                <span className="text-xs font-semibold text-foreground">{cfg.title}</span>
              </div>
              <ul className="space-y-1">
                {cfg.requirements.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />{r}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Issued credentials table */}
      <div className="section-card overflow-hidden">
        <div className="section-card-header flex items-center justify-between">
          <h2 className="text-sm font-semibold">Issued Credentials</h2>
          <div className="flex items-center gap-2">
            <select value={filterCode} onChange={(e) => setFilterCode(e.target.value as CredentialCode | "all")} aria-label="Filter by code" className="input-base text-xs py-1">
              <option value="all">All Types</option>
              {(["WAA","WCA","WCS","WEP"] as CredentialCode[]).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading credentials…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Award size={28} className="mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No credentials issued yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Credential</th>
                  <th>Verify ID</th>
                  <th>Issued</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const codeCfg = CREDENTIAL_TYPES[c.credentialCode];
                  const statusCfg = STATUS_CONFIG[c.status];
                  return (
                    <tr key={c.id}>
                      <td className="font-medium">{c.recipientName}</td>
                      <td>
                        <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded border", codeCfg.color, codeCfg.bg, codeCfg.border)}>
                          {c.credentialCode}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{c.credentialTitle}</p>
                      </td>
                      <td className="font-mono text-xs text-muted-foreground">{c.verifyId}</td>
                      <td className="text-xs">{new Date(c.issuedAt).toLocaleDateString()}</td>
                      <td className="text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                      <td>
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusCfg.color, statusCfg.bg)}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 justify-end">
                          {c.status === "ACTIVE" && (
                            <button type="button" onClick={() => revokeCredential(c.id)} aria-label="Revoke" title="Revoke credential" className="p-1.5 rounded hover:bg-amber-500/10">
                              <AlertCircle size={13} className="text-amber-500" />
                            </button>
                          )}
                          <button type="button" onClick={() => deleteCredential(c.id)} aria-label="Delete" className="p-1.5 rounded hover:bg-red-500/10">
                            <Trash2 size={13} className="text-red-500/70" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">Issue Credential</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Recipient Name *</label>
                <input className="input-base w-full" value={form.recipientName} onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))} placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Credential Type *</label>
                <select className="input-base w-full" value={form.credentialCode} onChange={(e) => setForm((f) => ({ ...f, credentialCode: e.target.value as CredentialCode }))} aria-label="Credential type">
                  {(["WAA","WCA","WCS","WEP"] as CredentialCode[]).map((code) => (
                    <option key={code} value={code}>{code} — {CREDENTIAL_TYPES[code].title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Issue Date</label>
                  <input type="date" aria-label="Issue date" className="input-base w-full" value={form.issuedAt} onChange={(e) => setForm((f) => ({ ...f, issuedAt: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Expiry Date</label>
                  <input type="date" aria-label="Expiry date" className="input-base w-full" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <textarea className="input-base w-full" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this credential…" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={handleIssue} disabled={saving} className="btn-primary px-4 py-2 text-sm">
                {saving ? "Issuing…" : "Issue Credential"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
