import React from "react";
import Link from "next/link";
import type { WorkspaceContext } from "@/types/shipment";

interface ShipmentWorkspaceHeaderProps {
  title?: string;
  context: WorkspaceContext;
  resolvedBaseName?: string;
  hideHeader?: boolean;
}

export default function ShipmentWorkspaceHeader({
  title,
  context,
  resolvedBaseName,
  hideHeader = false,
}: ShipmentWorkspaceHeaderProps) {
  if (hideHeader) return null;

  return (
    <header className="flex justify-between items-center pb-3 border-b border-slate-200/80 dark:border-zinc-800 shrink-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          {title}
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-0.5 text-xs font-medium">
          {context.type === "global"
            ? "Global Shipment Register database"
            : `${context.type.toUpperCase()}: ${resolvedBaseName || "Resolving ID..."}`}
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard"
          className="px-3.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-zinc-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <svg className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>
      </div>
    </header>
  );
}
