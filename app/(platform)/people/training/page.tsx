import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { GraduationCap, Award, BookOpen, Plus } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Training & Development" };

const SKILL_LEVELS: Record<number, string> = { 1: "Beginner", 2: "Developing", 3: "Proficient", 4: "Advanced", 5: "Expert" };
const SKILL_COLORS = ["", "bg-red-500/30", "bg-amber-500/30", "bg-blue-500/30", "bg-green-500/30", "bg-gold/30"];

const TRAINING_CATALOG = [
  { name: "Audit Methodology Fundamentals", category: "Core", duration: "8h", format: "Online", required: true },
  { name: "Risk Assessment Techniques", category: "Core", duration: "6h", format: "Online", required: true },
  { name: "AICPA Trust Services Criteria", category: "Compliance", duration: "4h", format: "Online", required: false },
  { name: "Financial Statement Analysis", category: "Financial", duration: "8h", format: "Workshop", required: false },
  { name: "IT General Controls Review", category: "IT", duration: "6h", format: "Online", required: false },
  { name: "Interview & Evidence Gathering", category: "Core", duration: "4h", format: "Workshop", required: true },
  { name: "Report Writing Excellence", category: "Core", duration: "3h", format: "Online", required: true },
  { name: "Cybersecurity Fundamentals", category: "IT", duration: "5h", format: "Online", required: false },
];

export default async function TrainingPage() {
  const user = await requireUser();

  const skills = await db.userSkill.findMany({
    where: { user: { orgId: user.orgId } },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: [{ userId: "asc" }, { skill: "asc" }],
  });

  // Group by user
  const byUser: Record<string, { name: string; skills: typeof skills }> = {};
  for (const s of skills) {
    const name = `${s.user.firstName} ${s.user.lastName}`;
    if (!byUser[s.userId]) byUser[s.userId] = { name, skills: [] };
    byUser[s.userId]!.skills.push(s);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Training & Development"
        subtitle="Skills matrix, certification tracking, and learning catalog"
        icon={GraduationCap}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
        breadcrumbs={[{ label: "People", href: "/people" }, { label: "Training" }]}
        actions={
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Log Training
          </button>
        }
      />

      {/* Training Catalog */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <BookOpen size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Training Catalog</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Format</th>
                <th>Required</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {TRAINING_CATALOG.map((course) => (
                <tr key={course.name}>
                  <td className="font-medium text-foreground">{course.name}</td>
                  <td className="text-muted-foreground">{course.category}</td>
                  <td className="text-muted-foreground">{course.duration}</td>
                  <td className="text-muted-foreground">{course.format}</td>
                  <td>
                    {course.required ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">Required</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Optional</span>
                    )}
                  </td>
                  <td>
                    <button className="btn-ghost text-xs">Enroll</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Skills Matrix */}
      {Object.keys(byUser).length > 0 && (
        <div className="section-card">
          <div className="section-card-header flex items-center gap-2">
            <Award size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Skills Matrix</h2>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(byUser).map(([userId, data]) => (
              <div key={userId} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground mb-2">{data.name}</p>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((s) => (
                    <div
                      key={s.id}
                      className={cn("text-xs px-2 py-1 rounded-full font-medium", SKILL_COLORS[s.proficiency] ?? "bg-muted")}
                    >
                      {s.skill}
                      <span className="ml-1 opacity-60">L{s.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 flex items-center gap-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Skill levels:</span>
            {[1, 2, 3, 4, 5].map(l => (
              <span key={l} className={cn("text-xs px-2 py-0.5 rounded-full", SKILL_COLORS[l])}>L{l}: {SKILL_LEVELS[l]}</span>
            ))}
          </div>
        </div>
      )}

      {Object.keys(byUser).length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><Award size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm text-muted-foreground">No skills recorded yet</p>
          <p className="text-xs text-muted-foreground mt-1">Skills are added through the user settings or HR workflows</p>
        </div>
      )}
    </div>
  );
}
