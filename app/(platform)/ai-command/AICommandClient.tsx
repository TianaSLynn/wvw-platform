"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Brain, Send, Mic, MicOff, Sparkles, ClipboardList,
  AlertTriangle, Users, Zap, ChevronRight, StopCircle,
  RefreshCw, Copy, Check, Calendar, Umbrella, GraduationCap,
  Briefcase, Sun, Building2,
} from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; id: string }

interface TodayContext {
  date: string;
  openFindings: number;
  activeAudits: number;
  clientCount: number;
  pendingPto: number;
  activeOnboarding: number;
  openJobs: number;
  invoicesOverdue: number;
  upcomingMeetings: number;
  activeCourses: number;
}

interface Props {
  userName: string;
  orgName: string;
  userRole: string;
  recentAudits: Array<{ id: string; name: string; status: string; type: string }>;
  openFindings: number;
  clientCount: number;
  employees: Array<{ id: string; firstName: string; lastName: string; title: string | null; status: string; department: string | null }>;
  ptoRequests: Array<{ id: string; name: string; type: string; start: string; end: string; days: number }>;
  courses: Array<{ id: string; title: string }>;
  todayContext: TodayContext;
}

function useTypingIndicator(isStreaming: boolean) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => setDots((d) => d.length >= 3 ? "." : d + "."), 400);
    return () => clearInterval(id);
  }, [isStreaming]);
  return dots;
}

function buildTodayBriefingPrompt(ctx: TodayContext, orgName: string): string {
  return `Today is ${ctx.date}. I'm the leader at ${orgName} and I need a complete daily briefing.

Current platform state:
- ${ctx.activeAudits} active audits in progress
- ${ctx.openFindings} open audit findings that need attention
- ${ctx.clientCount} active clients
- ${ctx.pendingPto} PTO requests waiting for approval
- ${ctx.activeOnboarding} employees currently onboarding or offboarding
- ${ctx.openJobs} open job postings
- ${ctx.invoicesOverdue} invoices that are overdue or awaiting payment
- ${ctx.upcomingMeetings} meetings scheduled in the next 7 days
- ${ctx.activeCourses} active academy courses

Please give me:
1. **Priority Actions** — The 3-5 most urgent things I need to handle today
2. **Risk Flags** — Anything that could escalate or slip if not addressed
3. **People Check** — Who needs attention (PTO approvals, onboarding, hiring)
4. **Financial Pulse** — Invoice and revenue status
5. **Quick Wins** — 2-3 things I can resolve quickly today

Be direct and specific. Lead with the most urgent item.`;
}

type QuickPromptItem = { label: string; prompt: string; icon: React.ElementType; highlight?: boolean };
type QuickPromptGroup = { category: string; items: QuickPromptItem[] };

const QUICK_PROMPTS: QuickPromptGroup[] = [
  {
    category: "Today",
    items: [
      { label: "Today's Briefing", prompt: "today-briefing", icon: Sun, highlight: true },
    ],
  },
  {
    category: "Audits & Clients",
    items: [
      { label: "Open findings", prompt: "Summarize all open audit findings and their risk levels. What needs immediate attention and remediation?", icon: AlertTriangle },
      { label: "Active audits status", prompt: "Give me a status update on all active audits. Which are behind schedule or stuck?", icon: ClipboardList },
      { label: "Client health", prompt: "Give me an overview of client health — overdue invoices, stalled audits, and which clients need outreach this week.", icon: Building2 },
    ],
  },
  {
    category: "People & HR",
    items: [
      { label: "PTO requests", prompt: "Summarize pending PTO requests. Who is waiting on approval and are there any conflicts or coverage gaps I should know about?", icon: Umbrella },
      { label: "Employee overview", prompt: "Give me an employee snapshot. Who is onboarding, offboarding, or has been flagged for any HR issues? What do I need to know about my team today?", icon: Users },
      { label: "Hiring status", prompt: "What's the status of our open job postings and hiring pipeline? Which roles are most urgent to fill?", icon: Briefcase },
    ],
  },
  {
    category: "Academy",
    items: [
      { label: "Student progress", prompt: "Give me an overview of academy student progress. Which students are falling behind, who has completed courses, and what credentials have been earned recently?", icon: GraduationCap },
      { label: "Course performance", prompt: "How are our academy courses performing? What's enrollment, completion rates, and are there any courses that need attention?", icon: Sparkles },
    ],
  },
  {
    category: "Operations",
    items: [
      { label: "Upcoming meetings", prompt: "What meetings do I have coming up this week? Help me prepare talking points for the most important ones.", icon: Calendar },
      { label: "Revenue & invoices", prompt: "What's our financial pulse? Which invoices are overdue, what revenue is expected this month, and are there any collection issues?", icon: Zap },
      { label: "Risk prioritization", prompt: "Help me prioritize our current audit findings by risk and business impact. What should be remediated first and what can wait?", icon: AlertTriangle },
    ],
  },
];

export default function AICommandClient({
  userName, orgName, userRole, recentAudits, openFindings, clientCount,
  employees, ptoRequests, courses, todayContext,
}: Props) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [isStreaming, setIsStreaming]  = useState(false);
  const [copiedId, setCopiedId]       = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const dots        = useTypingIndicator(isStreaming);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = () =>
    `User: ${userName} (${userRole}) at ${orgName}. ` +
    `Active audits: ${recentAudits.length}, Open findings: ${openFindings}, Clients: ${clientCount}, ` +
    `Pending PTO requests: ${ptoRequests.length}, Active employees: ${employees.length}, ` +
    `Academy courses: ${courses.length}.` +
    (ptoRequests.length > 0
      ? ` Pending PTO: ${ptoRequests.map((r) => `${r.name} (${r.type}, ${r.days}d, ${r.start}–${r.end})`).join("; ")}.`
      : "") +
    (employees.length > 0
      ? ` Employees: ${employees.slice(0, 8).map((e) => `${e.firstName} ${e.lastName}${e.title ? " (" + e.title + ")" : ""}${e.department ? " - " + e.department : ""}`).join(", ")}.`
      : "");

  const sendMessage = async (content: string) => {
    const actualContent = content === "today-briefing"
      ? buildTodayBriefingPrompt(todayContext, orgName)
      : content;

    if (!actualContent.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: actualContent.trim(), id: Date.now().toString() };
    const assistantMsg: Message = { role: "assistant", content: "", id: (Date.now() + 1).toString() };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context: buildContext(),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as { text: string };
            accumulated += parsed.text;
            setMessages((prev) =>
              prev.map((m) => m.id === assistantMsg.id ? { ...m, content: accumulated } : m)
            );
          } catch { /* ignore malformed chunks */ }
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantMsg.id
            ? { ...m, content: "I encountered an error. Please try again." }
            : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const stopStreaming = () => { abortRef.current?.abort(); setIsStreaming(false); };
  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const clearChat = () => { stopStreaming(); setMessages([]); };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (isListening) { setIsListening(false); return; }
    // @ts-expect-error — browser API
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => { setInput(e.results[0]?.[0]?.transcript ?? ""); setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
            <Brain size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">AI Command Center</h1>
            <p className="text-xs text-muted-foreground">
              Powered by Claude · {openFindings} open findings · {clientCount} clients · {employees.length} employees
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => sendMessage("today-briefing")}
            disabled={isStreaming}
            className="btn-gold text-xs flex items-center gap-1.5"
          >
            <Sun size={13} /> Today&apos;s Briefing
          </button>
          {!isEmpty && (
            <button
              type="button"
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              <RefreshCw size={12} /> New chat
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1 pb-4">
        {isEmpty ? (
          <div className="flex flex-col h-full px-2 pt-2">
            {/* Welcome */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} className="text-gold" />
              </div>
              <h2 className="text-lg font-bold mb-1">Good to see you, {userName}</h2>
              <p className="text-muted-foreground text-sm">
                Ask me anything — or hit <strong className="text-gold">Today&apos;s Briefing</strong> for a full rundown of what needs your attention.
              </p>
            </div>

            {/* Context summary bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
              {[
                { label: "Audits",     value: todayContext.activeAudits,     color: "text-blue-500",   icon: ClipboardList },
                { label: "Findings",   value: todayContext.openFindings,      color: todayContext.openFindings > 0 ? "text-amber-500" : "text-green-500", icon: AlertTriangle },
                { label: "PTO Pending", value: todayContext.pendingPto,        color: todayContext.pendingPto > 0 ? "text-amber-500" : "text-green-500", icon: Umbrella },
                { label: "Onboarding", value: todayContext.activeOnboarding,  color: "text-purple-500", icon: Users },
                { label: "Invoices",   value: todayContext.invoicesOverdue,   color: todayContext.invoicesOverdue > 0 ? "text-red-500" : "text-green-500", icon: Zap },
                { label: "Meetings",   value: todayContext.upcomingMeetings,  color: "text-green-500",  icon: Calendar },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="bg-card rounded-xl border border-border p-3 shadow-card text-center">
                  <Icon size={14} className={cn("mx-auto mb-1", color)} />
                  <p className={cn("text-xl font-bold", color)}>{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Quick prompts by category */}
            <div className="flex-1 space-y-4 overflow-y-auto">
              {QUICK_PROMPTS.map((group) => (
                <div key={group.category}>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(activeCategory === group.category ? null : group.category)}
                    className="flex items-center gap-2 w-full text-left mb-2"
                  >
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {group.category}
                    </span>
                    <ChevronRight size={12} className={cn("text-muted-foreground transition-transform", activeCategory === group.category && "rotate-90")} />
                  </button>
                  {(activeCategory === group.category || group.category === "Today") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.items.map(({ label, prompt, icon: Icon, highlight }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => sendMessage(prompt)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:border-gold/30 hover:bg-muted/40 transition-all text-left group",
                            highlight ? "border-gold/30 bg-gold/5 hover:bg-gold/10" : "border-border"
                          )}
                        >
                          <Icon size={15} className={cn("flex-shrink-0 transition-colors", highlight ? "text-gold" : "text-muted-foreground group-hover:text-gold")} />
                          <span className={cn("text-sm font-medium", highlight ? "text-gold" : "text-foreground")}>{label}</span>
                          <ChevronRight size={13} className="text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 px-1">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-navy-900 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain size={14} className="text-gold" />
                  </div>
                )}
                <div className={cn("max-w-[80%] relative group", msg.role === "user" ? "order-1" : "")}>
                  <div className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-navy-900 text-white rounded-tr-sm"
                      : "bg-card border border-border text-foreground rounded-tl-sm"
                  )}>
                    {msg.content || (isStreaming && msg.role === "assistant"
                      ? <span className="text-muted-foreground italic">Thinking{dots}</span>
                      : null)}
                  </div>
                  {msg.role === "assistant" && msg.content && (
                    <button
                      type="button"
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded bg-muted hover:bg-muted/80"
                      aria-label="Copy message"
                    >
                      {copiedId === msg.id
                        ? <Check size={11} className="text-green-500" />
                        : <Copy size={11} className="text-muted-foreground" />}
                    </button>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-muted-foreground">{userName[0]}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 pt-3 border-t border-border">
        {recentAudits.length > 0 && isEmpty && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Audits:</span>
            {recentAudits.slice(0, 3).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => sendMessage(`Tell me about the audit: ${a.name}. What's the current status, key findings, and what needs to happen next?`)}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:border-gold/30 transition-colors"
              >
                {a.name}
              </button>
            ))}
            {ptoRequests.length > 0 && (
              <button
                type="button"
                onClick={() => sendMessage(`I have ${ptoRequests.length} pending PTO requests: ${ptoRequests.map((r) => `${r.name} (${r.days}d, ${r.start})`).join(", ")}. Help me review and decide which to approve.`)}
                className="text-xs px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10 transition-colors"
              >
                {ptoRequests.length} PTO pending
              </button>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about audits, employees, PTO, students, invoices…"
              rows={1}
              disabled={isStreaming}
              className="w-full px-4 py-3 pr-12 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground disabled:opacity-50 min-h-[48px] max-h-32 overflow-y-auto resize-none"
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
            />
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              className={cn(
                "absolute right-3 bottom-3 w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                isListening ? "bg-red-500/20 text-red-500" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          </div>

          {isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              aria-label="Stop generating"
              className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <StopCircle size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              aria-label="Send message"
              className="w-10 h-10 rounded-xl bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-40 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Enter to send · Shift+Enter for new line · Powered by Claude Sonnet 4.6
        </p>
      </div>
    </div>
  );
}
