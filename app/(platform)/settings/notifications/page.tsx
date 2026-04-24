"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NOTIFICATION_SETTINGS = [
  {
    category: "Findings & Audits",
    items: [
      { key: "finding.critical",   label: "Critical finding added",       defaultOn: true },
      { key: "finding.high",       label: "High severity finding added",  defaultOn: true },
      { key: "finding.assigned",   label: "Finding assigned to me",       defaultOn: true },
      { key: "finding.status",     label: "Finding status changes",       defaultOn: false },
      { key: "audit.status",       label: "Audit status changes",         defaultOn: true },
      { key: "checklist.complete", label: "Checklist section completed",  defaultOn: false },
    ],
  },
  {
    category: "Invoices & Financials",
    items: [
      { key: "invoice.overdue",    label: "Invoice becomes overdue",      defaultOn: true },
      { key: "invoice.paid",       label: "Invoice paid",                 defaultOn: true },
      { key: "invoice.sent",       label: "Invoice sent to client",       defaultOn: false },
    ],
  },
  {
    category: "Remediations",
    items: [
      { key: "remediation.assigned", label: "Remediation action assigned to me", defaultOn: true },
      { key: "remediation.overdue",  label: "Remediation action overdue",        defaultOn: true },
      { key: "remediation.complete", label: "All remediations complete",         defaultOn: true },
    ],
  },
  {
    category: "Team & Workflow",
    items: [
      { key: "task.assigned",      label: "Task assigned to me",          defaultOn: true },
      { key: "task.due",           label: "Task due tomorrow",            defaultOn: true },
      { key: "mention",            label: "Someone mentions me",          defaultOn: true },
      { key: "digest.weekly",      label: "Weekly digest email",          defaultOn: true },
    ],
  },
  {
    category: "Workforce & Community",
    items: [
      { key: "onboarding.milestone", label: "Onboarding milestone missed",   defaultOn: true },
      { key: "burnout.alert",        label: "Burnout risk threshold crossed", defaultOn: true },
      { key: "community.post",       label: "New post in my spaces",          defaultOn: false },
      { key: "survey.response",      label: "New survey response received",   defaultOn: true },
    ],
  },
];

const ALL_DEFAULTS: Record<string, boolean> = {};
for (const cat of NOTIFICATION_SETTINGS) {
  for (const item of cat.items) {
    ALL_DEFAULTS[item.key] = item.defaultOn;
  }
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, boolean>>(ALL_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/org/notification-settings")
      .then((r) => r.json())
      .then((d: { data: Record<string, boolean> }) => {
        if (d.data && Object.keys(d.data).length > 0) {
          setSettings({ ...ALL_DEFAULTS, ...d.data });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: string) => setSettings((p) => ({ ...p, [key]: !p[key] }));

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/org/notification-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Back to Settings
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
            <Bell size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Notification Preferences</h1>
            <p className="text-xs text-muted-foreground">Choose what you get notified about</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {NOTIFICATION_SETTINGS.map(({ category, items }) => (
            <div key={category} className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</p>
              <div className="space-y-0.5">
                {items.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <span className="text-sm">{label}</span>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className={cn(
                        "w-11 h-6 rounded-full relative transition-colors flex-shrink-0",
                        settings[key] ? "bg-navy-900" : "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                        settings[key] ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end pb-4">
            <button
              type="button"
              onClick={save}
              disabled={saving || saved}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 disabled:opacity-70 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
              {saved ? "Saved!" : "Save Preferences"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
