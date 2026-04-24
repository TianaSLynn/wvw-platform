"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft, Megaphone, Plus, Pin, Cake, TrendingUp, Briefcase,
  XCircle, UserPlus, UserMinus, Star, Award, CalendarDays,
  MessageSquare, Heart, ThumbsUp, Lightbulb, ChevronDown, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AnnouncementType =
  | "BIRTHDAY" | "PROMOTION" | "JOB_OPENING" | "JOB_CLOSING"
  | "ONBOARDING" | "OFFBOARDING" | "KUDOS" | "MILESTONE" | "EVENT" | "GENERAL";

interface Post {
  id: string;
  title: string | null;
  body: string;
  isPinned: boolean;
  isAnnouncement: boolean;
  announcementType: AnnouncementType | null;
  subjectName: string | null;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  space: { id: string; name: string };
  _count: { comments: number; reactions: number };
}

// ─── Type config ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AnnouncementType, {
  label: string;
  icon: React.ElementType;
  emoji: string;
  color: string;
  bg: string;
  border: string;
}> = {
  BIRTHDAY:    { label: "Birthday",      icon: Cake,         emoji: "🎂", color: "text-pink-500",    bg: "bg-pink-500/8",    border: "border-pink-400/25" },
  PROMOTION:   { label: "Promotion",     icon: TrendingUp,   emoji: "🚀", color: "text-emerald-500", bg: "bg-emerald-500/8", border: "border-emerald-400/25" },
  JOB_OPENING: { label: "Now Hiring",    icon: Briefcase,    emoji: "💼", color: "text-blue-500",    bg: "bg-blue-500/8",    border: "border-blue-400/25" },
  JOB_CLOSING: { label: "Role Closed",   icon: XCircle,      emoji: "✅", color: "text-slate-500",   bg: "bg-slate-500/8",   border: "border-slate-400/25" },
  ONBOARDING:  { label: "Welcome",       icon: UserPlus,     emoji: "👋", color: "text-gold",        bg: "bg-gold/8",        border: "border-gold/25" },
  OFFBOARDING: { label: "Farewell",      icon: UserMinus,    emoji: "👏", color: "text-purple-500",  bg: "bg-purple-500/8",  border: "border-purple-400/25" },
  KUDOS:       { label: "Kudos",         icon: Star,         emoji: "⭐", color: "text-amber-500",   bg: "bg-amber-500/8",   border: "border-amber-400/25" },
  MILESTONE:   { label: "Milestone",     icon: Award,        emoji: "🏆", color: "text-orange-500",  bg: "bg-orange-500/8",  border: "border-orange-400/25" },
  EVENT:       { label: "Event",         icon: CalendarDays, emoji: "📅", color: "text-indigo-500",  bg: "bg-indigo-500/8",  border: "border-indigo-400/25" },
  GENERAL:     { label: "Announcement",  icon: Megaphone,    emoji: "📢", color: "text-blue-500",    bg: "bg-blue-500/8",    border: "border-blue-400/25" },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG) as AnnouncementType[];

// ─── Quick-compose templates ──────────────────────────────────────────────────

const QUICK_TEMPLATES: Array<{
  type: AnnouncementType;
  label: string;
  titleFn: (name: string) => string;
  bodyFn: (name: string, extra: string) => string;
  namePlaceholder: string;
  extraLabel: string;
  extraPlaceholder: string;
}> = [
  {
    type: "BIRTHDAY",
    label: "Birthday",
    titleFn: (n) => `Happy Birthday, ${n}! 🎂`,
    bodyFn:  (n) => `Please join us in wishing ${n} a very happy birthday! 🎉🎈`,
    namePlaceholder: "Team member's name",
    extraLabel: "",
    extraPlaceholder: "",
  },
  {
    type: "PROMOTION",
    label: "Promotion",
    titleFn: (n) => `Congratulations, ${n}! 🚀`,
    bodyFn:  (n, role) => `We're thrilled to announce that ${n} has been promoted${role ? ` to ${role}` : ""}! Please join us in congratulating them on this well-deserved achievement. 🎉`,
    namePlaceholder: "Team member's name",
    extraLabel: "New title / role",
    extraPlaceholder: "e.g. Senior Consultant",
  },
  {
    type: "KUDOS",
    label: "Kudos",
    titleFn: (n) => `Shoutout to ${n}! ⭐`,
    bodyFn:  (n, reason) => `Big kudos to ${n}${reason ? ` for ${reason}` : ""}! Your hard work and dedication don't go unnoticed. Thank you! 🙌`,
    namePlaceholder: "Team member's name",
    extraLabel: "What did they do?",
    extraPlaceholder: "e.g. going above and beyond on the Q3 audit",
  },
  {
    type: "ONBOARDING",
    label: "Welcome",
    titleFn: (n) => `Welcome to the team, ${n}! 👋`,
    bodyFn:  (n, role) => `Please join us in welcoming ${n}${role ? `, our new ${role}` : ""}, to the WVW family! We're so excited to have you. 🎉`,
    namePlaceholder: "New hire's name",
    extraLabel: "Their role / title",
    extraPlaceholder: "e.g. Marketing Intern",
  },
  {
    type: "OFFBOARDING",
    label: "Farewell",
    titleFn: (n) => `Farewell, ${n} — thank you! 👏`,
    bodyFn:  (n, role) => `Today we say farewell to ${n}${role ? `, our ${role}` : ""}. Thank you for your incredible contributions to our team. Wishing you all the best in your next adventure! 💫`,
    namePlaceholder: "Team member's name",
    extraLabel: "Their role / title",
    extraPlaceholder: "e.g. Senior Consultant",
  },
  {
    type: "MILESTONE",
    label: "Milestone",
    titleFn: (n) => `Celebrating ${n}! 🏆`,
    bodyFn:  (n, milestone) => `🎉 Congratulations to ${n}${milestone ? ` on ${milestone}` : " on this milestone"}! This is a huge achievement and we are so proud. Keep up the amazing work!`,
    namePlaceholder: "Team member's name",
    extraLabel: "Milestone achieved",
    extraPlaceholder: "e.g. 5 years with WVW, first certification, etc.",
  },
  {
    type: "EVENT",
    label: "Event",
    titleFn: (n) => n,
    bodyFn:  (_, details) => details || "Stay tuned for more details!",
    namePlaceholder: "Event name",
    extraLabel: "Details / description",
    extraPlaceholder: "Date, time, location, and what to expect…",
  },
  {
    type: "GENERAL",
    label: "General",
    titleFn: (n) => n,
    bodyFn:  (_, body) => body,
    namePlaceholder: "Announcement title",
    extraLabel: "Message",
    extraPlaceholder: "Write your announcement…",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [posts, setPosts]         = useState<Post[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterType, setFilter]   = useState<AnnouncementType | "ALL">("ALL");
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [template, setTemplate]   = useState<typeof QUICK_TEMPLATES[number]>(QUICK_TEMPLATES[0]!);
  const [name, setName]           = useState("");
  const [extra, setExtra]         = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody]   = useState("");
  const [isPinned, setIsPinned]   = useState(false);
  const [saving, startSave]       = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load(type?: AnnouncementType | "ALL") {
    setLoading(true);
    const url = `/api/announcements${type && type !== "ALL" ? `?type=${type}` : ""}`;
    const res = await fetch(url);
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openModal(tmpl = QUICK_TEMPLATES[0]!) {
    setTemplate(tmpl);
    setName("");
    setExtra("");
    setCustomTitle("");
    setCustomBody("");
    setIsPinned(false);
    setShowModal(true);
  }

  // Live preview title and body based on template
  const previewTitle = template.type === "GENERAL" || template.type === "EVENT"
    ? customTitle || template.titleFn("…")
    : name ? template.titleFn(name) : template.titleFn("…");

  const previewBody = template.type === "GENERAL"
    ? customBody || "Your message will appear here."
    : name ? template.bodyFn(name, extra) : template.bodyFn("…", extra);

  function handlePost() {
    startSave(async () => {
      const title = template.type === "GENERAL" || template.type === "EVENT" ? customTitle : template.titleFn(name);
      const body  = template.type === "GENERAL" ? customBody : template.bodyFn(name, extra);

      if (!title || !body) return;

      const res = await fetch("/api/announcements", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          announcementType: template.type,
          title,
          body,
          subjectName: (template.type !== "GENERAL" && template.type !== "EVENT") ? name : undefined,
          isPinned,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        load();
      }
    });
  }

  const filtered = posts.filter((p) => {
    const matchType   = filterType === "ALL" || p.announcementType === filterType;
    const matchSearch = search === "" ||
      (p.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.body.toLowerCase().includes(search.toLowerCase()) ||
      (p.subjectName ?? "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const counts = ALL_TYPES.reduce((acc, t) => {
    acc[t] = posts.filter((p) => p.announcementType === t).length;
    return acc;
  }, {} as Record<AnnouncementType, number>);

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/community" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Community
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
              <Megaphone size={18} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Announcements</h1>
              <p className="text-xs text-muted-foreground">Birthdays · Promotions · Kudos · Updates · More</p>
            </div>
          </div>
          <button type="button" onClick={() => openModal()} className="btn-gold flex items-center gap-2 text-sm px-4 py-2 flex-shrink-0">
            <Plus size={14} /> Post
          </button>
        </div>
      </div>

      {/* Quick-compose strip */}
      <div className="flex flex-wrap gap-2">
        {QUICK_TEMPLATES.map((tmpl) => {
          const cfg = TYPE_CONFIG[tmpl.type];
          return (
            <button
              key={tmpl.type}
              type="button"
              onClick={() => openModal(tmpl)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all hover:scale-105",
                cfg.bg, cfg.border, cfg.color
              )}
            >
              <span>{cfg.emoji}</span> {tmpl.label}
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="input-base pl-9 w-full text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilter(e.target.value as AnnouncementType | "ALL")}
            className="input-base text-sm pr-8 appearance-none cursor-pointer"
          >
            <option value="ALL">All types ({posts.length})</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_CONFIG[t].emoji} {TYPE_CONFIG[t].label} ({counts[t]})</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="section-card p-14 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state py-16">
          <div className="empty-state-icon"><Megaphone size={22} className="text-muted-foreground" /></div>
          <p className="text-sm font-medium">No announcements yet</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first — celebrate a birthday, give kudos, or share an update.</p>
          <button type="button" onClick={() => openModal()} className="btn-gold text-sm mt-4 px-5 py-2">
            Post First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const aType = post.announcementType ?? "GENERAL";
            const cfg   = TYPE_CONFIG[aType];
            const Icon  = cfg.icon;
            const isExpanded = expandedId === post.id;

            return (
              <div
                key={post.id}
                className={cn(
                  "section-card overflow-hidden border transition-shadow hover:shadow-md",
                  cfg.border, cfg.bg
                )}
              >
                <div className="p-5">
                  {/* Type + pin badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn("flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border", cfg.bg, cfg.border, cfg.color)}>
                      <Icon size={10} /> {cfg.emoji} {cfg.label}
                    </span>
                    {post.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">
                        <Pin size={9} /> Pinned
                      </span>
                    )}
                    {post.subjectName && (
                      <span className="text-[10px] text-muted-foreground ml-auto">{post.subjectName}</span>
                    )}
                  </div>

                  {/* Title */}
                  {post.title && (
                    <h3 className="font-semibold text-sm mb-2">{post.title}</h3>
                  )}

                  {/* Body — truncate long posts */}
                  <div>
                    <p className={cn("text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap", !isExpanded && "line-clamp-3")}>
                      {post.body}
                    </p>
                    {post.body.length > 200 && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : post.id)}
                        className={cn("text-xs font-medium mt-1", cfg.color)}
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                    {post.author && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-navy-900/10 border border-border flex items-center justify-center">
                          <span className="text-[9px] font-bold text-gold">
                            {post.author.firstName[0]}{post.author.lastName[0]}
                          </span>
                        </div>
                        <span>{post.author.firstName} {post.author.lastName}</span>
                      </div>
                    )}
                    <span>·</span>
                    <span>{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <div className="ml-auto flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={10} /> {post._count.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={10} /> {post._count.reactions}
                      </span>
                      <Link href={`/community/${post.space.id}`} className={cn("hover:underline", cfg.color)}>
                        View thread →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold text-base">Post Announcement</h2>
            </div>
            <div className="p-5 space-y-5">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-medium mb-2">Type</label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEMPLATES.map((tmpl) => {
                    const cfg = TYPE_CONFIG[tmpl.type];
                    return (
                      <button
                        key={tmpl.type}
                        type="button"
                        onClick={() => {
                          setTemplate(tmpl);
                          setName("");
                          setExtra("");
                          setCustomTitle("");
                          setCustomBody("");
                        }}
                        className={cn(
                          "text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                          template.type === tmpl.type
                            ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-1 ring-current`
                            : "bg-muted border-border text-muted-foreground hover:border-foreground/20"
                        )}
                      >
                        {cfg.emoji} {tmpl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fields */}
              {template.type !== "GENERAL" && (
                <div>
                  <label className="block text-xs font-medium mb-1.5">{template.namePlaceholder}</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={template.namePlaceholder}
                    className="input-base w-full text-sm"
                  />
                </div>
              )}

              {template.type === "GENERAL" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Title</label>
                    <input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Announcement title"
                      className="input-base w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Message</label>
                    <textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      rows={4}
                      placeholder="Write your announcement…"
                      className="input-base w-full text-sm resize-none"
                    />
                  </div>
                </>
              ) : template.extraLabel ? (
                <div>
                  <label className="block text-xs font-medium mb-1.5">{template.extraLabel}</label>
                  {template.type === "EVENT" ? (
                    <textarea
                      value={extra}
                      onChange={(e) => setExtra(e.target.value)}
                      rows={3}
                      placeholder={template.extraPlaceholder}
                      className="input-base w-full text-sm resize-none"
                    />
                  ) : (
                    <input
                      value={extra}
                      onChange={(e) => setExtra(e.target.value)}
                      placeholder={template.extraPlaceholder}
                      className="input-base w-full text-sm"
                    />
                  )}
                </div>
              ) : null}

              {/* Add a personal note for non-general types */}
              {template.type !== "GENERAL" && template.type !== "EVENT" && (
                <div>
                  <label className="block text-xs font-medium mb-1.5">Add a personal note <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    value={extra.startsWith("_note:") ? extra.slice(6) : ""}
                    onChange={(e) => setExtra("_note:" + e.target.value)}
                    rows={2}
                    placeholder="Add something personal to the announcement…"
                    className="input-base w-full text-sm resize-none"
                  />
                </div>
              )}

              {/* Preview */}
              {(template.type === "GENERAL" ? customTitle : name) && (
                <div className={cn("rounded-xl p-4 border", TYPE_CONFIG[template.type].bg, TYPE_CONFIG[template.type].border)}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
                  <p className="text-sm font-semibold mb-1">{previewTitle}</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{previewBody}</p>
                </div>
              )}

              {/* Pin option */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 accent-gold" />
                <span className="text-sm">Pin to top of announcements</span>
              </label>
            </div>

            <div className="p-5 border-t border-border flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
              <button
                type="button"
                onClick={handlePost}
                disabled={saving || (template.type === "GENERAL" ? !customTitle || !customBody : !name)}
                className={cn(
                  "text-sm px-6 py-2 rounded-xl font-semibold transition-colors disabled:opacity-50",
                  TYPE_CONFIG[template.type].bg, TYPE_CONFIG[template.type].border,
                  TYPE_CONFIG[template.type].color, "border hover:brightness-110"
                )}
              >
                {saving ? "Posting…" : `Post ${TYPE_CONFIG[template.type].emoji}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
