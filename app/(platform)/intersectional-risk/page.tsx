import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Network, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Intersectional Risk" };

const RISK_DOMAINS = [
  { domain: "Technology", risks: ["Cybersecurity breach", "System outages", "Data loss", "AI model failure"], color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { domain: "Financial", risks: ["Revenue concentration", "Cash flow constraints", "Currency exposure", "Credit risk"], color: "bg-green-500/10 text-green-500 border-green-500/20" },
  { domain: "Regulatory", risks: ["Privacy law changes", "Compliance failures", "Reporting requirements", "Audit findings"], color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { domain: "Operational", risks: ["Key person dependency", "Process failures", "Supply chain", "Vendor reliability"], color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { domain: "Reputational", risks: ["Client dissatisfaction", "Data breach publicity", "Staff misconduct", "Social media"], color: "bg-red-500/10 text-red-500 border-red-500/20" },
  { domain: "People", risks: ["Talent attrition", "Burnout", "Skills gaps", "Culture degradation"], color: "bg-sage/20 text-sage border-sage/30" },
];

const INTERSECTIONS = [
  { risk1: "Cybersecurity breach", risk2: "Regulatory compliance", domain1: "Technology", domain2: "Regulatory", severity: "CRITICAL", description: "A breach triggers mandatory regulatory notifications, fines, and audit findings simultaneously", compoundEffect: "3.2×" },
  { risk1: "Key person dependency", risk2: "Revenue concentration", domain1: "Operational", domain2: "Financial", severity: "HIGH", description: "Loss of key relationship manager could trigger client departure from a concentrated revenue source", compoundEffect: "2.1×" },
  { risk1: "Burnout", risk2: "Audit quality", domain1: "People", domain2: "Operational", severity: "HIGH", description: "Staff burnout increases error rates and finding misclassification risk during fieldwork", compoundEffect: "1.8×" },
  { risk1: "Data breach publicity", risk2: "Client retention", domain1: "Reputational", domain2: "Financial", severity: "MEDIUM", description: "Public breach event could trigger accelerated client attrition beyond the immediate impact", compoundEffect: "2.4×" },
];

const SEV_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-500 border-red-500/20",
  HIGH: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  MEDIUM: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default async function IntersectionalRiskPage() {
  const user = await requireUser();

  const [openFindings] = await Promise.all([
    db.auditFinding.count({
      where: { audit: { orgId: user.orgId }, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Intersectional Risk"
        subtitle="Cross-domain risk visualization — where risks compound to create greater exposure"
        icon={Network}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
      />

      {/* Risk domains */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Risk Domains</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 stagger-children">
          {RISK_DOMAINS.map((d) => (
            <div key={d.domain} className={cn("section-card p-4 border-2", d.color.split(" ").slice(0, 1).join(" ").replace("bg-", "border-").replace("/10", "/30"), "bg-background")}>
              <p className={cn("text-sm font-bold mb-2", d.color.split(" ").find(c => c.startsWith("text-")))}>{d.domain}</p>
              <div className="space-y-1">
                {d.risks.map((r) => (
                  <p key={r} className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                    {r}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Intersections */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <Network size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">High-Impact Risk Intersections</h2>
        </div>
        <div className="divide-y divide-border">
          {INTERSECTIONS.map((ix, i) => (
            <div key={i} className="px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">{ix.domain1}</span>
                  <Network size={12} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">{ix.domain2}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">
                      {ix.risk1} × {ix.risk2}
                    </p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-md border font-medium flex-shrink-0", SEV_STYLES[ix.severity])}>
                      {ix.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{ix.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp size={12} className="text-red-500" />
                    <span className="text-red-500 font-semibold">Compound multiplier: {ix.compoundEffect}</span>
                    <span className="text-muted-foreground">— Combined impact greater than individual risks</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {openFindings > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold text-amber-500">{openFindings} open audit findings</span> may contribute to intersectional risk exposure
          </p>
          <a href="/recommendations" className="ml-auto text-xs text-amber-500 hover:underline">Review Findings →</a>
        </div>
      )}
    </div>
  );
}
