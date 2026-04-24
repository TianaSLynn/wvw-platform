"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = ["SUPER_ADMIN", "ADMIN", "PARTNER", "MANAGER", "CONSULTANT", "AUDITOR", "CLIENT_ADMIN", "CLIENT_USER"];
const STATUSES = ["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"];

interface Member {
  id: string; firstName: string; lastName: string; email: string; phone: string | null;
  title: string | null; role: string; department: string | null; bio: string | null;
  avatarUrl: string | null; billableRate: number | null; targetUtilization: number; status: string;
}

interface Props { member: Member; isAdmin: boolean; isSelf: boolean }

export default function EditEmployeeForm({ member, isAdmin, isSelf }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone ?? "",
    bio: member.bio ?? "",
    // Admin-only
    title: member.title ?? "",
    department: member.department ?? "",
    role: member.role,
    billableRate: member.billableRate?.toString() ?? "",
    targetUtilization: Math.round(member.targetUtilization * 100).toString(),
    status: member.status,
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || null,
      bio: form.bio || null,
    };

    if (isAdmin) {
      body.title = form.title || null;
      body.department = form.department || null;
      body.role = form.role;
      body.status = form.status;
      if (form.billableRate) body.billableRate = parseFloat(form.billableRate);
      if (form.targetUtilization) body.targetUtilization = parseFloat(form.targetUtilization) / 100;
    }

    const res = await fetch(`/api/users/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/people/staff");
      router.refresh();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Failed to save");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
            <User size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Edit Employee</h1>
            <p className="text-xs text-muted-foreground">{member.firstName} {member.lastName} · {member.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Info */}
        <div className="section-card">
          <div className="section-card-header">
            <h2 className="text-sm font-semibold">Personal Information</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name</label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name</label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  className="input-base w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@example.com"
                className="input-base w-full"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Platform email — does not change your login credentials</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. +1 (555) 000-0000"
                className="input-base w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={3}
                placeholder="A brief professional summary…"
                className="input-base w-full resize-none"
              />
            </div>
          </div>
        </div>

        {/* Admin-only: Role & Position */}
        {isAdmin && (
          <div className="section-card">
            <div className="section-card-header">
              <h2 className="text-sm font-semibold">Role & Position</h2>
              {isSelf && <p className="text-xs text-muted-foreground">You are editing your own record</p>}
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Job Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. Senior Auditor"
                    className="input-base w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department</label>
                  <input
                    value={form.department}
                    onChange={(e) => set("department", e.target.value)}
                    placeholder="e.g. Audit"
                    className="input-base w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => set("role", e.target.value)}
                    className="input-base w-full"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    className="input-base w-full"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Billable Rate ($/hr)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={form.billableRate}
                    onChange={(e) => set("billableRate", e.target.value)}
                    placeholder="e.g. 200"
                    className="input-base w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Target Utilization (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.targetUtilization}
                    onChange={(e) => set("targetUtilization", e.target.value)}
                    placeholder="e.g. 75"
                    className="input-base w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="btn-ghost px-4">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={cn("btn-primary flex items-center gap-2 px-5", saving && "opacity-60 cursor-not-allowed")}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
