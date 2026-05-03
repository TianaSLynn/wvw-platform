"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { Users, Search, ChevronLeft, Star, BadgeCheck, Mail, Phone, Pencil } from "lucide-react";
import Link from "next/link";

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN:  "bg-red-50 text-red-600 border-red-200",
  ADMIN:        "bg-orange-50 text-orange-600 border-orange-200",
  PARTNER:      "bg-gold/10 text-amber-700 border-gold/30",
  MANAGER:      "bg-blue-50 text-blue-600 border-blue-200",
  AUDITOR:      "bg-purple-50 text-purple-600 border-purple-200",
  CONSULTANT:   "bg-gray-50 text-gray-600 border-gray-200",
  CLIENT_ADMIN: "bg-teal-50 text-teal-600 border-teal-200",
  CLIENT_USER:  "bg-gray-50 text-gray-500 border-gray-200",
};

const PROF_LABEL = ["", "Beginner", "Basic", "Proficient", "Advanced", "Expert"];

interface Skill { skill: string; proficiency: number; category: string | null; isVerified: boolean }
interface Member {
  id: string; firstName: string; lastName: string; email: string; phone: string | null;
  title: string | null; role: string; department: string | null; bio: string | null;
  avatarUrl: string | null; billableRate: number | null; targetUtilization: number;
  status: string; createdAt: Date;
  skills: Skill[];
  _count: { auditAssignments: number; timeEntries: number };
}

interface Props { members: Member[]; currentUserId: string; currentUserRole: string }

export default function StaffDirectory({ members, currentUserId, currentUserRole }: Props) {
  const canEditAll = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dept, setDept]     = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const departments = ["ALL", ...Array.from(new Set(members.map((m) => m.department ?? "General"))).sort()];

  const filtered = useMemo(() =>
    members.filter((m) => {
      if (dept !== "ALL" && (m.department ?? "General") !== dept) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
          (m.title ?? "").toLowerCase().includes(q) ||
          (m.department ?? "").toLowerCase().includes(q) ||
          m.skills.some((s) => s.skill.toLowerCase().includes(q))
        );
      }
      return true;
    }),
  [members, dept, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
              <Users size={18} className="text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Staff Directory</h1>
              <p className="text-xs text-muted-foreground">{members.length} team members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill, or title…"
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-colors",
                dept === d ? "bg-navy-900 text-white border-navy-700" : "border-border text-muted-foreground hover:border-gold/30"
              )}
            >
              {d === "ALL" ? "All Departments" : d}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((m) => {
          const isMe = m.id === currentUserId;
          const isOpen = expanded === m.id;
          return (
            <div
              key={m.id}
              className={cn("bg-card border rounded-2xl p-5 transition-all cursor-pointer", isMe ? "border-gold/20" : "border-border hover:border-gold/20")}
              onClick={() => setExpanded(isOpen ? null : m.id)}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-navy-900 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gold">{m.firstName[0]}{m.lastName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{m.firstName} {m.lastName} {isMe && <span className="text-gold text-xs">(you)</span>}</p>
                    <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium border", ROLE_BADGE[m.role] ?? "border-border text-muted-foreground")}>
                      {m.role.replace(/_/g, " ")}
                    </span>
                  </div>
                  {m.title && <p className="text-xs text-muted-foreground">{m.title}</p>}
                  {m.department && <p className="text-xs text-muted-foreground">{m.department}</p>}
                </div>
              </div>

              {/* Stats strip */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{m._count.auditAssignments} audits</span>
                <span>{m._count.timeEntries} time entries</span>
                {m.billableRate && <span>{formatCurrency(m.billableRate)}/hr</span>}
                <span className="ml-auto">{Math.round(m.targetUtilization * 100)}% target</span>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-border space-y-4" onClick={(e) => e.stopPropagation()}>
                  {m.bio && <p className="text-xs text-muted-foreground">{m.bio}</p>}

                  <div className="flex flex-wrap gap-3 text-xs">
                    <a href={`mailto:${m.email}`} className="flex items-center gap-1 text-gold hover:underline">
                      <Mail size={11} /> {m.email}
                    </a>
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-gold hover:underline">
                        <Phone size={11} /> {m.phone}
                      </a>
                    )}
                  </div>

                  {m.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.skills.map((s) => (
                          <span
                            key={s.skill}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
                              s.proficiency >= 4 ? "bg-gold/10 border-gold/30 text-amber-700" : "bg-muted border-border text-muted-foreground"
                            )}
                          >
                            {s.isVerified && <BadgeCheck size={10} className="text-gold" />}
                            {s.skill}
                            {s.proficiency >= 4 && <Star size={9} className="text-gold" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(m.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                    {(canEditAll || isMe) && (
                      <Link
                        href={`/people/staff/${m.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-gold/30 transition-colors"
                      >
                        <Pencil size={11} /> Edit
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
