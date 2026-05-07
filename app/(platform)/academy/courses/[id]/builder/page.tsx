import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import CourseBuilder from "./CourseBuilder";

export const metadata: Metadata = { title: "Course Builder" };

export default async function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const user   = await requireUser();
  const { id } = await params;

  if (!["SUPER_ADMIN", "ADMIN", "PARTNER", "MANAGER"].includes(user.role)) redirect("/academy/courses");

  const course = await db.course.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      courseModules: {
        include: { questions: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!course) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Course Builder</p>
        <h1 className="text-xl font-bold">{course.title}</h1>
      </div>
      <CourseBuilder course={course} />
    </div>
  );
}
