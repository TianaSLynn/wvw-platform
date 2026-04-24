"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn, formatCurrency } from "@/lib/utils";
import { Clock, Plus, ChevronLeft, Loader2, CheckCircle, X } from "lucide-react";

const schema = z.object({
  projectId:   z.string().optional(),
  description: z.string().min(3, "Required"),
  date:        z.string(),
  hours:       z.coerce.number().min(0.25).max(24),
  isBillable:  z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

interface Entry {
  id: string; description: string; date: Date | string; hours: number;
  isBillable: boolean; billableRate: number | null; status: string;
  user: { firstName: string; lastName: string };
  project: { id: string; name: string; client: { name: string } } | null;
  task: { title: string } | null;
}

interface Props {
  entries: Entry[];
  projects: Array<{ id: string; name: string; client: { name: string } }>;
  members: Array<{ id: string; firstName: string; lastName: string }>;
  isAdmin: boolean;
  currentUserId: string;
  stats: { totalHours: number; billableHours: number; billableValue: number };
}

export default function TimeTrackingClient({ entries, projects, members, isAdmin, currentUserId, stats }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date:       new Date().toISOString().slice(0, 10),
      isBillable: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      reset();
      startTransition(() => router.refresh());
    }
  };

  const utilization = stats.totalHours > 0 ? Math.round((stats.billableHours / stats.totalHours) * 100) : 0;

  // Group entries by date
  const byDate: Record<string, Entry[]> = {};
  for (const e of entries) {
    const key = new Date(e.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(e);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
              <Clock size={18} className="text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Time Tracking</h1>
              <p className="text-xs text-muted-foreground">This month · {isAdmin ? "All team" : "My entries"}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors"
        >
          <Plus size={15} /> Log Time
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Hours",     value: stats.totalHours.toFixed(1) + "h",     color: "text-foreground" },
          { label: "Billable",        value: `${utilization}% · ${stats.billableHours.toFixed(1)}h`, color: utilization >= 70 ? "text-green-500" : "text-amber-500" },
          { label: "Billable Value",  value: formatCurrency(stats.billableValue),   color: "text-gold" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-card border border-gold/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Log Time Entry</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Date</label>
                <input type="date" {...register("date")}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Hours</label>
                <input type="number" step="0.25" {...register("hours")} placeholder="0.00"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
                {errors.hours && <p className="text-red-500 text-xs mt-0.5">{errors.hours.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Description</label>
              <input {...register("description")} placeholder="What did you work on?"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground" />
              {errors.description && <p className="text-red-500 text-xs mt-0.5">{errors.description.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Project</label>
              <select {...register("projectId")}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold">
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.client.name} · {p.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" {...register("isBillable")} id="billable" className="rounded" />
              <label htmlFor="billable" className="text-sm">Billable</label>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting || success}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 disabled:opacity-70 transition-colors">
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : success ? <CheckCircle size={14} /> : null}
                {success ? "Logged!" : "Log Time"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries */}
      {Object.keys(byDate).length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Clock size={28} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No time entries this month</p>
          <p className="text-sm text-muted-foreground mt-1">Click &quot;Log Time&quot; to add your first entry.</p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {Object.entries(byDate).map(([date, dayEntries]) => {
            const dayTotal = dayEntries.reduce((s, e) => s + e.hours, 0);
            return (
              <div key={date} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
                  <p className="text-sm font-semibold">{date}</p>
                  <p className="text-sm text-muted-foreground">{dayTotal.toFixed(1)}h</p>
                </div>
                <div className="divide-y divide-border/50">
                  {dayEntries.map((e) => (
                    <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.project ? `${e.project.client.name} · ${e.project.name}` : "No project"}
                          {isAdmin && ` · ${e.user.firstName} ${e.user.lastName}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {e.isBillable && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 border border-green-200 dark:border-green-800">
                            Billable
                          </span>
                        )}
                        <span className={cn("text-sm font-semibold", e.isBillable ? "text-foreground" : "text-muted-foreground")}>
                          {e.hours.toFixed(2)}h
                        </span>
                        {e.isBillable && e.billableRate && (
                          <span className="text-xs text-muted-foreground">{formatCurrency(e.hours * e.billableRate)}</span>
                        )}
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full border",
                          e.status === "APPROVED" ? "bg-green-50 text-green-600 border-green-200" :
                          e.status === "DRAFT"    ? "bg-gray-50 text-gray-500 border-gray-200" :
                          "bg-amber-50 text-amber-600 border-amber-200"
                        )}>{e.status.charAt(0) + e.status.slice(1).toLowerCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
