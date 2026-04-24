import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookOpen, Clock, Users, Star, ChevronRight, CheckCircle2, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { NewCourseButton, DeleteCourseButton, CategoryFilter } from "./CoursesActions";

export const metadata: Metadata = { title: "Course Catalog" };

const LEVEL_BADGE: Record<string, string> = {
  BEGINNER:     "bg-green-500/10 text-green-600 border-green-500/20",
  INTERMEDIATE: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ADVANCED:     "bg-orange-500/10 text-orange-600 border-orange-500/20",
  EXPERT:       "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced", EXPERT: "Expert",
};

const CATEGORY_LABEL: Record<string, string> = {
  ONBOARDING: "Onboarding", ANNUAL: "Annual", QUARTERLY: "Quarterly", MANDATORY: "Mandatory",
  COMPLIANCE: "Compliance", LEADERSHIP: "Leadership", DEI: "DEI", WELLBEING: "Wellbeing",
  SKILLS: "Skills", ELECTIVE: "Elective",
};

const CATEGORY_COLOR: Record<string, string> = {
  ONBOARDING: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  ANNUAL:     "bg-amber-500/10 text-amber-600 border-amber-500/20",
  QUARTERLY:  "bg-sky-500/10 text-sky-600 border-sky-500/20",
  MANDATORY:  "bg-red-500/10 text-red-600 border-red-500/20",
  COMPLIANCE: "bg-red-500/10 text-red-600 border-red-500/20",
  LEADERSHIP: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  DEI:        "bg-pink-500/10 text-pink-600 border-pink-500/20",
  WELLBEING:  "bg-green-500/10 text-green-600 border-green-500/20",
  SKILLS:     "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ELECTIVE:   "bg-muted text-muted-foreground border-border",
};

type Props = { searchParams: Promise<{ category?: string }> };

export default async function CoursesPage({ searchParams }: Props) {
  const user = await requireUser();
  const { category } = await searchParams;

  const [courses, totalAssignments] = await Promise.all([
    db.course.findMany({
      where: {
        orgId: user.orgId,
        isActive: true,
        ...(category ? { category: category as "ONBOARDING" | "ANNUAL" | "QUARTERLY" | "MANDATORY" | "COMPLIANCE" | "LEADERSHIP" | "DEI" | "WELLBEING" | "SKILLS" | "ELECTIVE" } : {}),
      },
      include: {
        _count: { select: { assignments: true } },
      },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
    db.courseAssignment.count({ where: { orgId: user.orgId } }),
  ]);

  const completedCount = await db.courseAssignment.count({
    where: { orgId: user.orgId, status: "COMPLETED" },
  });

  const publishedCount = courses.filter((c) => c.isPublished).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Course Catalog"
        subtitle="Professional development and compliance training for your workforce"
        icon={BookOpen}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
        breadcrumbs={[{ label: "Academy", href: "/academy" }, { label: "Courses" }]}
        actions={<NewCourseButton />}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Total Courses",   value: courses.length,    icon: BookOpen,     color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Published",       value: publishedCount,    icon: CheckCircle2, color: "text-green-500",  bg: "bg-green-500/10"  },
          { label: "Enrollments",     value: totalAssignments,  icon: Users,        color: "text-blue-500",   bg: "bg-blue-500/10"   },
          { label: "Completions",     value: completedCount,    icon: Star,         color: "text-gold",       bg: "bg-gold/10"       },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="section-card p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="section-card p-4">
        <CategoryFilter current={category ?? ""} />
      </div>

      {courses.length === 0 ? (
        <div className="section-card">
          <div className="empty-state py-16">
            <div className="empty-state-icon"><BookOpen size={22} className="text-muted-foreground" /></div>
            <p className="font-semibold text-sm">No courses yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {category ? `No courses in the ${CATEGORY_LABEL[category] ?? category} category.` : "Create your first course to start tracking training."}
            </p>
            <NewCourseButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 stagger-children">
          {courses.map((course) => (
            <div key={course.id} className="section-card p-5 hover:shadow-md transition-all group relative">
              {/* Delete button */}
              <div className="absolute top-3 right-3">
                <DeleteCourseButton courseId={course.id} title={course.title} />
              </div>

              <div className="flex items-start gap-3 mb-3 pr-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{course.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", CATEGORY_COLOR[course.category] ?? "bg-muted text-muted-foreground border-border")}>
                      {CATEGORY_LABEL[course.category] ?? course.category}
                    </span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", LEVEL_BADGE[course.level] ?? "")}>
                      {LEVEL_LABEL[course.level] ?? course.level}
                    </span>
                    {!course.isPublished && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">Draft</span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{course.description}</p>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                {course.duration && (
                  <span className="flex items-center gap-1"><Clock size={11} /> {course.duration}</span>
                )}
                <span>{course.modules} module{course.modules !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1"><Users size={11} /> {course._count.assignments} enrolled</span>
                {course.format && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full border border-border">{course.format}</span>}
              </div>

              {course.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {course.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Link href={`/academy/courses/${course.id}`} className="btn-primary text-xs px-3 py-1.5 flex-1 flex items-center justify-center gap-1">
                  Manage <ChevronRight size={12} />
                </Link>
                {course.contentUrl && (
                  <a href={course.contentUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1">
                    <BarChart2 size={12} /> Open
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
