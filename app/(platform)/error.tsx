"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-base font-bold mb-1">Something went wrong</h2>
          <p className="text-xs text-muted-foreground">
            {error.message ?? "An unexpected error occurred loading this page."}
          </p>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">ID: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-medium hover:bg-navy-800 transition-colors"
          >
            <RefreshCw size={12} /> Try again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors"
          >
            <Home size={12} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
