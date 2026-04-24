import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Users, MessageCircle, Hash } from "lucide-react";

export default async function CohortsPage() {
  const user = await requireUser();

  const spaces = await db.communitySpace.findMany({
    where: { orgId: user.orgId, type: "COHORT" },
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link href="/community" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Community
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Users size={18} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Cohorts</h1>
            <p className="text-xs text-muted-foreground">Group spaces for programs, cohorts, and teams</p>
          </div>
        </div>
      </div>

      {spaces.length === 0 ? (
        <div className="section-card">
          <div className="empty-state py-14">
            <div className="empty-state-icon"><Users size={22} className="text-muted-foreground" /></div>
            <p className="text-sm font-medium">No cohort spaces yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Create a cohort space to group participants in programs or training groups.</p>
            <Link href="/community/new" className="btn-gold text-xs px-4 py-1.5">Create Cohort Space</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {spaces.map((space) => (
            <Link key={space.id} href={`/community/${space.id}`} className="section-card p-5 hover:shadow-md transition-all block">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Hash size={14} className="text-purple-500" />
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
      )}
    </div>
  );
}
