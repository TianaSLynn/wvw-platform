"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Client = { id: string; name: string };

const DEPT_OPTIONS = [
  "Leadership", "Human Resources", "Finance", "Operations",
  "Marketing", "Sales", "IT", "Legal", "Customer Service", "Other",
];

export default function NewEmployeePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    title: "", department: "", location: "", clientId: "",
    employmentStatus: "ACTIVE", employmentType: "full-time",
    level: "", startDate: "", isNeurodivergent: false,
    hasAccommodation: false, accommodationNote: "", tags: [] as string[],
  });

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d: { data: Client[] }) => setClients(d.data ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/workforce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, clientId: form.clientId || undefined }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Failed to create employee");
      }
      router.push("/workforce");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving employee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/workforce" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Workforce
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Building2 size={18} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Add Employee</h1>
            <p className="text-xs text-muted-foreground">Add a client or organizational employee record</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="section-card p-5">
          <h2 className="text-sm font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">First Name *</label>
              <input type="text" required value={form.firstName} onChange={(e) => set("firstName", e.target.value)}
                className="input-base w-full" placeholder="First name" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Name *</label>
              <input type="text" required value={form.lastName} onChange={(e) => set("lastName", e.target.value)}
                className="input-base w-full" placeholder="Last name" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                className="input-base w-full" placeholder="email@company.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="input-base w-full" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
        </div>

        {/* Role & Position */}
        <div className="section-card p-5">
          <h2 className="text-sm font-semibold mb-4">Role & Position</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Title</label>
              <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                className="input-base w-full" placeholder="e.g. Senior Manager" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
              <select value={form.department} onChange={(e) => set("department", e.target.value)}
                className="input-base w-full">
                <option value="">— Select —</option>
                {DEPT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Level</label>
              <input type="text" value={form.level} onChange={(e) => set("level", e.target.value)}
                className="input-base w-full" placeholder="e.g. IC3, M2, Director" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
              <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)}
                className="input-base w-full" placeholder="City, State or Remote" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                className="input-base w-full" />
            </div>
          </div>
        </div>

        {/* Employment */}
        <div className="section-card p-5">
          <h2 className="text-sm font-semibold mb-4">Employment</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <select value={form.employmentStatus} onChange={(e) => set("employmentStatus", e.target.value)}
                className="input-base w-full">
                {["ACTIVE","ONBOARDING","LEAVE","CONTRACT","TERMINATED"].map((s) => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)}
                className="input-base w-full">
                {["full-time","part-time","contract","intern"].map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            {clients.length > 0 && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Client Organization</label>
                <select value={form.clientId} onChange={(e) => set("clientId", e.target.value)}
                  className="input-base w-full">
                  <option value="">— WVW Internal / No Client —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Neuroinclusion */}
        <div className="section-card p-5">
          <h2 className="text-sm font-semibold mb-1">Neuroinclusion & Accommodations</h2>
          <p className="text-xs text-muted-foreground mb-4">Confidential — used for internal workforce analytics and accommodation tracking only.</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isNeurodivergent ?? false}
                onChange={(e) => set("isNeurodivergent", e.target.checked)}
                className="w-4 h-4 rounded border-border accent-gold" />
              <span className="text-sm text-foreground">Employee has disclosed neurodivergence</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.hasAccommodation}
                onChange={(e) => set("hasAccommodation", e.target.checked)}
                className="w-4 h-4 rounded border-border accent-gold" />
              <span className="text-sm text-foreground">Active accommodation in place</span>
            </label>
            {form.hasAccommodation && (
              <textarea
                placeholder="Brief accommodation description (confidential)"
                value={form.accommodationNote}
                onChange={(e) => set("accommodationNote", e.target.value)}
                rows={2}
                className="input-base w-full resize-none text-sm"
              />
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pb-4">
          <Link href="/workforce" className="btn-ghost text-sm">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Saving…" : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
