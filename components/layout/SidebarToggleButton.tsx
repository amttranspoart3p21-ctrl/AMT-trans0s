"use client";

import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar } from "@/store/slices/uiSlice";

export default function SidebarToggleButton() {
  const dispatch = useAppDispatch();
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  return (
    <button
      onClick={() => dispatch(toggleSidebar())}
      className={`h-6 w-6 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer shrink-0 z-20 ${
        isDarkMode
          ? "bg-[#0284c7] hover:bg-[#0369a1] text-white border border-slate-700"
          : "bg-[#0284c7] hover:bg-[#0369a1] text-white"
      }`}
      title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        {sidebarCollapsed ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        )}
      </svg>
    </button>
  );
}
