import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subvalue?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  accentColor?: string;
  className?: string;
  loading?: boolean;
  href?: string;
}

// Derive accent colors from the iconColor prop
function getAccentFromColor(iconColor?: string) {
  if (!iconColor) return { accent: "from-gold/20 to-gold/5", dot: "bg-gold", glow: "shadow-gold/20" };
  if (iconColor.includes("gold"))   return { accent: "from-gold/20 to-gold/5",     dot: "bg-gold",      glow: "shadow-gold/20" };
  if (iconColor.includes("blue"))   return { accent: "from-blue-500/20 to-blue-500/5",   dot: "bg-blue-500",   glow: "shadow-blue-500/20" };
  if (iconColor.includes("green"))  return { accent: "from-green-500/20 to-green-500/5", dot: "bg-green-500",  glow: "shadow-green-500/20" };
  if (iconColor.includes("red"))    return { accent: "from-red-500/20 to-red-500/5",     dot: "bg-red-500",    glow: "shadow-red-500/20" };
  if (iconColor.includes("purple")) return { accent: "from-purple-500/20 to-purple-500/5", dot: "bg-purple-500", glow: "shadow-purple-500/20" };
  if (iconColor.includes("amber"))  return { accent: "from-amber-500/20 to-amber-500/5", dot: "bg-amber-500",  glow: "shadow-amber-500/20" };
  return { accent: "from-gold/20 to-gold/5", dot: "bg-gold", glow: "shadow-gold/20" };
}

export function StatCard({
  label, value, subvalue, trend, trendLabel = "vs last period",
  icon: Icon, iconColor = "text-gold", iconBg, className, loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn("stat-card", className)}>
        <div className="skeleton h-3 w-20 mb-4 rounded" />
        <div className="skeleton h-9 w-28 mb-2 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    );
  }

  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const { accent, dot, glow } = getAccentFromColor(iconColor);

  return (
    <div className={cn(
      "stat-card group relative overflow-hidden",
      className
    )}>
      {/* Background gradient accent */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        accent
      )} aria-hidden />

      {/* Accent dot */}
      <div className={cn("absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-60 bg-gradient-to-r from-transparent via-current to-transparent", dot.replace("bg-", "text-"))} aria-hidden>
        <div className={cn("h-full w-1/2 mx-auto rounded-full", dot)} />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest truncate">
            {label}
          </p>
          <p className="text-3xl font-bold text-foreground mt-2 tabular-nums leading-none tracking-tight">
            {value}
          </p>
          {subvalue && (
            <p className="text-xs text-muted-foreground mt-1.5">{subvalue}</p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-300",
            iconBg ?? "bg-muted border-border",
            "group-hover:shadow-lg group-hover:scale-105",
            glow
          )}>
            <Icon size={20} className={iconColor} aria-hidden />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="relative flex items-center gap-1.5 mt-4 pt-3 border-t border-border/60">
          <div className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold",
            isPositive ? "bg-green-500/10 text-green-500" :
            isNegative ? "bg-red-500/10 text-red-500" :
            "bg-muted text-muted-foreground"
          )}>
            {isPositive ? <TrendingUp size={11} /> : isNegative ? <TrendingDown size={11} /> : <Minus size={11} />}
            {trend > 0 ? "+" : ""}{Math.abs(trend).toFixed(1)}%
          </div>
          <span className="text-xs text-muted-foreground">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
