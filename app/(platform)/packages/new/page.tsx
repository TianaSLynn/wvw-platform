import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PackageBuilder from "./PackageBuilder";

export const metadata: Metadata = { title: "Build Package" };

export default async function NewPackagePage() {
  const user = await requireUser();

  // Only admins can build packages
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/packages");
  }

  const [templates, courses] = await Promise.all([
    db.auditTemplate.findMany({
      where: {
        OR: [{ orgId: user.orgId, isPublished: true }, { isGlobal: true, isPublished: true }],
      },
      select: { id: true, name: true, type: true, isGlobal: true },
      orderBy: [{ isGlobal: "asc" }, { name: "asc" }],
    }),
    db.course.findMany({
      where: { orgId: user.orgId, isActive: true },
      select: { id: true, title: true, category: true, duration: true, level: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Build a Package</h1>
        <p className="page-subtitle mt-0.5">Bundle an audit, training courses, and a Notion tracker into a licensable product</p>
      </div>
      <PackageBuilder templates={templates} courses={courses} />
    </div>
  );
}
