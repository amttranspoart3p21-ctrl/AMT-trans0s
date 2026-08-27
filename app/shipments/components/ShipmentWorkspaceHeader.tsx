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
    <header className="flex justify-between items-center pb-6 border-b border-slate-800">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-slate-400 mt-1 font-medium">
          {context.type === "global"
            ? "Global Shipment Register database"
            : `${context.type.toUpperCase()}: ${resolvedBaseName || "Resolving ID..."}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-355 hover:text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>
      </div>
    </header>
  );
}
