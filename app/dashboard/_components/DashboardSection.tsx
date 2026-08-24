"use client";

import React from "react";
import { useAppSelector } from "@/store/hooks";

interface DashboardSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function DashboardSection({
  title,
  description,
  children,
}: DashboardSectionProps) {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  return (
    <section className="flex flex-col gap-4">
      <div
        className="flex items-center gap-2.5 pb-3"
        style={{
          borderBottom: isDarkMode ? "1px solid #21262D" : "1px solid #E2E8F0",
        }}
      >
        <span
          className="h-3.5 w-[3px] rounded-full shrink-0"
          style={{ background: "#0284c7" }}
        />
        <span
          className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: isDarkMode ? "#E6EDF3" : "#334155" }}
        >
          {title}
        </span>
        <span
          className="h-1 w-1 rounded-full shrink-0"
          style={{ background: isDarkMode ? "#30363D" : "#CBD5E1" }}
        />
        <span
          className="text-[11px] font-medium"
          style={{ color: isDarkMode ? "#8B949E" : "#94A3B8" }}
        >
          {description}
        </span>
      </div>
      {children}
    </section>
  );
}
