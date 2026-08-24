"use client";

import React from "react";
import { useAppSelector } from "@/store/hooks";
import NavTitleAndBreadcrumbs from "./NavTitleAndBreadcrumbs";
import LockAppButton from "./LockAppButton";

export default function Navbar() {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  return (
    <header
      className={`h-16 px-6 flex items-center justify-between shrink-0 select-none z-10 backdrop-blur-md transition-colors duration-300 border-b ${
        isDarkMode
          ? "bg-[#18191a]/95 border-slate-800 text-slate-100"
          : "bg-white border-slate-200/80 text-slate-800"
      }`}
    >
      <div className="flex items-center gap-4">
        <NavTitleAndBreadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`px-3 py-1 rounded-full font-bold text-[10px] tracking-wide border flex items-center gap-1.5 shadow-xs transition-colors ${
            isDarkMode
              ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/60"
              : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE CONNECTED EXCEL SHEET
        </span>
        <LockAppButton />
      </div>
    </header>
  );
}
