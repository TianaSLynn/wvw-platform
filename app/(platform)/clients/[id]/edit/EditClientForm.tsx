"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ChevronLeft, Loader2, CheckCircle, Building2 } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  name:          z.string().min(2, "Required"),
  legalName:     z.string().optional(),
  industry:      z.string().optional(),
  size:          z.string().optional(),
  website:       z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description:   z.string().optional(),
  contactFirstName: z.string().min(1, "Required"),
  contactLastName: z.string().min(1, "Required"),
  contactEmail: z.string().email("Must be a valid email"),
  contactPhone: z.string().optional(),
  contactTitle: z.string().optional(),
  contactDepartment: z.string().optional(),
  isActive:      z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface Props {
  client: {
    id: string; name: string; legalName: string | null; industry: string | null;
    size: string | null; website: string | null; description: string | null;
    billingEmail: string | null; taxId: string | null; paymentTerms: number;
    defaultRate: number | null; isActive: boolean;
    primaryContact: { firstName: string; lastName: string; email: string | null; phone: string | null; title: string | null; department: string | null } | null;
  };
}

const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const INDUSTRIES = [
  "Nonprofit", "Healthcare", "Education", "Government", "Technology",
  "Finance", "Legal", "Real Estate", "Retail", "Manufacturing", "Other",
];

const inputCls = "w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/60 transition-all placeholder:text-muted-foreground";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function EditClientForm({ client }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         client.name,
      legalName:    client.legalName ?? "",
      industry:     client.industry ?? "",
      size:         client.size ?? "",
      website:      client.website ?? "",
      description:  client.description ?? "",
      contactFirstName: client.primaryContact?.firstName ?? "",
      contactLastName: client.primaryContact?.lastName ?? "",
      contactEmail: client.primaryContact?.email ?? "",
      contactPhone: client.primaryContact?.phone ?? "",
      contactTitle: client.primaryContact?.title ?? "",
      contactDepartment: client.primaryContact?.department ?? "",
      isActive:     client.isActive,
    },
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        legalName: data.legalName,
        industry: data.industry,
        size: data.size,
        website: data.website || undefined,
        description: data.description,
        isActive: data.isActive,
        primaryContact: {
          firstName: data.contactFirstName,
          lastName: data.contactLastName,
          email: data.contactEmail,
          phone: data.contactPhone,
          title: data.contactTitle,
          department: data.contactDepartment,
        },
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => router.push(`/clients/${client.id}`), 800);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft size={16} /> Back to Client
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
            <Building2 size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Manage Client Account</h1>
            <p className="text-xs text-muted-foreground">{client.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-sm">Basic Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Client Name *</label>
              <input {...register("name")} className={inputCls} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Legal Name</label>
              <input {...register("legalName")} className={inputCls} placeholder="Full legal entity name" />
            </div>
            <div>
              <label className={labelCls}>Industry</label>
              <select {...register("industry")} className={inputCls}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Organization Size</label>
              <select {...register("size")} className={inputCls}>
                <option value="">Select size</option>
                {SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input {...register("website")} className={inputCls} placeholder="https://example.org" />
              {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className={cn(inputCls, "resize-none")}
                placeholder="Brief description of the client organization…"
              />
            </div>
          </div>
        </div>

        {/* Primary contact */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-sm">Primary Client Contact</h2>
            <p className="text-xs text-muted-foreground mt-1">The person WVW supports through onboarding and the Organizational Initial Audit.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name *</label>
              <input {...register("contactFirstName")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Last Name *</label>
              <input {...register("contactLastName")} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Email *</label>
              <input {...register("contactEmail")} className={inputCls} placeholder="name@organization.org" />
              {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input {...register("contactTitle")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Department</label>
              <input {...register("contactDepartment")} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Phone</label>
              <input {...register("contactPhone")} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gold/25 bg-gold/5 p-5">
          <p className="text-sm font-semibold">Billing is managed separately</p>
          <p className="text-xs text-muted-foreground mt-1">Invoices, payment terms, rates, and tax details belong in Finance &amp; Business after the engagement scope is approved. They are no longer part of client account onboarding.</p>
        </div>

        {/* Status */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-sm mb-4">Status</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("isActive")} className="rounded w-4 h-4" />
            <div>
              <p className="text-sm font-medium">Active Client</p>
              <p className="text-xs text-muted-foreground">Inactive clients are hidden from most views</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || saved}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium",
              "bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-70"
            )}
          >
            {saved ? (
              <><CheckCircle size={15} className="text-green-400" /> Saved!</>
            ) : isSubmitting ? (
              <><Loader2 size={15} className="animate-spin" /> Saving…</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
