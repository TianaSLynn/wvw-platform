"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientAccountSchema } from "@/lib/validations";
import { Building2, ClipboardCheck, Contact, Loader2 } from "lucide-react";
import type { z } from "zod";

type FormData = z.infer<typeof createClientAccountSchema>;

const INDUSTRIES = [
  "Consulting", "Healthcare", "Technology", "Finance", "Education",
  "Non-Profit", "Government", "Retail", "Manufacturing", "Real Estate",
  "Legal", "Marketing", "Other",
];
const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const PARTICIPANT_GROUPS = ["Leadership", "Managers", "Employees", "Board / Governance", "Volunteers", "Service Recipients / Clients"];

const inputClass = "mt-1 w-full min-h-10 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold";
const labelClass = "text-sm font-medium";

export default function NewClientForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createClientAccountSchema),
    defaultValues: {
      primaryContact: { firstName: "", lastName: "", email: "", phone: "", title: "", department: "" },
      onboardingContext: {
        relationshipStage: "ONBOARDING",
        primaryGoal: "",
        knownConcerns: "",
        participantGroups: [],
        targetLaunchDate: "",
        accessibilityNeeds: "",
      },
    },
  });

  const selectedGroups = watch("onboardingContext.participantGroups") ?? [];
  const toggleGroup = (group: string) => {
    setValue(
      "onboardingContext.participantGroups",
      selectedGroups.includes(group) ? selectedGroups.filter((item) => item !== group) : [...selectedGroups, group],
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to create client account");
      const warnings = Array.isArray(body.data.warnings) ? body.data.warnings as string[] : [];
      const params = new URLSearchParams({ created: "1" });
      if (warnings.length) params.set("setupWarning", warnings.join(" "));
      router.push(`/clients/${body.data.client.id}?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20">{error}</div>}

      <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
        <p className="text-sm font-semibold">This creates the client’s WVW Intelligence account.</p>
        <p className="mt-1 text-xs text-muted-foreground">The system will also start client onboarding and assign the required Organizational Initial Audit. Billing is completed later under Finance after scope and terms are approved.</p>
      </div>

      <section className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <div className="flex items-start gap-3">
          <Building2 size={19} className="mt-0.5 text-gold" />
          <div><h2 className="font-semibold">1. Organization profile</h2><p className="text-xs text-muted-foreground">The identity used across onboarding, audits, evidence, reports, and finance.</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className={labelClass}>Organization name *</label><input {...register("name")} className={inputClass} />{errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}</div>
          <div><label className={labelClass}>Legal name</label><input {...register("legalName")} className={inputClass} /></div>
          <div><label className={labelClass}>Website</label><input {...register("website")} placeholder="https://example.org" className={inputClass} />{errors.website && <p className="text-xs text-destructive mt-1">{errors.website.message}</p>}</div>
          <div><label className={labelClass}>Industry</label><select {...register("industry")} className={inputClass}><option value="">Select…</option>{INDUSTRIES.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className={labelClass}>Organization size</label><select {...register("size")} className={inputClass}><option value="">Select…</option>{SIZES.map((item) => <option key={item} value={item}>{item} employees</option>)}</select></div>
          <div className="md:col-span-2"><label className={labelClass}>Organization context</label><textarea {...register("description")} rows={3} placeholder="Mission, services, communities served, and relevant relationship context" className={inputClass} /></div>
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <div className="flex items-start gap-3">
          <Contact size={19} className="mt-0.5 text-gold" />
          <div><h2 className="font-semibold">2. Primary client contact</h2><p className="text-xs text-muted-foreground">The first decision-maker or coordinator attached to the account. Additional contacts can be added afterward.</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>First name *</label><input {...register("primaryContact.firstName")} className={inputClass} /></div>
          <div><label className={labelClass}>Last name *</label><input {...register("primaryContact.lastName")} className={inputClass} /></div>
          <div><label className={labelClass}>Email *</label><input type="email" {...register("primaryContact.email")} className={inputClass} />{errors.primaryContact?.email && <p className="text-xs text-destructive mt-1">{errors.primaryContact.email.message}</p>}</div>
          <div><label className={labelClass}>Phone</label><input {...register("primaryContact.phone")} className={inputClass} /></div>
          <div><label className={labelClass}>Title / role</label><input {...register("primaryContact.title")} placeholder="Executive sponsor, HR lead…" className={inputClass} /></div>
          <div><label className={labelClass}>Department</label><input {...register("primaryContact.department")} className={inputClass} /></div>
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <div className="flex items-start gap-3">
          <ClipboardCheck size={19} className="mt-0.5 text-gold" />
          <div><h2 className="font-semibold">3. Begin the diagnostic journey</h2><p className="text-xs text-muted-foreground">This context becomes part of onboarding and the client’s Organizational Initial Audit.</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Relationship stage *</label><select {...register("onboardingContext.relationshipStage")} className={inputClass}><option value="PROSPECT">Prospect</option><option value="CONTRACTING">Contracting</option><option value="ONBOARDING">Onboarding</option><option value="ACTIVE">Active engagement</option></select></div>
          <div><label className={labelClass}>Target audit launch</label><input type="date" {...register("onboardingContext.targetLaunchDate")} className={inputClass} /></div>
          <div className="md:col-span-2"><label className={labelClass}>What does the client need WVW to help them understand or improve? *</label><textarea {...register("onboardingContext.primaryGoal")} rows={3} placeholder="State the decision, concern, or outcome driving the engagement." className={inputClass} />{errors.onboardingContext?.primaryGoal && <p className="text-xs text-destructive mt-1">{errors.onboardingContext.primaryGoal.message}</p>}</div>
          <div className="md:col-span-2"><label className={labelClass}>Known concerns or early signals</label><textarea {...register("onboardingContext.knownConcerns")} rows={3} placeholder="Turnover, burnout, morale, leadership gaps, communication, service experience, policy-to-practice gaps…" className={inputClass} /></div>
          <div className="md:col-span-2"><label className={labelClass}>Expected participant groups</label><div className="mt-2 flex flex-wrap gap-2">{PARTICIPANT_GROUPS.map((group) => <button key={group} type="button" onClick={() => toggleGroup(group)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${selectedGroups.includes(group) ? "border-gold bg-gold/15 text-foreground" : "border-border text-muted-foreground hover:border-gold/50"}`}>{group}</button>)}</div></div>
          <div className="md:col-span-2"><label className={labelClass}>Accessibility, language, technology, or participation needs</label><textarea {...register("onboardingContext.accessibilityNeeds")} rows={2} className={inputClass} /></div>
        </div>
      </section>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pb-6">
        <button type="button" onClick={() => router.back()} className="px-4 min-h-10 rounded-lg text-sm border border-border hover:bg-muted">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 px-6 min-h-10 rounded-lg text-sm font-semibold bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-50">
          {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : <><ClipboardCheck size={15} /> Create account & start onboarding</>}
        </button>
      </div>
    </form>
  );
}
