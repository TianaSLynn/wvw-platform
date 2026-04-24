"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema } from "@/lib/validations";
import { Users } from "lucide-react";
import type { z } from "zod";

type FormData = z.infer<typeof clientSchema>;

const INDUSTRIES = [
  "Consulting", "Healthcare", "Technology", "Finance", "Education",
  "Non-Profit", "Government", "Retail", "Manufacturing", "Real Estate",
  "Legal", "Marketing", "Other",
];

const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

export default function NewClientForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { isActive: true, paymentTerms: 30 },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create client");
      }
      const { data: client } = await res.json();
      router.push(`/clients/${client.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  const field = (name: keyof FormData, label: string, required = false) => (
    <div>
      <label className="text-sm font-medium">{label}{required && " *"}</label>
      <input
        {...register(name)}
        className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
      />
      {errors[name] && <p className="text-xs text-destructive mt-1">{String(errors[name]?.message)}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20">{error}</div>
      )}

      {/* Core info */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Company Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">{field("name", "Client Name", true)}</div>
          {field("legalName", "Legal Name")}

          <div>
            <label className="text-sm font-medium">Industry</label>
            <select {...register("industry")}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Select…</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Company Size</label>
            <select {...register("size")}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Select…</option>
              {SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </div>

          {field("website", "Website")}
          {field("billingEmail", "Billing Email")}
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea {...register("description")} rows={3}
            placeholder="Brief description of the client and your relationship"
            className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
          />
        </div>
      </div>

      {/* Billing */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Billing Setup</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Payment Terms (days)</label>
            <input type="number" min={0} {...register("paymentTerms", { valueAsNumber: true })}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Default Rate ($/hr)</label>
            <input type="number" min={0} step={0.01} {...register("defaultRate", { valueAsNumber: true })}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          {field("taxId", "Tax ID")}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-4 h-9 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
        >Cancel</button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 px-6 h-9 rounded-lg text-sm font-semibold bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Users size={14} />}
          Add Client
        </button>
      </div>
    </form>
  );
}
