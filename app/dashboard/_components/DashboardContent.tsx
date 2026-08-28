"use client";

import { useAppSelector } from "@/store/hooks";
import type { MasterDashboardStats } from "@/services/dashboard.service";
// import DashboardHeader from "./DashboardHeader";
import DashboardStats from "./DashboardStats";
import DashboardRefreshButton from "./DashboardRefreshButton";

interface DashboardContentProps {
  stats: MasterDashboardStats | null;
  error: string;
}

export default function DashboardContent({ stats, error }: DashboardContentProps) {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  return (
    <div
      className="flex-1 flex flex-col p-6 pb-20 sm:pb-24 w-full mx-auto relative select-none gap-8 min-h-full transition-colors duration-300"
      style={isDarkMode ? { background: "#18191A" } : { background: "#F0F7FF" }}
    >
      {/* <DashboardHeader /> */}

      {/* Error State */}
      {error && (
        <div
          className="rounded-2xl p-8 text-center max-w-xl mx-auto my-8"
          style={
            isDarkMode
              ? { background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }
              : { background: "#fff5f5", border: "1px solid rgba(239,68,68,0.2)" }
          }
        >
          <svg
            className="h-10 w-10 mx-auto mb-3"
            style={{ color: "#EF4444" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>
            {error}
          </p>
          <div className="mt-4 flex justify-center">
            <DashboardRefreshButton label="Retry Loading Dashboard" />
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && <DashboardStats stats={stats} />}
    </div>
  );
}
