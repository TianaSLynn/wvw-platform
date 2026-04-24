import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Clock, Plus, UserPlus, CheckCircle2, ArrowRight, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Client Waitlist" };

const PRIORITY_STYLES: Record<string, string> = {
  HIGH:   "bg-red-500/10 text-red-500 border-red-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  LOW:    "bg-green-500/10 text-green-500 border-green-500/20",
};

function getPriority(prob: number): "HIGH" | "MEDIUM" | "LOW" {
  if (prob >= 70) return "HIGH";
  if (prob >= 40) return "MEDIUM";
  return "LOW";
}

export default async function WaitlistPage() {
  const user = await requireUser();

  const waitlist = await db.opportunity.findMany({
    where: {
      orgId: user.orgId,
      stage: { in: ["PROSPECT", "QUALIFIED"] },
    },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ probability: "desc" }, { createdAt: "asc" }],
  });

  const totalValue = waitlist.reduce((s, o) => s + (o.value ?? 0), 0);
  const highPriority = waitlist.filter((o) => getPriority(o.probability) === "HIGH").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Client Waitlist"
        subtitle="Prospective clients waiting for capacity — manage your pipeline"
        icon={Clock}
        iconBg="bg-amber-500/10 border-amber-500/20"
        iconColor="text-amber-500"
        actions={
          <Link href="/pipeline" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} />
            Add to Pipeline
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "On Waitlist",    val: waitlist.length,                       icon: Clock,        color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
          { label: "High Priority",  val: highPriority,                          icon: UserPlus,     color: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/20" },
          { label: "Pipeline Value", val: `$${Math.round(totalValue / 1000)}k`,  icon: DollarSign,   color: "text-gold",       bg: "bg-gold/10",       border: "border-gold/20" },
          { label: "Qualified",      val: waitlist.filter((o) => o.stage === "QUALIFIED").length, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
        ].map(({ label, val, icon: Icon, color, bg, border }) => (
          <div key={label} className="section-card p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", bg, border)}>
              <Icon size={16} className={color} />
            </div>
            <div><p className="text-lg font-bold">{val}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Waitlist */}
      {waitlist.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Clock size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium">No prospects on the waitlist</p>
          <p className="text-xs text-muted-foreground mt-1">Add opportunities to the pipeline — PROSPECT and QUALIFIED stage appear here</p>
          <Link href="/pipeline" className="btn-primary mt-4 text-sm px-4 py-2 flex items-center gap-1.5 mx-auto w-fit">
            <Plus size={14} /> Open Pipeline
          </Link>
        </div>
      ) : (
        <div className="section-card overflow-hidden">
          <div className="section-card-header flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Waitlisted Prospects</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{waitlist.length}</span>
          </div>
          <div className="divide-y divide-border">
            {waitlist.map((opp) => {
              const priority = getPriority(opp.probability);
              return (
                <div key={opp.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">{opp.name}</p>
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", PRIORITY_STYLES[priority])}>
                        {priority}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize">
                        {opp.stage.toLowerCase().replace("_"," ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {opp.client && <span>{opp.client.name}</span>}
                      {opp.source && <span>· {opp.source}</span>}
                      {opp.closeDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={9} />
                          {new Date(opp.closeDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    {opp.value && <p className="text-sm font-semibold text-gold">${opp.value.toLocaleString()}</p>}
                    <p className="text-[10px] text-muted-foreground">{opp.probability}% probability</p>
                  </div>
                  {opp.owner && (
                    <div className="w-7 h-7 rounded-full bg-navy-900/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold">
                        {opp.owner.firstName[0]}{opp.owner.lastName[0]}
                      </span>
                    </div>
                  )}
                  <Link href="/pipeline" className="btn-ghost text-xs px-2 py-1 flex items-center gap-1 whitespace-nowrap">
                    View <ArrowRight size={10} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="section-card p-5 bg-amber-500/5 border-amber-500/20 flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Clock size={14} className="text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold mb-1">About the Waitlist</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The waitlist shows all opportunities in <strong>Prospect</strong> and <strong>Qualified</strong> stages from the pipeline.
            To add a new prospective client, open the <Link href="/pipeline" className="text-gold underline underline-offset-2">Pipeline</Link> and create an opportunity.
          </p>
        </div>
      </div>
    </div>
  );
}
