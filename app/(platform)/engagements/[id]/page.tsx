import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import EngagementDetail from "./EngagementDetail";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await db.project.findUnique({ where: { id }, select: { name: true } });
  return { title: p?.name ?? "Engagement" };
}

export default async function EngagementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const project = await db.project.findFirst({
    where: { id, orgId: user.orgId, deletedAt: null },
    include: {
      client: { select: { id: true, name: true, logoUrl: true } },
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, title: true, avatarUrl: true } } },
      },
      tasks: {
        where: { parentId: null },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          subtasks:  { select: { id: true, title: true, status: true } },
          _count:    { select: { timeEntries: true } },
        },
        orderBy: [{ status: "asc" }, { priority: "asc" }, { position: "asc" }],
      },
      milestones: { orderBy: { dueDate: "asc" } },
      _count: { select: { tasks: true, timeEntries: true, documents: true } },
    },
  });

  if (!project) notFound();

  const tasksByStatus = {
    BACKLOG:    project.tasks.filter((t) => t.status === "BACKLOG"),
    TODO:       project.tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS:project.tasks.filter((t) => t.status === "IN_PROGRESS"),
    IN_REVIEW:  project.tasks.filter((t) => t.status === "IN_REVIEW"),
    DONE:       project.tasks.filter((t) => t.status === "DONE"),
  };

  return <EngagementDetail project={project as never} tasksByStatus={tasksByStatus as never} currentUserId={user.id} />;
}
