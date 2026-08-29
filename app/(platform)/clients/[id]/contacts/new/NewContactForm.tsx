"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";

export default function NewContactForm({ client }: { client: { id: string; name: string } }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/clients/${client.id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"),
        phone: form.get("phone"), title: form.get("title"), department: form.get("department"),
        notes: form.get("notes"), isPrimary: form.get("isPrimary") === "on",
        isDecisionMaker: form.get("isDecisionMaker") === "on",
      }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error ?? "The contact could not be added.");
      setSaving(false);
      return;
    }
    router.push(`/clients/${client.id}`);
    router.refresh();
  }

  const input = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  return <div className="mx-auto max-w-2xl space-y-5">
    <div><h1 className="text-xl font-bold">Add client contact</h1><p className="text-sm text-muted-foreground">{client.name}</p></div>
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-card p-6">
      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">First name *<input name="firstName" required className={input} /></label>
        <label className="text-sm font-medium">Last name *<input name="lastName" required className={input} /></label>
        <label className="text-sm font-medium sm:col-span-2">Email<input name="email" type="email" className={input} /></label>
        <label className="text-sm font-medium">Phone<input name="phone" className={input} /></label>
        <label className="text-sm font-medium">Title / role<input name="title" className={input} /></label>
        <label className="text-sm font-medium sm:col-span-2">Department<input name="department" className={input} /></label>
        <label className="text-sm font-medium sm:col-span-2">Support notes<textarea name="notes" rows={3} className={input} /></label>
      </div>
      <div className="flex flex-wrap gap-5 text-sm"><label className="flex gap-2"><input name="isDecisionMaker" type="checkbox" /> Decision-maker</label><label className="flex gap-2"><input name="isPrimary" type="checkbox" /> Make primary contact</label></div>
      <div className="flex justify-end gap-3"><button type="button" onClick={() => router.back()} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Add contact</button></div>
    </form>
  </div>;
}
