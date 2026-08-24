

"use client";

import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { lockApp } from "@/utils/settings";

export default function LockAppButton() {
  const router = useRouter();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  const handleLockApp = () => {
    lockApp();
    router.replace("/login");
  };

  return (
    <button
      onClick={handleLockApp}
      className={`relative px-3.5 py-1.5 rounded-lg transition-all duration-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer group border active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
        isDarkMode
          ? "bg-[#242526] hover:bg-red-950/40 hover:border-red-900/50 text-slate-200 hover:text-red-400 border-slate-700/60 focus-visible:ring-red-900/50 focus-visible:ring-offset-[#1a1a1b]"
          : "bg-slate-100 hover:bg-red-50 hover:border-red-200 text-slate-700 hover:text-red-600 border-slate-200/80 focus-visible:ring-red-200 focus-visible:ring-offset-white"
      }`}
      title="Lock Application"
    >
      <svg
        className={`h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-105 ${
          isDarkMode
            ? "text-slate-400 group-hover:text-red-400"
            : "text-slate-500 group-hover:text-red-600"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <span>Lock App</span>
    </button>
  );
}