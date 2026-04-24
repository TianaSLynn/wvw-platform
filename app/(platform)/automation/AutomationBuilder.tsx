"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Zap, Plus, ChevronRight, AlertTriangle, FileText,
  Users, DollarSign, Bell, Mail, MessageSquare,
  Clock, CheckCircle, Shield, Trash2, ToggleLeft,
  Workflow, ExternalLink, RefreshCw, Play,
} from "lucide-react";

interface Rule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: boolean;
  runCount: number;
  lastRun: string | null;
}

const TRIGGERS = [
  { value: "finding.created",         label: "Finding Created",           icon: AlertTriangle, color: "text-orange-500" },
  { value: "finding.critical",        label: "Critical Finding Added",    icon: Shield,        color: "text-red-500" },
  { value: "finding.status.changed",  label: "Finding Status Changed",    icon: CheckCircle,   color: "text-green-500" },
  { value: "audit.status.changed",    label: "Audit Status Changed",      icon: FileText,      color: "text-blue-500" },
  { value: "audit.checklist.complete",label: "Checklist Completed",       icon: CheckCircle,   color: "text-green-500" },
  { value: "invoice.overdue",         label: "Invoice Becomes Overdue",   icon: DollarSign,    color: "text-red-500" },
  { value: "invoice.paid",            label: "Invoice Paid",              icon: DollarSign,    color: "text-green-500" },
  { value: "remediation.all_done",    label: "All Remediations Complete", icon: CheckCircle,   color: "text-green-500" },
  { value: "user.added",              label: "Team Member Added",         icon: Users,         color: "text-blue-500" },
  { value: "schedule.daily",          label: "Daily at 9 AM",             icon: Clock,         color: "text-purple-500" },
  { value: "schedule.weekly",         label: "Weekly on Monday",          icon: Clock,         color: "text-purple-500" },
];

const CONDITIONS = [
  { value: "always",              label: "Always run" },
  { value: "severity.critical",   label: "Only if severity is Critical" },
  { value: "severity.high",       label: "Only if severity is High or Critical" },
  { value: "client.specific",     label: "For a specific client" },
  { value: "audit.type.soc2",     label: "Only for SOC 2 audits" },
  { value: "finding.unassigned",  label: "Only if unassigned" },
];

const ACTIONS = [
  { value: "notify.assignee",     label: "Notify assignee",              icon: Bell,           color: "text-gold" },
  { value: "notify.team",         label: "Notify entire team",           icon: Bell,           color: "text-gold" },
  { value: "email.client",        label: "Email client contact",         icon: Mail,           color: "text-blue-500" },
  { value: "slack.alert",         label: "Send Slack message",           icon: MessageSquare,  color: "text-purple-500" },
  { value: "create.task",         label: "Create follow-up task",        icon: CheckCircle,    color: "text-green-500" },
  { value: "escalate.partner",    label: "Escalate to Partner",          icon: Shield,         color: "text-orange-500" },
  { value: "generate.report",     label: "Auto-generate AI report",      icon: FileText,       color: "text-purple-500" },
  { value: "notify.overdue",      label: "Send overdue reminder",        icon: Clock,          color: "text-red-500" },
  { value: "n8n.workflow",        label: "Trigger n8n Workflow",         icon: Workflow,       color: "text-orange-400" },
];

const SAMPLE_RULES: Rule[] = [
  {
    id: "1",
    name: "Critical Finding Alert",
    trigger: "finding.critical",
    condition: "always",
    action: "notify.team",
    enabled: true,
    runCount: 14,
    lastRun: "2 hours ago",
  },
  {
    id: "2",
    name: "Overdue Invoice Reminder",
    trigger: "invoice.overdue",
    condition: "always",
    action: "email.client",
    enabled: true,
    runCount: 7,
    lastRun: "Yesterday",
  },
  {
    id: "3",
    name: "Remediation Complete → Auto-Report",
    trigger: "remediation.all_done",
    condition: "severity.critical",
    action: "generate.report",
    enabled: false,
    runCount: 2,
    lastRun: "3 days ago",
  },
];

type Step = "trigger" | "condition" | "action" | "name";

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
}

const N8N_URL = process.env.NEXT_PUBLIC_N8N_URL ?? "http://localhost:5678";

export default function AutomationBuilder() {
  const [rules, setRules]             = useState<Rule[]>(SAMPLE_RULES);
  const [showBuilder, setShowBuilder]  = useState(false);
  const [step, setStep]               = useState<Step>("trigger");
  const [newRule, setNewRule]         = useState({ trigger: "", condition: "always", action: "", name: "", n8nWebhook: "" });
  const [n8nWorkflows, setN8nWorkflows] = useState<N8nWorkflow[]>([]);
  const [n8nStatus, setN8nStatus]     = useState<"idle" | "loading" | "connected" | "error">("idle");
  const [showN8nPanel, setShowN8nPanel] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState<string | null>(null);

  const fetchN8nWorkflows = async () => {
    setN8nStatus("loading");
    try {
      const res = await fetch("/api/automations/n8n");
      if (res.ok) {
        const data = await res.json() as { data: N8nWorkflow[] };
        setN8nWorkflows(data.data ?? []);
        setN8nStatus("connected");
      } else {
        setN8nStatus("error");
      }
    } catch {
      setN8nStatus("error");
    }
  };

  const triggerWorkflow = async (workflowId: string, webhookUrl: string) => {
    setTriggerLoading(workflowId);
    try {
      await fetch("/api/automations/n8n/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, webhookUrl, source: "manual" }),
      });
    } finally {
      setTriggerLoading(null);
    }
  };

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const saveRule = () => {
    const rule: Rule = {
      id: Date.now().toString(),
      name: newRule.name || `${TRIGGERS.find((t) => t.value === newRule.trigger)?.label} → ${ACTIONS.find((a) => a.value === newRule.action)?.label}`,
      trigger: newRule.trigger, condition: newRule.condition, action: newRule.action,
      enabled: true, runCount: 0, lastRun: null,
    };
    setRules((prev) => [rule, ...prev]);
    setShowBuilder(false);
    setStep("trigger");
    setNewRule({ trigger: "", condition: "always", action: "", name: "", n8nWebhook: "" });
  };

  const STEPS: Step[] = ["trigger", "condition", "action", "name"];
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
            <Zap size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Automation</h1>
            <p className="text-muted-foreground text-sm">Trigger workflows on platform events</p>
          </div>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors"
        >
          <Plus size={15} /> New Rule
        </button>
      </div>

      {/* Builder */}
      {showBuilder && (
        <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Build a New Rule</h2>
            <button onClick={() => { setShowBuilder(false); setStep("trigger"); }} className="text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  i < stepIdx ? "bg-green-500 text-white" : i === stepIdx ? "bg-gold text-navy-900" : "bg-muted text-muted-foreground"
                )}>
                  {i < stepIdx ? <CheckCircle size={12} /> : i + 1}
                </div>
                <span className={cn("text-xs capitalize", i === stepIdx ? "text-foreground font-medium" : "text-muted-foreground")}>{s}</span>
                {i < STEPS.length - 1 && <ChevronRight size={13} className="text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Step content */}
          {step === "trigger" && (
            <div>
              <p className="text-sm font-medium mb-3">When this happens…</p>
              <div className="grid grid-cols-2 gap-2">
                {TRIGGERS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => { setNewRule((p) => ({ ...p, trigger: t.value })); setStep("condition"); }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:border-gold/30 hover:bg-muted/40",
                        newRule.trigger === t.value ? "border-gold bg-gold/5" : "border-border"
                      )}
                    >
                      <Icon size={15} className={t.color} />
                      <span className="text-sm">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "condition" && (
            <div>
              <p className="text-sm font-medium mb-3">Only if…</p>
              <div className="space-y-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => { setNewRule((p) => ({ ...p, condition: c.value })); setStep("action"); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:border-gold/30",
                      newRule.condition === c.value ? "border-gold bg-gold/5" : "border-border hover:bg-muted/40"
                    )}
                  >
                    {newRule.condition === c.value && <CheckCircle size={14} className="text-gold flex-shrink-0" />}
                    <span className="text-sm">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "action" && (
            <div>
              <p className="text-sm font-medium mb-3">Then do this…</p>
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.value}
                      onClick={() => { setNewRule((p) => ({ ...p, action: a.value })); setStep("name"); }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:border-gold/30 hover:bg-muted/40",
                        newRule.action === a.value ? "border-gold bg-gold/5" : "border-border"
                      )}
                    >
                      <Icon size={15} className={a.color} />
                      <span className="text-sm">{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "name" && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Name your rule</p>
              <input
                value={newRule.name}
                onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))}
                placeholder={`${TRIGGERS.find((t) => t.value === newRule.trigger)?.label} → ${ACTIONS.find((a) => a.value === newRule.action)?.label}`}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
              />

              {/* Summary */}
              <div className="bg-muted/40 rounded-xl p-4 text-sm space-y-2 border border-border">
                {[
                  { label: "When", value: TRIGGERS.find((t) => t.value === newRule.trigger)?.label },
                  { label: "If",   value: CONDITIONS.find((c) => c.value === newRule.condition)?.label },
                  { label: "Then", value: ACTIONS.find((a) => a.value === newRule.action)?.label },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-10 text-xs font-semibold text-muted-foreground">{label}</span>
                    <span className="text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setStep("action")} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
                  Back
                </button>
                <button
                  onClick={saveRule}
                  disabled={!newRule.trigger || !newRule.action}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 disabled:opacity-50 transition-colors"
                >
                  Activate Rule
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rules list */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Zap size={28} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No automation rules yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first rule to automate repetitive workflows.</p>
          </div>
        ) : (
          rules.map((rule) => {
            const trigger = TRIGGERS.find((t) => t.value === rule.trigger);
            const action  = ACTIONS.find((a)  => a.value  === rule.action);
            const TriggerIcon = trigger?.icon ?? Zap;
            const ActionIcon  = action?.icon  ?? Bell;
            return (
              <div key={rule.id} className={cn(
                "bg-card border rounded-2xl p-5 flex items-center gap-4 transition-all",
                rule.enabled ? "border-border hover:border-gold/20" : "border-border opacity-60"
              )}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0", rule.enabled ? "bg-gold/10 border-gold/20" : "bg-muted border-border")}>
                    <TriggerIcon size={16} className={rule.enabled ? "text-gold" : "text-muted-foreground"} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{rule.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{trigger?.label}</span>
                      <ChevronRight size={11} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{action?.label}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                  {rule.runCount > 0 && (
                    <span>{rule.runCount} runs{rule.lastRun ? ` · ${rule.lastRun}` : ""}</span>
                  )}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors text-xs font-medium",
                      rule.enabled
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-600"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {rule.enabled ? <>On</> : <><ToggleLeft size={12} /> Off</>}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="w-7 h-7 rounded-lg border border-border hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* n8n Panel */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => { setShowN8nPanel((p) => !p); if (!showN8nPanel && n8nStatus === "idle") fetchN8nWorkflows(); }}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-center justify-center">
              <Workflow size={16} className="text-orange-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">n8n Workflows</p>
              <p className="text-xs text-muted-foreground">
                {n8nStatus === "connected" ? `${n8nWorkflows.length} workflows synced` : "Connect n8n to trigger external workflows"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {n8nStatus === "connected" && (
              <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-600 text-xs font-medium">
                Connected
              </span>
            )}
            {n8nStatus === "error" && (
              <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 text-xs font-medium">
                Unreachable
              </span>
            )}
            <ChevronRight size={15} className={cn("text-muted-foreground transition-transform", showN8nPanel && "rotate-90")} />
          </div>
        </button>

        {showN8nPanel && (
          <div className="border-t border-border p-5 space-y-4 animate-fade-in">
            {n8nStatus === "loading" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw size={14} className="animate-spin" /> Connecting to n8n…
              </div>
            )}

            {n8nStatus === "error" && (
              <div className="text-sm space-y-3">
                <p className="text-muted-foreground">
                  Could not reach n8n at <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{N8N_URL}</code>.
                  Make sure n8n is running and <code className="text-xs bg-muted px-1.5 py-0.5 rounded">N8N_API_URL</code> / <code className="text-xs bg-muted px-1.5 py-0.5 rounded">N8N_API_KEY</code> are set in your environment.
                </p>
                <button onClick={fetchN8nWorkflows} className="flex items-center gap-1.5 text-xs text-gold hover:underline">
                  <RefreshCw size={12} /> Retry connection
                </button>
              </div>
            )}

            {n8nStatus === "connected" && n8nWorkflows.length === 0 && (
              <p className="text-sm text-muted-foreground">No workflows found in n8n. Create one in your n8n instance first.</p>
            )}

            {n8nStatus === "connected" && n8nWorkflows.length > 0 && (
              <div className="space-y-2 stagger-children">
                {n8nWorkflows.map((wf) => (
                  <div key={wf.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-orange-200 dark:hover:border-orange-800 transition-colors bg-background">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", wf.active ? "bg-green-500" : "bg-gray-400")} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{wf.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {wf.id} · Updated {new Date(wf.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => triggerWorkflow(wf.id, "")}
                      disabled={triggerLoading === wf.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-600 text-xs font-medium hover:bg-orange-100 disabled:opacity-50 transition-colors flex-shrink-0 ml-3"
                    >
                      {triggerLoading === wf.id ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
                      Run
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <button onClick={fetchN8nWorkflows} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw size={11} /> Refresh
              </button>
              <a href={N8N_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink size={11} /> Open n8n
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-muted/30 border border-border rounded-2xl p-4 text-sm text-muted-foreground flex items-start gap-3">
        <Zap size={16} className="text-gold flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground mb-0.5">Automation is event-driven</p>
          Rules execute instantly when their trigger fires. Actions like Slack alerts and emails require the respective integration to be connected in Settings → Integrations. n8n workflows can be triggered as actions or run manually above.
        </div>
      </div>
    </div>
  );
}
