import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Gift, Heart, Shield, DollarSign, Plane, GraduationCap, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Benefits & Wellness" };

const BENEFIT_CATEGORIES = [
  {
    category: "Health & Wellbeing",
    icon: Heart,
    color: "text-red-500",
    bg: "bg-red-500/10",
    benefits: [
      { name: "Medical Insurance",    detail: "100% premium covered — employee, 50% family",             status: "Active" },
      { name: "Dental & Vision",      detail: "Full dental & vision coverage included",                  status: "Active" },
      { name: "Mental Health (EAP)",  detail: "6 free counselling sessions per year, confidential",      status: "Active" },
      { name: "Wellness Stipend",     detail: "$600/year for fitness, apps, or wellness activities",      status: "Available" },
    ],
  },
  {
    category: "Financial Benefits",
    icon: DollarSign,
    color: "text-green-500",
    bg: "bg-green-500/10",
    benefits: [
      { name: "401(k) Plan",          detail: "4% company match, immediate vesting",                     status: "Active" },
      { name: "Profit Sharing",       detail: "Annual profit-sharing distribution for all staff",        status: "Active" },
      { name: "Performance Bonuses",  detail: "Quarterly and annual performance bonuses",                status: "Active" },
      { name: "Referral Bonus",       detail: "$2,500 for successful employee referrals",                status: "Available" },
    ],
  },
  {
    category: "Time Off & Flexibility",
    icon: Plane,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    benefits: [
      { name: "PTO",                  detail: "15 days PTO, increasing to 20 after 3 years",             status: "Active" },
      { name: "Mental Health Days",   detail: "3 designated mental health days per year",                status: "Active" },
      { name: "Flexible Hours",       detail: "Core hours 10am–3pm, flex around it",                    status: "Active" },
      { name: "Remote Work",          detail: "2 days/week remote for all roles",                        status: "Active" },
    ],
  },
  {
    category: "Learning & Growth",
    icon: GraduationCap,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    benefits: [
      { name: "Education Stipend",    detail: "$1,500/year for courses, books, and training",            status: "Available" },
      { name: "Certification Support",detail: "Full reimbursement for approved certifications",         status: "Available" },
      { name: "Conference Budget",    detail: "$1,000/year for industry conferences",                   status: "Available" },
      { name: "Internal Training",   detail: "Weekly lunch-and-learns and skill workshops",             status: "Active" },
    ],
  },
  {
    category: "Protection & Security",
    icon: Shield,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    benefits: [
      { name: "Life Insurance",       detail: "2x annual salary coverage provided",                     status: "Active" },
      { name: "Disability Insurance", detail: "Short and long-term disability coverage",                status: "Active" },
      { name: "Legal Services",       detail: "Basic legal services through EAP",                       status: "Active" },
    ],
  },
];

const STATUS_STYLES: Record<string, string> = {
  Active:       "bg-green-500/10 text-green-500",
  Available:    "bg-blue-500/10 text-blue-500",
  "Coming Soon":"bg-muted text-muted-foreground",
};

export default async function BenefitsPage() {
  await requireUser();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Benefits & Wellness"
        subtitle="Your complete benefits package — health, financial, growth, and more"
        icon={Gift}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
      />

      <div className="space-y-6 stagger-children">
        {BENEFIT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.category} className="section-card">
              <div className="section-card-header flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={cat.color} />
                </div>
                <h2 className="text-sm font-semibold text-foreground">{cat.category}</h2>
              </div>
              <div className="divide-y divide-border">
                {cat.benefits.map((b) => (
                  <div key={b.name} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.detail}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[b.status] ?? "bg-muted text-muted-foreground"}`}>
                      {b.status}
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
