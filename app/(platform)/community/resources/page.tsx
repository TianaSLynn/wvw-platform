import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, BookOpen, MessageCircle, Hash } from "lucide-react";

export default async function ResourcesPage() {
  const user = await requireUser();

  const spaces = await db.communitySpace.findMany({
    where: { orgId: user.orgId, type: "RESOURCE" },
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { name: "asc" },
  });

  // Also pull pinned posts from all spaces as "featured resources"
  const featuredPosts = await db.communityPost.findMany({
    where: {
      space: { orgId: user.orgId },
      isPinned: true,
    },
    include: {
      space: { select: { id: true, name: true } },
      author: { select: { firstName: true, lastName: true } },
      _count: { select: { comments: true, reactions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/community" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Community
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage/20 flex items-center justify-center">
            <BookOpen size={18} className="text-sage" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Resources</h1>
            <p className="text-xs text-muted-foreground">Shared guides, toolkits, and reference materials</p>
          </div>
        </div>
      </div>

      {spaces.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resource Libraries</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spaces.map((space) => (
              <Link key={space.id} href={`/community/${space.id}`} className="section-card p-5 hover:shadow-md transition-all block">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sage/20 flex items-center justify-center flex-shrink-0">
                    <Hash size={14} className="text-sage" />
                  </div>
                  <h3 className="text-sm font-semibold">{space.name}</h3>
                </div>
                {space.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{space.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageCircle size={11} />
                  <span>{space._count.posts} posts</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {featuredPosts.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pinned Resources</h2>
          <div className="space-y-3">
            {featuredPosts.map((post) => (
              <Link key={post.id} href={`/community/${post.space.id}`} className="section-card p-4 hover:shadow-md transition-all block">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {post.title && <h3 className="text-sm font-semibold truncate">{post.title}</h3>}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{post.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">{post.space.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                  <span>{post.author ? `${post.author.firstName} ${post.author.lastName}` : "Anonymous"}</span>
                  <span>·</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {spaces.length === 0 && featuredPosts.length === 0 && (
        <div className="section-card">
          <div className="empty-state py-14">
            <div className="empty-state-icon"><BookOpen size={22} className="text-muted-foreground" /></div>
            <p className="text-sm font-medium">No resources yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Create a resources space or pin posts to highlight important content.</p>
            <Link href="/community/new" className="btn-gold text-xs px-4 py-1.5">Create Resource Space</Link>
          </div>
        </div>
      )}
    </div>
  );
}
