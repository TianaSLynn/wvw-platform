"use client";

import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const BAND_COLORS: Record<string, string> = {
  CRITICAL:            "#ef4444",
  AT_RISK:             "#f97316",
  NEEDS_STRENGTHENING: "#f59e0b",
  STRONG:              "#22c55e",
};

const BAND_LABELS: Record<string, string> = {
  CRITICAL:            "Critical",
  AT_RISK:             "At Risk",
  NEEDS_STRENGTHENING: "Needs Strengthening",
  STRONG:              "Strong",
};

// ── Score Ring ────────────────────────────────────────────────────────────────

interface ScoreRingProps {
  score: number;
  riskBand: string;
  label?: string;
  size?: number;
}

export function ScoreRing({ score, riskBand, label = "Health Score", size = 180 }: ScoreRingProps) {
  const color = BAND_COLORS[riskBand] ?? "#f97316";
  const data  = [{ name: "score", value: score, fill: color }];

  return (
    <div className="flex flex-col items-center" style={{ width: size, height: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="90%"
            barSize={14}
            startAngle={225} endAngle={-45}
            data={data}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "hsl(var(--muted))" }}
              dataKey="value"
              angleAxisId={0}
              cornerRadius={7}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold leading-none" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground mt-1 font-medium">/100</span>
        </div>
      </div>
      <p className="text-xs font-medium text-muted-foreground mt-2 text-center">{label}</p>
      <span
        className="mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
        style={{ background: color + "20", color }}
      >
        {BAND_LABELS[riskBand] ?? riskBand}
      </span>
    </div>
  );
}

// ── Domain Bar Chart ──────────────────────────────────────────────────────────

interface DomainBar {
  sectionTitle: string;
  score:        number;
  riskBand:     string;
}

interface DomainBarChartProps {
  domains: DomainBar[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { riskBand: string } }> }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]!;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{p.value}/100</p>
      <p className="text-muted-foreground">{BAND_LABELS[p.payload.riskBand] ?? p.payload.riskBand}</p>
    </div>
  );
};

export function DomainBarChart({ domains }: DomainBarChartProps) {
  const data = domains.map((d) => ({
    name:     d.sectionTitle.length > 22 ? d.sectionTitle.slice(0, 22) + "…" : d.sectionTitle,
    score:    d.score,
    riskBand: d.riskBand,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }} barSize={10}>
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis
          type="category" dataKey="name" width={148}
          tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
        <Bar dataKey="score" radius={[0, 5, 5, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={BAND_COLORS[entry.riskBand] ?? "#f59e0b"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Score Summary Grid (stat tiles) ──────────────────────────────────────────

interface ScoreSummaryProps {
  responseCount: number;
  questionCount: number;
  flagCount:     number;
  domainCount:   number;
}

export function ScoreSummary({ responseCount, questionCount, flagCount, domainCount }: ScoreSummaryProps) {
  const tiles = [
    { label: "Respondents",    value: responseCount, color: "text-blue-600" },
    { label: "Questions Scored", value: questionCount, color: "text-foreground" },
    { label: "Risk Flags",     value: flagCount,     color: flagCount > 0 ? "text-red-600" : "text-green-600" },
    { label: "Domains",        value: domainCount,   color: "text-foreground" },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="section-card p-3 text-center">
          <p className={cn("text-2xl font-bold", t.color)}>{t.value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t.label}</p>
        </div>
      ))}
    </div>
  );
}
