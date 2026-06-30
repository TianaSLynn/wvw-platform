"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "wvw_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-[#1A1A1B] text-white rounded-2xl shadow-2xl p-5 animate-fade-in"
    >
      <p className="text-[11px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-2">Cookie Notice</p>
      <p className="text-xs text-white/70 leading-relaxed mb-4">
        We use essential cookies to operate this platform and optional analytics cookies to improve your
        experience. See our{" "}
        <Link href="/privacy" className="underline text-white/90 hover:text-white">Privacy Policy</Link>{" "}
        for details.
      </p>
      <div className="flex gap-2">
        <button
          onClick={accept}
          className="flex-1 text-xs font-semibold bg-[#C9A84C] text-[#1A1A1B] h-8 rounded-lg hover:bg-[#C9A84C]/90 transition-colors"
        >
          Accept All
        </button>
        <button
          onClick={decline}
          className="flex-1 text-xs font-medium border border-white/20 h-8 rounded-lg hover:bg-white/5 transition-colors"
        >
          Essential Only
        </button>
      </div>
    </div>
  );
}
