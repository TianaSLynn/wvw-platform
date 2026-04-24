"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "@/lib/validations";
import { Briefcase } from "lucide-react";
import type { z } from "zod";

type FormData = z.infer<typeof projectSchema>;

const PROJECT_TYPES = ["CONSULTING","ADVISORY","TRAINING","RETAINER","ASSESSMENT","AUDIT"];
const BILLING_MODELS = ["Fixed Price", "Time & Materials", "Retainer", "Milestone-Based"];

interface Props { clients: Array<{ id: string; name: string }> }

export default function NewEngagementForm({ clients }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { type: "CONSULTING", status: "DISCOVERY", priority: "MEDIUM", tags: [] },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create engagement");
      }
      const { data: project } = await res.json();
      router.push(`/engagements/${project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20">{error}</div>
      )}

      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Engagement Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium">Engagement Name *</label>
            <input {...register("name")}
              placeholder="e.g. Q1 HR Strategy Consulting"
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Client *</label>
            <select {...register("clientId")}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <p className="text-xs text-destructive mt-1">{errors.clientId.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Project Code</label>
            <input {...register("code")} placeholder="PROJ-2025-001"
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold font-mono"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <select {...register("type")}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Priority</label>
            <select {...register("priority")}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {["CRITICAL","HIGH","MEDIUM","LOW"].map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea {...register("description")} rows={3}
              className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Budget & Billing</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Budget ($)</label>
            <input type="number" min={0} {...register("budget", { valueAsNumber: true })}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Hours Budget</label>
            <input type="number" min={0} {...register("hoursBudget", { valueAsNumber: true })}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">Billing Model</label>
            <select {...register("billingModel")}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Select…</option>
              {BILLING_MODELS.map((b) => <option key={b} value={b.toLowerCase().replace(/ /g, "_")}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Timeline</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <input type="date" {...register("startDate")}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Target End Date</label>
            <input type="date" {...register("targetEndDate")}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-4 h-9 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
        >Cancel</button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 px-6 h-9 rounded-lg text-sm font-semibold bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Briefcase size={14} />}
          Create Engagement
        </button>
      </div>
    </form>
  );
}
