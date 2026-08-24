"use client";

import { useAppSelector } from "@/store/hooks";
import DashboardRefreshButton from "./DashboardRefreshButton";

export default function DashboardHeader() {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  return (
    <header className="flex items-center justify-between gap-4">
      {/* Title block */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-9 w-[3px] rounded-full shrink-0"
          style={{ background: "#0284c7" }}
        />
        <div className="min-w-0">
          <h1
            className="text-xl font-bold tracking-tight leading-snug"
            style={{ color: isDarkMode ? "#F0F6FC" : "#0F172A" }}
          >
            Master Dashboard
          </h1>
          <p
            className="text-[11px] font-medium mt-0.5 truncate"
            style={{ color: isDarkMode ? "#8B949E" : "#94A3B8" }}
          >
            Master data overview — branches, companies &amp; packages
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <DashboardRefreshButton />
      </div>
    </header>
  );
}
