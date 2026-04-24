"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, Printer, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  invoiceId: string;
  status: string;
}

export default function InvoiceActions({ invoiceId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus);
    try {
      await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    status === "DRAFT" && {
      label: "Send Invoice",
      icon: Send,
      onClick: () => updateStatus("SENT"),
      variant: "primary",
    },
    ["SENT","PARTIAL","OVERDUE"].includes(status) && {
      label: "Mark Paid",
      icon: CheckCircle2,
      onClick: () => updateStatus("PAID"),
      variant: "success",
    },
    {
      label: "Print / PDF",
      icon: Printer,
      onClick: () => window.print(),
      variant: "outline",
    },
  ].filter(Boolean) as Array<{ label: string; icon: React.ElementType; onClick: () => void; variant: string }>;

  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={!!loading}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-colors",
              action.variant === "primary" && "bg-navy-900 text-white hover:bg-navy-800",
              action.variant === "success" && "bg-green-600 text-white hover:bg-green-700",
              action.variant === "outline" && "border border-border hover:bg-muted",
              "disabled:opacity-50"
            )}
          >
            {loading === action.label.toLowerCase() ? (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon size={13} />
            )}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
