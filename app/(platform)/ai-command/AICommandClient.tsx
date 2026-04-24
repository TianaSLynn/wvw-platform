"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Brain, Send, Mic, MicOff, Sparkles, ClipboardList,
  AlertTriangle, Users, Zap, ChevronRight, StopCircle,
  RefreshCw, Copy, Check,
} from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; id: string }

const QUICK_PROMPTS = [
  { label: "Summarize open findings",    prompt: "Summarize all open audit findings and their risk levels. What needs immediate attention?", icon: AlertTriangle },
  { label: "Generate HR checklist",      prompt: "Generate a comprehensive HR compliance audit checklist for a mid-size consulting firm. Include hiring, performance management, and offboarding.", icon: ClipboardList },
  { label: "Client health overview",     prompt: "Give me an overview of client health metrics and which clients need attention based on overdue invoices or stalled audits.", icon: Users },
  { label: "Risk prioritization",        prompt: "Help me prioritize our current audit findings by risk and business impact. What should be remediated first?", icon: Zap },
  { label: "Audit planning tips",        prompt: "What are best practices for planning a SOC 2 Type II audit? What evidence should I collect upfront?", icon: Brain },
  { label: "Write management response",  prompt: "Help me write a professional management response for a finding about inadequate access control reviews.", icon: Sparkles },
];

interface Props {
  userName: string;
  orgName: string;
  recentAudits: Array<{ id: string; name: string; status: string; type: string }>;
  openFindings: number;
  clientCount: number;
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

export default function AICommandClient({ userName, orgName, recentAudits, openFindings, clientCount }: Props) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [isStreaming, setIsStreaming]  = useState(false);
  const [copiedId, setCopiedId]       = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const dots        = useTypingIndicator(isStreaming);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: content.trim(), id: Date.now().toString() };
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
          context: `Active audits: ${recentAudits.length}, Open findings: ${openFindings}, Clients: ${clientCount}`,
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
            ? { ...m, content: "I encountered an error. Please check your API key configuration and try again." }
            : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    stopStreaming();
    setMessages([]);
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (isListening) {
      setIsListening(false);
      return;
    }
    // @ts-expect-error — browser API
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      setInput(e.results[0]?.[0]?.transcript ?? "");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
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
              Powered by Claude · {openFindings} open findings · {clientCount} clients
            </p>
          </div>
        </div>
        {!isEmpty && (
          <button onClick={clearChat}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs border border-border hover:bg-muted transition-colors text-muted-foreground"
          >
            <RefreshCw size={12} /> New chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1 pb-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            {/* Welcome */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-gold" />
            </div>
            <h2 className="text-xl font-bold mb-1">Good to see you, {userName}</h2>
            <p className="text-muted-foreground text-sm max-w-md mb-8">
              I&apos;m your WVW Intelligence assistant. Ask me anything about audits, findings, compliance, clients, or the platform.
            </p>

            {/* Context cards */}
            <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-lg">
              {[
                { label: "Active audits",  value: recentAudits.length, color: "text-blue-500" },
                { label: "Open findings",  value: openFindings,        color: openFindings > 0 ? "text-amber-500" : "text-green-500" },
                { label: "Clients",        value: clientCount,         color: "text-green-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-card rounded-xl border border-border p-3 shadow-card text-center">
                  <p className={cn("text-2xl font-bold", color)}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Quick prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {QUICK_PROMPTS.map(({ label, prompt, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-gold/30 hover:bg-muted/40 transition-all text-left group"
                >
                  <Icon size={15} className="text-muted-foreground group-hover:text-gold transition-colors flex-shrink-0" />
                  <span className="text-sm text-foreground">{label}</span>
                  <ChevronRight size={13} className="text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
                </button>
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
                    {msg.content || (isStreaming && msg.role === "assistant" ? (
                      <span className="text-muted-foreground italic">Thinking{dots}</span>
                    ) : null)}
                  </div>

                  {/* Copy button */}
                  {msg.role === "assistant" && msg.content && (
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded bg-muted hover:bg-muted/80"
                    >
                      {copiedId === msg.id
                        ? <Check size={11} className="text-green-500" />
                        : <Copy size={11} className="text-muted-foreground" />}
                    </button>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-muted-foreground">U</span>
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
        {/* Recent audits context pills */}
        {recentAudits.length > 0 && isEmpty && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Ask about:</span>
            {recentAudits.slice(0, 3).map((a) => (
              <button
                key={a.id}
                onClick={() => sendMessage(`Tell me about the audit: ${a.name}. What's the current status, key findings, and what needs to happen next?`)}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:border-gold/30 transition-colors"
              >
                {a.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about audits, findings, compliance, or the platform…"
              rows={1}
              disabled={isStreaming}
              style={{ resize: "none" }}
              className="w-full px-4 py-3 pr-12 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground disabled:opacity-50 min-h-[48px] max-h-32 overflow-y-auto"
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
            />
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                "absolute right-3 bottom-3 w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                isListening ? "bg-red-500/20 text-red-500" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          </div>

          {isStreaming ? (
            <button onClick={stopStreaming}
              className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <StopCircle size={18} />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-40 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Enter to send · Shift+Enter for new line · Powered by Claude Opus 4.6
        </p>
      </div>
    </div>
  );
}
