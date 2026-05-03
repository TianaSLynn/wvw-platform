"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users, Shield, ChevronDown, Check, Copy, ExternalLink, UserPlus, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "CONSULTANT", label: "Consultant", desc: "Create and update own work items" },
  { value: "AUDITOR",    label: "Auditor",    desc: "Conduct audits, log findings and evidence" },
  { value: "MANAGER",    label: "Manager",    desc: "Manage team and approve work items" },
  { value: "PARTNER",    label: "Partner",    desc: "Full access to all org data" },
  { value: "ADMIN",      label: "Admin",      desc: "Full access + settings management" },
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200 dark:border-red-800",
  ADMIN:       "bg-orange-50 dark:bg-orange-950/30 text-orange-600 border-orange-200 dark:border-orange-800",
  PARTNER:     "bg-gold/10 text-amber-700 border-gold/20",
  MANAGER:     "bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-200 dark:border-blue-800",
  AUDITOR:     "bg-purple-50 dark:bg-purple-950/30 text-purple-600 border-purple-200 dark:border-purple-800",
  CONSULTANT:  "bg-gray-50 dark:bg-gray-900/50 text-gray-600 border-gray-200 dark:border-gray-700",
  CLIENT_ADMIN:"bg-teal-50 dark:bg-teal-950/30 text-teal-600 border-teal-200 dark:border-teal-800",
  CLIENT_USER: "bg-gray-50 dark:bg-gray-900/50 text-gray-500 border-gray-200 dark:border-gray-700",
};

interface Member {
  id: string; firstName: string; lastName: string; email: string;
  role: string; title: string | null; avatarUrl: string | null; createdAt: Date;
  _count: { timeEntries: number; auditAssignments: number };
}

interface Props {
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
}

export default function TeamManagement({ members, currentUserId, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId]  = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [portalData, setPortalData]  = useState<{ url: string; copied: boolean } | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const signUpUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sign-up`
    : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/sign-up`;

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(signUpUrl);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 3000);
  };

  const changeRole = async (userId: string, role: string) => {
    setUpdatingId(userId);
    setOpenDropdown(null);
    const res = await fetch("/api/org/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setUpdatingId(null);
    if (res.ok) startTransition(() => router.refresh());
  };

  const copyPortalLink = async (clientId?: string) => {
    if (!clientId) return;
    const res = await fetch("/api/org/portal-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    if (res.ok) {
      const data = await res.json() as { data: { portalUrl: string } };
      const url = data.data.portalUrl;
      await navigator.clipboard.writeText(url);
      setPortalData({ url, copied: true });
      setTimeout(() => setPortalData((p) => p ? { ...p, copied: false } : null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
              <Users size={18} className="text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Team Members</h1>
              <p className="text-xs text-muted-foreground">{members.length} members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite section */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={15} className="text-gold" />
            <p className="text-sm font-semibold">Invite Team Members</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Share this link with anyone you want to add to WVW Intelligence. When they sign up, they&apos;ll automatically join your organization.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs font-mono truncate">
              <Link2 size={11} className="text-muted-foreground flex-shrink-0" />
              <span className="truncate text-muted-foreground">{signUpUrl}</span>
            </div>
            <button
              type="button"
              onClick={copyInviteLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-medium hover:bg-navy-800 transition-colors flex-shrink-0"
            >
              {inviteCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {inviteCopied ? "Copied!" : "Copy Link"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            New members join with <span className="font-medium">Consultant</span> access by default. Use the role controls below to change permissions after they join.
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {["Member", "Role", "Audits", "Time Entries", isAdmin ? "Actions" : ""].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isMe = member.id === currentUserId;
              return (
                <tr key={member.id} className={cn("border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors", isMe && "bg-gold/5")}>
                  {/* Member */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-navy-900 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gold">
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.firstName} {member.lastName} {isMe && <span className="text-xs text-gold">(you)</span>}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                        {member.title && <p className="text-xs text-muted-foreground">{member.title}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", ROLE_COLORS[member.role] ?? "border-border text-muted-foreground")}>
                      {member.role.replace(/_/g, " ")}
                    </span>
                  </td>

                  {/* Counts */}
                  <td className="py-3.5 px-4 text-muted-foreground text-xs">{member._count.auditAssignments}</td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs">{member._count.timeEntries}</td>

                  {/* Actions */}
                  {isAdmin && (
                    <td className="py-3.5 px-4">
                      {!isMe && member.role !== "SUPER_ADMIN" && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === member.id ? null : member.id)}
                            disabled={updatingId === member.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors"
                          >
                            <Shield size={12} /> Change Role <ChevronDown size={11} />
                          </button>
                          {openDropdown === member.id && (
                            <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-52">
                              {ROLES.map((r) => (
                                <button
                                  key={r.value}
                                  onClick={() => changeRole(member.id, r.value)}
                                  className={cn(
                                    "w-full flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left",
                                    member.role === r.value && "bg-muted"
                                  )}
                                >
                                  {member.role === r.value && <Check size={12} className="text-gold flex-shrink-0 mt-0.5" />}
                                  <div className={member.role !== r.value ? "ml-4" : ""}>
                                    <p className="text-xs font-medium">{r.label}</p>
                                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role legend */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Role Permissions</p>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <div key={r.value} className="flex items-start gap-2.5 text-xs">
              <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0", ROLE_COLORS[r.value] ?? "border-border text-muted-foreground")}>
                {r.label}
              </span>
              <span className="text-muted-foreground pt-0.5">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Portal link generator */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-semibold mb-1 flex items-center gap-2">
            <ExternalLink size={14} className="text-gold" /> Client Portal Links
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Generate a secure, token-based portal link for any client. The link gives read-only access to their audits and invoices — no account required.
          </p>
          {portalData && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-xl text-xs font-mono break-all">
              <span className="flex-1 truncate">{portalData.url}</span>
              <button
                onClick={async () => { await navigator.clipboard.writeText(portalData.url); setPortalData((p) => p ? { ...p, copied: true } : null); }}
                className="flex-shrink-0"
              >
                {portalData.copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} className="text-muted-foreground" />}
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            To generate a portal link for a specific client, visit their client detail page.
          </p>
        </div>
      )}
    </div>
  );
}
