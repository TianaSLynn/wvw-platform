"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Copy, Check, Users, Building2, UserCheck, Clock, X, Mail } from "lucide-react";

interface Invite {
  id: string; token: string; email: string | null; role: string;
  inviteType: string; clientId: string | null; message: string | null;
  expiresAt: Date; acceptedAt: Date | null; createdAt: Date;
}
interface Client { id: string; name: string; }

interface Props {
  initialInvites: Invite[];
  clients:        Client[];
  baseUrl:        string;
  orgId:          string;
}

const TEAM_ROLES = [
  { value: "CONSULTANT", label: "Consultant" },
  { value: "AUDITOR",    label: "Auditor" },
  { value: "MANAGER",    label: "Manager" },
  { value: "PARTNER",    label: "Partner" },
  { value: "ADMIN",      label: "Admin" },
];

const TYPE_CONFIG = {
  team:     { label: "Team Member",  icon: Users,      color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  client:   { label: "Client",       icon: Building2,  color: "bg-green-500/10 text-green-600 border-green-500/20" },
  employee: { label: "Employee",     icon: UserCheck,  color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
};

export default function InviteManager({ initialInvites, clients, baseUrl }: Props) {
  const [invites, setInvites]  = useState<Invite[]>(initialInvites);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setTab]    = useState<"team" | "client" | "employee">("team");
  const [copied,   setCopied]  = useState<string | null>(null);

  // Form state
  const [email,    setEmail]   = useState("");
  const [role,     setRole]    = useState("CONSULTANT");
  const [clientId, setClientId] = useState("");
  const [message,  setMessage] = useState("");
  const [expires,  setExpires] = useState(7);
  const [saving,   setSaving]  = useState(false);
  const [error,    setError]   = useState<string | null>(null);

  const copyLink = (token: string) => {
    const url = `${baseUrl}/sign-up?invite=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await fetch("/api/invites", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        email:         email.trim() || undefined,
        role:          activeTab === "client" ? "CLIENT_USER" : role,
        inviteType:    activeTab,
        clientId:      activeTab === "client" ? clientId || undefined : undefined,
        message:       message.trim() || undefined,
        expiresInDays: expires,
      }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setInvites((prev) => [data, ...prev]);
      setEmail(""); setRole("CONSULTANT"); setClientId(""); setMessage(""); setShowForm(false);
    } else {
      const { error: e } = await res.json();
      setError(e ?? "Failed to create invite");
    }
    setSaving(false);
  };

  const activeInvites   = invites.filter((i) => !i.acceptedAt && new Date(i.expiresAt) > new Date());
  const acceptedInvites = invites.filter((i) => i.acceptedAt);
  const expiredInvites  = invites.filter((i) => !i.acceptedAt && new Date(i.expiresAt) <= new Date());

  return (
    <div className="space-y-6">
      {/* Type tabs + create button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(["team", "client", "employee"] as const).map((t) => {
            const cfg = TYPE_CONFIG[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeTab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <cfg.icon size={13} /> {cfg.label}s
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus size={15} /> New Invite
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="section-card p-6 space-y-4 border-gold/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              Invite a {TYPE_CONFIG[activeTab].label}
            </h3>
            <button type="button" aria-label="Close" onClick={() => setShowForm(false)}>
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg border border-destructive/20">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="invite-email" className="text-sm font-medium block mb-1">
                Email <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@company.com"
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {activeTab === "team" && (
              <div>
                <label htmlFor="invite-role" className="text-sm font-medium block mb-1">Role</label>
                <select
                  id="invite-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none"
                >
                  {TEAM_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === "client" && (
              <div>
                <label htmlFor="invite-client" className="text-sm font-medium block mb-1">Client</label>
                <select
                  id="invite-client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none"
                >
                  <option value="">No specific client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="invite-expires" className="text-sm font-medium block mb-1">Expires in</label>
              <select
                id="invite-expires"
                value={expires}
                onChange={(e) => setExpires(parseInt(e.target.value))}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="invite-message" className="text-sm font-medium block mb-1">
              Personal message <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="invite-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Welcome to WVW Intelligence! Here's your invite link…"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? "Creating…" : "Generate Invite Link"}
            </button>
          </div>
        </form>
      )}

      {/* Active invites */}
      {activeInvites.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h3 className="text-sm font-semibold">Active Invites</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{activeInvites.length} pending</p>
          </div>
          <div className="divide-y divide-border">
            {activeInvites.map((inv) => {
              const cfg   = TYPE_CONFIG[inv.inviteType as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.team;
              const link  = `${baseUrl}/sign-up?invite=${inv.token}`;
              const isCop = copied === inv.token;
              const daysLeft = Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / 86400000);
              return (
                <div key={inv.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", cfg.color)}>
                        {cfg.label}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {inv.role.replace(/_/g, " ")}
                      </span>
                    </div>
                    {inv.email && <p className="text-xs text-muted-foreground">{inv.email}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate max-w-xs">{link}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={11} /> {daysLeft}d left
                    </span>
                    <button
                      type="button"
                      onClick={() => copyLink(inv.token)}
                      className={cn(
                        "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors",
                        isCop
                          ? "bg-green-500/10 border-green-500/20 text-green-600"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-gold/30"
                      )}
                    >
                      {isCop ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accepted */}
      {acceptedInvites.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h3 className="text-sm font-semibold">Accepted</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{acceptedInvites.length} joined</p>
          </div>
          <div className="divide-y divide-border">
            {acceptedInvites.map((inv) => {
              const cfg = TYPE_CONFIG[inv.inviteType as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.team;
              return (
                <div key={inv.id} className="px-5 py-3 flex items-center gap-3 text-sm opacity-70">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", cfg.color)}>{cfg.label}</span>
                  <span className="text-xs">{inv.email ?? "No email"}</span>
                  <span className="text-xs font-medium text-green-600 ml-auto">
                    Accepted {inv.acceptedAt ? new Date(inv.acceptedAt).toLocaleDateString() : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {invites.length === 0 && !showForm && (
        <div className="empty-state">
          <div className="empty-state-icon"><Mail size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium">No invites yet</p>
          <p className="text-xs text-muted-foreground mt-1">Generate an invite link to bring team members, clients, or employees onto the platform</p>
          <button type="button" onClick={() => setShowForm(true)} className="btn-primary mt-4 text-xs">
            Create First Invite
          </button>
        </div>
      )}
    </div>
  );
}
