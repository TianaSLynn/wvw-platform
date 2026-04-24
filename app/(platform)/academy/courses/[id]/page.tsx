import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookOpen, Users, Clock, CheckCircle2, BarChart2, ExternalLink, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssignEmployeesButton, UpdateStatusButton } from "./CourseDetailActions";

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

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = await db.course.findFirst({ where: { id }, select: { title: true } });
  return { title: course?.title ?? "Course" };
}

export default async function CourseDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const [course, employees] = await Promise.all([
    db.course.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        assignments: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, title: true, department: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { assignments: true } },
      },
    }),
    db.employee.findMany({
      where: { orgId: user.orgId, employmentStatus: { not: "TERMINATED" } },
      select: { id: true, firstName: true, lastName: true, title: true, department: true },
      orderBy: [{ lastName: "asc" }],
    }),
  ]);

  if (!course) notFound();

  const completedCount = course.assignments.filter((a) => a.status === "COMPLETED").length;
  const inProgressCount = course.assignments.filter((a) => a.status === "IN_PROGRESS").length;
  const avgScore = course.assignments.filter((a) => a.score != null).reduce((sum, a, _, arr) => sum + (a.score ?? 0) / arr.length, 0);
  const passRate = completedCount > 0
    ? Math.round((course.assignments.filter((a) => a.passed === true).length / completedCount) * 100)
    : null;

  const assignedIds = new Set(course.assignments.map((a) => a.employeeId));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={course.title}
        subtitle={CATEGORY_LABEL[course.category] ?? course.category}
        icon={BookOpen}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
        breadcrumbs={[{ label: "Academy", href: "/academy" }, { label: "Courses", href: "/academy/courses" }, { label: course.title }]}
        actions={
          <div className="flex items-center gap-2">
            {course.contentUrl && (
              <a href={course.contentUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost flex items-center gap-2 text-sm">
                <ExternalLink size={14} /> Open Content
              </a>
            )}
            <AssignEmployeesButton courseId={course.id} employees={employees} assignedIds={assignedIds} />
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
            {[
              { label: "Enrolled",    value: course._count.assignments, icon: Users,       color: "text-blue-500",   bg: "bg-blue-500/10"  },
              { label: "In Progress", value: inProgressCount,           icon: Clock,       color: "text-amber-500",  bg: "bg-amber-500/10" },
              { label: "Completed",   value: completedCount,            icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "Avg Score",   value: avgScore > 0 ? `${avgScore.toFixed(0)}%` : "—", icon: BarChart2, color: "text-gold", bg: "bg-gold/10" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="section-card p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                  <Icon size={16} className={color} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Assignments table */}
          <div className="section-card">
            <div className="section-card-header flex items-center justify-between">
              <h2 className="font-semibold text-sm">Enrolled Employees</h2>
              <span className="text-xs text-muted-foreground">{course._count.assignments} total</span>
            </div>
            {course.assignments.length === 0 ? (
              <div className="empty-state py-10">
                <div className="empty-state-icon"><Users size={20} className="text-muted-foreground" /></div>
                <p className="text-sm font-medium">No employees enrolled</p>
                <p className="text-xs text-muted-foreground mt-1">Assign this course to employees to start tracking progress.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th className="hidden sm:table-cell">Title / Dept</th>
                      <th>Status</th>
                      <th className="hidden md:table-cell">Score</th>
                      <th className="hidden md:table-cell">Due Date</th>
                      <th className="hidden lg:table-cell">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.assignments.map((a) => (
                      <tr key={a.id} className="group">
                        <td>
                          <p className="font-medium text-sm text-foreground">{a.employee.firstName} {a.employee.lastName}</p>
                        </td>
                        <td className="hidden sm:table-cell text-xs text-muted-foreground">
                          <span className="block">{a.employee.title ?? "—"}</span>
                          {a.employee.department && <span className="text-[10px] opacity-70">{a.employee.department}</span>}
                        </td>
                        <td>
                          <UpdateStatusButton
                            assignmentId={a.id}
                            courseId={course.id}
                            currentStatus={a.status}
                          />
                        </td>
                        <td className="hidden md:table-cell text-xs text-muted-foreground">
                          {a.score != null ? (
                            <span className={cn(a.passed ? "text-green-600" : "text-red-500")}>
                              {a.score.toFixed(0)}%{a.passed != null && (a.passed ? " ✓" : " ✗")}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="hidden md:table-cell text-xs text-muted-foreground">
                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="hidden lg:table-cell text-xs text-muted-foreground">
                          {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="section-card p-5 space-y-4">
            <h3 className="text-sm font-semibold">Course Details</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{CATEGORY_LABEL[course.category] ?? course.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Level</span>
                <span className={cn("px-2 py-0.5 rounded-full border text-[10px]", LEVEL_BADGE[course.level] ?? "")}>
                  {LEVEL_LABEL[course.level] ?? course.level}
                </span>
              </div>
              {course.duration && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{course.duration}</span>
                </div>
              )}
              {course.format && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">{course.format}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Modules</span>
                <span className="font-medium">{course.modules}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Passing Score</span>
                <span className="font-medium">{course.passingScore}%</span>
              </div>
              {passRate != null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pass Rate</span>
                  <span className={cn("font-medium", passRate >= 70 ? "text-green-600" : "text-red-500")}>{passRate}%</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", course.isPublished ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-muted text-muted-foreground border-border")}>
                  {course.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              {course.audience && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Audience</span>
                  <span className="font-medium">{course.audience}</span>
                </div>
              )}
            </div>

            {course.tags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Tag size={11} /> Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {course.tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {course.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-xs text-foreground leading-relaxed">{course.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
