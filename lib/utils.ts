import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ────────────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = "USD",
  compact = false
): string {
  if (compact && Math.abs(amount) >= 1000) {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return formatter.format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Dates ───────────────────────────────────────────────────────────────────

export function formatDate(date: Date | string, fmt = "MMM d, yyyy"): string {
  return format(new Date(date), fmt);
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (s.getFullYear() === e.getFullYear()) {
    return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
  }
  return `${format(s, "MMM d, yyyy")} – ${format(e, "MMM d, yyyy")}`;
}

// ─── Numbers ─────────────────────────────────────────────────────────────────

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Strings ─────────────────────────────────────────────────────────────────

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function truncate(str: string, max = 50): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Color helpers ───────────────────────────────────────────────────────────

export function severityColor(severity: string): string {
  const map: Record<string, string> = {
    CRITICAL:      "text-red-500 bg-red-500/10 border-red-500/20",
    HIGH:          "text-orange-500 bg-orange-500/10 border-orange-500/20",
    MEDIUM:        "text-amber-500 bg-amber-500/10 border-amber-500/20",
    LOW:           "text-blue-500 bg-blue-500/10 border-blue-500/20",
    INFORMATIONAL: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  };
  return map[severity] ?? "text-slate-400 bg-slate-500/10";
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE:      "text-green-500 bg-green-500/10",
    COMPLETED:   "text-blue-500 bg-blue-500/10",
    ON_HOLD:     "text-amber-500 bg-amber-500/10",
    CANCELLED:   "text-red-500 bg-red-500/10",
    PLANNING:    "text-purple-500 bg-purple-500/10",
    DISCOVERY:   "text-sky-500 bg-sky-500/10",
    DRAFT:       "text-slate-400 bg-slate-400/10",
    PAID:        "text-green-500 bg-green-500/10",
    OVERDUE:     "text-red-500 bg-red-500/10",
    SENT:        "text-blue-500 bg-blue-500/10",
    OPEN:        "text-amber-500 bg-amber-500/10",
    RESOLVED:    "text-green-500 bg-green-500/10",
  };
  return map[status] ?? "text-slate-400 bg-slate-400/10";
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function generateInvoiceNumber(prefix = "INV", lastNumber = 0): string {
  const next = (lastNumber + 1).toString().padStart(4, "0");
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${next}`;
}

export function riskScoreLabel(score: number): string {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

export function riskScoreColor(score: number): string {
  if (score >= 75) return "text-red-500";
  if (score >= 50) return "text-orange-500";
  if (score >= 25) return "text-amber-500";
  return "text-green-500";
}
