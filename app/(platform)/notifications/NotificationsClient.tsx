"use client";

import { useState } from "react";
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, Zap, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string; type: string; title: string; message: string | null;
  actionUrl: string | null; actionLabel: string | null;
  isRead: boolean; readAt: Date | null; createdAt: Date;
  entityType: string | null; entityId: string | null;
}

const TYPE_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  INFO:    Info,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle,
  ACTION:  Zap,
  REPORT:  FileText,
};

const TYPE_COLOR: Record<string, string> = {
  INFO:    "text-blue-500",
  WARNING: "text-amber-500",
  SUCCESS: "text-green-500",
  ACTION:  "text-gold",
  REPORT:  "text-purple-500",
};

interface Props { notifications: Notification[] }

export default function NotificationsClient({ notifications: initial }: Props) {
  const [items, setItems] = useState(initial);

  const unread = items.filter((n) => !n.isRead);

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
  };

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true, readAt: new Date() } : n));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  };

  const dismiss = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
  };

  const formatTime = (d: Date) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
            <Bell size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-xs text-muted-foreground">{unread.length} unread</p>
          </div>
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-xs">
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      {items.length === 0 ? (
        <div className="section-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Bell size={24} className="text-muted-foreground" />
            </div>
            <p className="font-semibold">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No notifications to show.</p>
          </div>
        </div>
      ) : (
        <div className="section-card">
          {items.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Info;
            const iconColor = TYPE_COLOR[n.type] ?? "text-muted-foreground";
            return (
              <div
                key={n.id}
                className={cn(
                  "group flex items-start gap-3 px-5 py-4 border-b border-border/40 last:border-0 transition-colors",
                  !n.isRead ? "bg-gold/[0.04]" : "hover:bg-muted/20",
                )}
              >
                {/* Unread indicator */}
                <div className={cn("w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0", !n.isRead ? "bg-gold animate-pulse-gold" : "bg-transparent")} />

                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border", !n.isRead ? "bg-card border-border" : "bg-muted border-transparent")}>
                  <Icon size={14} className={iconColor} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium leading-snug", !n.isRead ? "text-foreground" : "text-foreground/80")}>
                      {n.title}
                    </p>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0 mt-0.5">{formatTime(n.createdAt)}</span>
                  </div>
                  {n.message && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    {n.actionUrl && n.actionLabel && (
                      <a
                        href={n.actionUrl}
                        onClick={() => { if (!n.isRead) void markRead(n.id); }}
                        className="text-xs text-gold font-medium animated-underline"
                      >
                        {n.actionLabel} →
                      </a>
                    )}
                    {!n.isRead && (
                      <button onClick={() => void markRead(n.id)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => void dismiss(n.id)}
                  className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Dismiss"
                >
                  <Trash2 size={12} className="text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
