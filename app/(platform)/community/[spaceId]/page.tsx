"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle, ArrowLeft, Pin, Send, ThumbsUp, Heart, Lightbulb, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Author = { id: string; firstName: string; lastName: string; avatarUrl: string | null };
type Post = {
  id: string;
  title: string | null;
  body: string;
  isPinned: boolean;
  isAnnouncement: boolean;
  createdAt: string;
  author: Author | null;
  _count: { comments: number; reactions: number };
};
type Space = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  _count: { posts: number };
};

const REACTION_EMOJIS = ["👍", "❤️", "💡", "🙏"];

export default function CommunitySpacePage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params.spaceId;

  const [posts, setPosts] = useState<Post[]>([]);
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [spaceRes, postsRes] = await Promise.all([
        fetch(`/api/community`),
        fetch(`/api/community/${spaceId}/posts`),
      ]);
      const spaceData = await spaceRes.json() as { data: Space[] };
      const postsData = await postsRes.json() as { data: Post[] };
      setSpace(spaceData.data.find((s) => s.id === spaceId) ?? null);
      setPosts(postsData.data);
      setLoading(false);
    };
    load();
  }, [spaceId]);

  const submit = async () => {
    if (!newBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/${spaceId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle || undefined, body: newBody }),
      });
      const { data } = await res.json() as { data: Post };
      setPosts((prev) => [data, ...prev]);
      setNewBody(""); setNewTitle(""); setComposing(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <Link href="/community" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Community
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{space?.name ?? "Space"}</h1>
            {space?.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{space.description}</p>
            )}
          </div>
          <button
            onClick={() => setComposing(true)}
            className="btn-primary flex items-center gap-1.5 text-xs flex-shrink-0"
          >
            <Send size={12} /> New Post
          </button>
        </div>
      </div>

      {/* Compose */}
      {composing && (
        <div className="section-card p-5 animate-fade-in">
          <h3 className="text-sm font-semibold mb-4">New Post</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title (optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="input-base w-full"
            />
            <textarea
              placeholder="What would you like to share or discuss?"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={5}
              className="input-base w-full resize-none"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => setComposing(false)} className="btn-ghost text-sm">Cancel</button>
            <button
              onClick={submit}
              disabled={!newBody.trim() || submitting}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="section-card">
          <div className="empty-state py-12">
            <div className="empty-state-icon"><MessageCircle size={22} className="text-muted-foreground" /></div>
            <p className="text-sm font-medium">No posts yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Be the first to start a discussion in this space.</p>
            <button onClick={() => setComposing(true)} className="btn-gold text-xs px-4 py-1.5">
              Write First Post
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className={cn(
                "section-card p-5 hover:shadow-md transition-all",
                post.isPinned && "border-gold/40 bg-gold/5",
                post.isAnnouncement && "border-blue-400/40 bg-blue-500/5"
              )}
            >
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2">
                {post.isPinned && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                    <Pin size={9} /> Pinned
                  </span>
                )}
                {post.isAnnouncement && (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    Announcement
                  </span>
                )}
              </div>

              {/* Author */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-navy-900/10 flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                  {post.author ? `${post.author.firstName[0]}${post.author.lastName[0]}` : "?"}
                </div>
                <div>
                  <span className="text-xs font-medium text-foreground">
                    {post.author ? `${post.author.firstName} ${post.author.lastName}` : "Anonymous"}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Content */}
              {post.title && (
                <h3 className="text-sm font-semibold text-foreground mb-1">{post.title}</h3>
              )}
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.body}</p>

              {/* Footer */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/60">
                <div className="flex items-center gap-3">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className="text-base hover:scale-125 transition-transform leading-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{post._count.reactions} reactions</span>
                  <span>{post._count.comments} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
