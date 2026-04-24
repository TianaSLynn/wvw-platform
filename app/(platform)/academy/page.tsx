import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { GraduationCap, Users, BookOpen, Award, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "WVW Academy" };

const ACADEMY_LINKS = [
  { href: "/academy/students", label: "Students", desc: "Enrolled practitioners and learners", icon: Users },
  { href: "/academy/courses", label: "Courses", desc: "Curriculum and learning modules", icon: BookOpen },
  { href: "/academy/cohorts", label: "Cohorts", desc: "Group learning programs", icon: Users },
  { href: "/academy/practicum", label: "Practicum", desc: "Live audit shadowing experience", icon: GraduationCap },
  { href: "/academy/credentials", label: "Credentials", desc: "Certifications and achievements", icon: Award },
];

const FEATURED_COURSES = [
  { name: "Audit Fundamentals Bootcamp", duration: "4 weeks", students: 24, level: "Beginner", emoji: "📚" },
  { name: "Advanced Risk Assessment", duration: "3 weeks", students: 12, level: "Advanced", emoji: "⚡" },
  { name: "SOC 2 Examiner Certification", duration: "6 weeks", students: 8, level: "Expert", emoji: "🏆" },
  { name: "IT Audit Techniques", duration: "3 weeks", students: 15, level: "Intermediate", emoji: "💻" },
];

export default async function AcademyPage() {
  const user = await requireUser();

  const [studentCount, skillCount] = await Promise.all([
    db.user.count({ where: { orgId: user.orgId, role: { in: ["CLIENT_USER", "AUDITOR"] } } }),
    db.userSkill.count({ where: { user: { orgId: user.orgId } } }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="WVW Academy"
        subtitle="Professional development, certification programs, and practitioner training"
        icon={GraduationCap}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{studentCount}</p>
          <p className="text-xs text-muted-foreground">Students</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{FEATURED_COURSES.length}</p>
          <p className="text-xs text-muted-foreground">Active Courses</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{skillCount}</p>
          <p className="text-xs text-muted-foreground">Skills Tracked</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-gold">3</p>
          <p className="text-xs text-muted-foreground">Certifications</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACADEMY_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="section-card p-4 flex items-center gap-3 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.desc}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          );
        })}
      </div>

      {/* Featured Courses */}
      <div className="section-card">
        <div className="section-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Featured Courses</h2>
          </div>
          <Link href="/academy/courses" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        <div className="divide-y divide-border">
          {FEATURED_COURSES.map((course) => (
            <div key={course.name} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl">{course.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{course.name}</p>
                <p className="text-xs text-muted-foreground">{course.duration} · {course.students} enrolled · {course.level}</p>
              </div>
              <button className="btn-ghost text-xs">Enroll</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
