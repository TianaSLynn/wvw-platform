"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Plus, Search, Send, X, Users, Check, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

type Participant = { id: string; firstName: string; lastName: string; avatarUrl: string | null };

type Thread = {
  id: string;
  title: string | null;
  isGroup: boolean;
  participantIds: string[];
  participants: Participant[];
  lastMessage: { body: string; sender: { firstName: string; lastName: string } } | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type Message = {
  id: string;
  body: string;
  senderId: string;
  readBy: string[];
  createdAt: string;
  sender: Participant;
};

interface Props {
  initialThreads: Thread[];
  orgUsers: Participant[];
  currentUserId: string;
  currentUserName: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function threadDisplayName(thread: Thread, currentUserId: string): string {
  if (thread.title) return thread.title;
  const others = thread.participants.filter(p => p.id !== currentUserId);
  if (others.length === 0) return "Just you";
  const first = others[0];
  if (!first) return "Unknown";
  if (others.length === 1) return `${first.firstName} ${first.lastName}`;
  return `${first.firstName} +${others.length - 1}`;
}

function Avatar({ user, size = 8 }: { user: { firstName: string; lastName: string; avatarUrl?: string | null }; size?: number }) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`;
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={initials} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`w-${size} h-${size} rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0`}>
      <span className="text-[10px] font-bold text-blue-500">{initials}</span>
    </div>
  );
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── New Thread Modal ───────────────────────────────────────────────────────── */

function NewThreadModal({
  orgUsers,
  currentUserId,
  onClose,
  onCreate,
}: {
  orgUsers: Participant[];
  currentUserId: string;
  onClose: () => void;
  onCreate: (thread: Thread) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = orgUsers.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  async function handleCreate() {
    if (selected.length === 0) { setError("Select at least one person"); return; }
    if (selected.length > 1 && !groupTitle.trim()) { setError("Group conversations need a title"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantIds: selected,
          title:          selected.length > 1 ? groupTitle : undefined,
          isGroup:        selected.length > 1,
          firstMessage:   firstMessage.trim() || undefined,
        }),
      });
      const json = await res.json() as { data?: Thread; error?: string };
      if (!res.ok) { setError(json.error ?? "Failed to create thread"); return; }
      onCreate(json.data!);
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold">New Conversation</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-base w-full pl-8"
              placeholder="Search team members…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* People list */}
          <div className="border border-border rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-border">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No users found</p>
            ) : filtered.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left",
                  selected.includes(u.id) && "bg-blue-500/5"
                )}
              >
                <Avatar user={u} size={7} />
                <span className="flex-1 text-sm text-foreground">{u.firstName} {u.lastName}</span>
                {selected.includes(u.id) && <Check size={14} className="text-blue-500 flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Group title (if multiple selected) */}
          {selected.length > 1 && (
            <input
              className="input-base w-full"
              placeholder="Group name (required)"
              value={groupTitle}
              onChange={e => setGroupTitle(e.target.value)}
            />
          )}

          {/* Optional first message */}
          <textarea
            className="input-base w-full resize-none"
            rows={2}
            placeholder="Start with a message (optional)…"
            value={firstMessage}
            onChange={e => setFirstMessage(e.target.value)}
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm">Cancel</button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading || selected.length === 0}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
              {selected.length > 1 ? "Create Group" : "Start Chat"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Message View ───────────────────────────────────────────────────────────── */

function MessageView({
  thread,
  currentUserId,
  onNewMessage,
}: {
  thread: Thread;
  currentUserId: string;
  onNewMessage: (threadId: string, msg: Message) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/threads/${thread.id}`);
      const json = await res.json() as { data?: { messages: Message[] } };
      setMessages(json.data?.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, [thread.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage() {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/messages/threads/${thread.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = await res.json() as { data?: Message };
      if (res.ok && json.data) {
        setMessages(prev => [...prev, json.data!]);
        onNewMessage(thread.id, json.data!);
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const displayName = threadDisplayName(thread, currentUserId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        {thread.isGroup ? (
          <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <Users size={14} className="text-gold" />
          </div>
        ) : (() => {
          const p = thread.participants.find(p => p.id !== currentUserId) ?? thread.participants[0];
          return p ? <Avatar user={p} size={8} /> : null;
        })()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
          <p className="text-[10px] text-muted-foreground">
            {thread.participants.length} participant{thread.participants.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <MessageSquare size={28} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground">Send the first message below</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.senderId === currentUserId;
            const showSender = !isOwn && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
            const isRead = msg.readBy.length > 1;

            return (
              <div key={msg.id} className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}>
                {!isOwn && (
                  <div className="flex-shrink-0 mt-auto">
                    {showSender || i === messages.length - 1
                      ? <Avatar user={msg.sender} size={7} />
                      : <div className="w-7" />
                    }
                  </div>
                )}
                <div className={cn("max-w-[70%] space-y-1", isOwn ? "items-end" : "items-start", "flex flex-col")}>
                  {showSender && !isOwn && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {msg.sender.firstName} {msg.sender.lastName}
                    </span>
                  )}
                  <div className={cn(
                    "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    isOwn
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}>
                    {msg.body}
                  </div>
                  <div className={cn("flex items-center gap-1", isOwn ? "justify-end" : "justify-start")}>
                    <span className="text-[9px] text-muted-foreground">{timeAgo(msg.createdAt)}</span>
                    {isOwn && (
                      isRead
                        ? <CheckCheck size={10} className="text-blue-400" />
                        : <Check size={10} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-border">
        <div className="flex items-end gap-2 bg-muted/50 rounded-xl border border-border px-3 py-2">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[20px] max-h-[120px]"
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              input.trim() && !sending
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */

export function MessagingClient({ initialThreads, orgUsers, currentUserId }: Props) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreads[0]?.id ?? null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [search, setSearch] = useState("");

  const activeThread = threads.find(t => t.id === activeThreadId) ?? null;

  const filteredThreads = threads.filter(t => {
    if (!search) return true;
    const name = threadDisplayName(t, currentUserId).toLowerCase();
    const last = t.lastMessage?.body.toLowerCase() ?? "";
    return name.includes(search.toLowerCase()) || last.includes(search.toLowerCase());
  });

  function handleThreadCreated(thread: Thread) {
    setThreads(prev => [thread, ...prev.filter(t => t.id !== thread.id)]);
    setActiveThreadId(thread.id);
  }

  function handleNewMessage(threadId: string, msg: Message) {
    setThreads(prev => prev.map(t => {
      if (t.id !== threadId) return t;
      return {
        ...t,
        lastMessage:  { body: msg.body, sender: msg.sender },
        lastMessageAt: msg.createdAt,
        unreadCount:  0,
      };
    }).sort((a, b) =>
      (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0) -
      (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0)
    ));
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-fade-in">
      {/* Thread list */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Messages</h2>
          <button
            type="button"
            onClick={() => setShowNewThread(true)}
            className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"
            aria-label="New conversation"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-base w-full pl-7 text-xs h-8"
              placeholder="Search conversations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <MessageSquare size={24} className="text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground text-center px-4">
                {search ? "No conversations match your search" : "No conversations yet"}
              </p>
              {!search && (
                <button type="button" onClick={() => setShowNewThread(true)} className="btn-ghost text-xs mt-1">
                  Start one
                </button>
              )}
            </div>
          ) : (
            filteredThreads.map(thread => {
              const name = threadDisplayName(thread, currentUserId);
              const other = thread.participants.find(p => p.id !== currentUserId) ?? thread.participants[0];
              const isActive = thread.id === activeThreadId;

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setActiveThreadId(thread.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50",
                    isActive && "bg-blue-500/5 border-l-2 border-l-blue-500"
                  )}
                >
                  {thread.isGroup ? (
                    <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users size={14} className="text-gold" />
                    </div>
                  ) : other ? (
                    <Avatar user={other} size={9} />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn("text-xs font-medium truncate", isActive ? "text-blue-600" : "text-foreground")}>
                        {name}
                      </p>
                      <span className="text-[9px] text-muted-foreground flex-shrink-0">
                        {timeAgo(thread.lastMessageAt)}
                      </span>
                    </div>
                    {thread.lastMessage ? (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {thread.lastMessage.sender.firstName}: {thread.lastMessage.body}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5 italic">No messages yet</p>
                    )}
                  </div>
                  {thread.unreadCount > 0 && (
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold mt-0.5">
                      {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message view */}
      <div className="flex-1 min-w-0">
        {activeThread ? (
          <MessageView
            key={activeThread.id}
            thread={activeThread}
            currentUserId={currentUserId}
            onNewMessage={handleNewMessage}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <MessageSquare size={40} className="text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Select a conversation</p>
            <button type="button" onClick={() => setShowNewThread(true)} className="btn-primary text-sm flex items-center gap-2">
              <Plus size={14} /> New Conversation
            </button>
          </div>
        )}
      </div>

      {showNewThread && (
        <NewThreadModal
          orgUsers={orgUsers}
          currentUserId={currentUserId}
          onClose={() => setShowNewThread(false)}
          onCreate={handleThreadCreated}
        />
      )}
    </div>
  );
}
