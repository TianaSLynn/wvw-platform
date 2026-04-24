"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Building2, Loader2, Check, CalendarDays } from "lucide-react";

const schema = z.object({
  name:            z.string().min(1, "Required"),
  website:         z.string().url("Must be a valid URL").optional().or(z.literal("")),
  industry:        z.string().optional(),
  timezone:        z.string(),
  currency:        z.string().length(3),
  fiscalYearStart: z.coerce.number().min(1).max(12),
});

type FormData = z.infer<typeof schema>;

const INDUSTRIES = [
  "Accounting & Audit", "Banking & Finance", "Consulting", "Government",
  "Healthcare", "Insurance", "Legal", "Manufacturing", "Non-Profit",
  "Real Estate", "Technology", "Other",
];

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "Pacific/Honolulu", "America/Anchorage",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo",
  "Asia/Singapore", "Australia/Sydney",
];

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD", "CHF"];

const MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

interface Props {
  org: {
    id: string; name: string; website: string | null; industry: string | null;
    timezone: string; currency: string; fiscalYearStart: number;
    settings: unknown; logoUrl: string | null; slug: string;
  };
}

export default function OrgSettingsForm({ org }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const existingSettings = (org.settings && typeof org.settings === "object" ? org.settings : {}) as Record<string, unknown>;
  const [bookingUrl, setBookingUrl] = useState<string>((existingSettings.interviewBookingUrl as string) ?? "");
  const [bookingSaved, setBookingSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:            org.name,
      website:         org.website ?? "",
      industry:        org.industry ?? "",
      timezone:        org.timezone,
      currency:        org.currency,
      fiscalYearStart: org.fiscalYearStart,
    },
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/org", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    }
  };

  const saveBookingUrl = async () => {
    const res = await fetch("/api/org", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { ...existingSettings, interviewBookingUrl: bookingUrl } }),
    });
    if (res.ok) {
      setBookingSaved(true);
      setTimeout(() => setBookingSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Back to Settings
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
            <Building2 size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Organization Settings</h1>
            <p className="text-xs text-muted-foreground">/{org.slug}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-sm">General</h2>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Organization Name <span className="text-red-500">*</span></label>
            <input
              {...register("name")}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Website</label>
            <input
              {...register("website")}
              placeholder="https://"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
            />
            {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Industry</label>
            <select
              {...register("industry")}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-sm">Regional Defaults</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Timezone</label>
              <select
                {...register("timezone")}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Currency</label>
              <select
                {...register("currency")}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Fiscal Year Start</label>
            <select
              {...register("fiscalYearStart")}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Interview booking URL — saved separately via settings JSON */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-gold" />
            <h2 className="font-semibold text-sm">Interview Booking Link</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste your Calendly, Cal.com, Squarespace, or Acuity scheduling link. A "Schedule Interview" button will appear on every job applicant using this link.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              placeholder="https://calendly.com/your-name/interview"
              className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={saveBookingUrl}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold text-navy-900 text-sm font-semibold hover:bg-gold/90 transition-colors"
            >
              {bookingSaved ? <Check size={13} /> : null}
              {bookingSaved ? "Saved!" : "Save"}
            </button>
          </div>
          {bookingUrl && (
            <p className="text-[11px] text-green-500">
              Candidate name &amp; email will be pre-filled automatically when you click "Schedule Interview."
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || saved}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 disabled:opacity-70 transition-colors"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
