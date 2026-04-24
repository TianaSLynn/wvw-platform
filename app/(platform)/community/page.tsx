import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { MessageCircle, Users, Hash, FolderOpen, Lock, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Community" };

const SPACE_TYPE_CONFIG: Record<string, { icon: typeof MessageCircle; color: string; bg: string }> = {
  GENERAL:        { icon: MessageCircle, color: "text-blue-500",   bg: "bg-blue-500/10"   },
  COHORT:         { icon: Users,         color: "text-purple-500", bg: "bg-purple-500/10" },
  IMPLEMENTATION: { icon: Hash,          color: "text-gold",       bg: "bg-gold/10"       },
  ANNOUNCEMENT:   { icon: Hash,          color: "text-red-500",    bg: "bg-red-500/10"    },
  RESOURCE:       { icon: FolderOpen,    color: "text-green-500",  bg: "bg-green-500/10"  },
  ACADEMY:        { icon: Hash,          color: "text-amber-500",  bg: "bg-amber-500/10"  },
};

export default async function CommunityPage() {
  const user = await requireUser();

  const spaces = await db.communitySpace.findMany({
    where: { orgId: user.orgId, isArchived: false },
    include: {
      _count: { select: { posts: true } },
      posts: {
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, author: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  const pinned = spaces.filter((s) => s.isPinned);
  const regular = spaces.filter((s) => !s.isPinned);

  const totalPosts = spaces.reduce((s, sp) => s + sp._count.posts, 0);
  const totalSpaces = spaces.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Community"
        subtitle="Structured spaces for discussion, resources, and cohort collaboration"
        icon={MessageCircle}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10 border-blue-500/20"
        actions={
          <Link
            href="/community/new"
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} /> New Space
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger-children">
        {[
          { label: "Spaces", value: totalSpaces, icon: MessageCircle },
          { label: "Total Posts", value: totalPosts, icon: Hash },
          { label: "Pinned", value: pinned.length, icon: Hash },
        ].map((s) => (
          <div key={s.label} className="section-card p-4 flex items-center gap-3">
            <s.icon size={16} className="text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pinned spaces */}
      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pinned</p>
          <SpaceGrid spaces={pinned} />
        </div>
      )}

      {/* All spaces */}
      <div>
        {pinned.length > 0 && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">All Spaces</p>
        )}
        {regular.length === 0 && spaces.length === 0 ? (
          <div className="section-card">
            <div className="empty-state py-16">
              <div className="empty-state-icon">
                <MessageCircle size={22} className="text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm">No community spaces yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Create a space to host structured discussions, share resources, or run cohort programs.
              </p>
              <Link href="/community/new" className="btn-gold text-xs px-4 py-1.5">
                Create First Space
              </Link>
            </div>
          </div>
        ) : (
          <SpaceGrid spaces={regular} />
        )}
      </div>
    </div>
  );
}

type SpaceItem = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  slug: string;
  isPrivate: boolean;
  isPinned: boolean;
  iconEmoji: string | null;
  _count: { posts: number };
  posts: Array<{ createdAt: Date; author: { firstName: string; lastName: string } | null }>;
};

function SpaceGrid({ spaces }: { spaces: SpaceItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
      {spaces.map((space) => {
        const cfg = SPACE_TYPE_CONFIG[space.type] ?? SPACE_TYPE_CONFIG.GENERAL!;
        const Icon = cfg.icon;
        const lastPost = space.posts[0];
        return (
          <Link
            key={space.id}
            href={`/community/${space.id}`}
            className="section-card p-5 hover:border-gold/30 transition-all group block"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
                {space.iconEmoji ? (
                  <span className="text-lg">{space.iconEmoji}</span>
                ) : (
                  <Icon size={18} className={cfg.color} />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {space.isPrivate && <Lock size={11} className="text-muted-foreground" />}
                <span className={cn(
                  "text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full",
                  cfg.bg, cfg.color
                )}>
                  {space.type.replace("_", " ")}
                </span>
              </div>
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-gold transition-colors">{space.name}</h3>
            {space.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{space.description}</p>
            )}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{space._count.posts} post{space._count.posts !== 1 ? "s" : ""}</span>
              {lastPost ? (
                <span>Last: {formatDate(lastPost.createdAt)}</span>
              ) : (
                <span>No posts yet</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gold opacity-0 group-hover:opacity-100 transition-opacity">
              View space <ArrowRight size={12} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
