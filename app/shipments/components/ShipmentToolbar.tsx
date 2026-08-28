import React from "react";
import type { WorkspaceAction } from "@/types/shipment";

interface ShipmentToolbarProps {
  mode: "read-only" | "spreadsheet";
  setMode: (mode: "read-only" | "spreadsheet") => void;
  onSaveAll: () => void;
  onDiscard: () => void;
  hasChanges: boolean;
  modifiedCount: number;
  saving: boolean;
  actions?: WorkspaceAction[];
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // Search & Filter integration props
  searchText?: string;
  setSearchText?: (text: string) => void;
  showFilters?: boolean;
  setShowFilters?: (show: boolean) => void;
  activeFilterCount?: number;
}

export default function ShipmentToolbar({
  mode,
  setMode,
  onSaveAll,
  onDiscard,
  hasChanges,
  modifiedCount,
  saving,
  actions = ["spreadsheet"],
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  searchText = "",
  setSearchText,
  showFilters = false,
  setShowFilters,
  activeFilterCount = 0,
}: ShipmentToolbarProps) {
  return (
    <div className="bg-white dark:bg-[#1f2021] border border-slate-200/90 dark:border-zinc-800 p-2.5 rounded-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 select-none shadow-xs">
      {/* Left Group: Mode Selector, Search Input, Filters Toggle */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
        {/* Mode Toggle Selector */}
        {actions.includes("spreadsheet") && (
          <div className="inline-flex bg-slate-100/90 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200/70 dark:border-zinc-700 shrink-0">
            <button
              onClick={() => setMode("read-only")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                mode === "read-only"
                  ? "bg-white dark:bg-[#18191a] text-slate-800 dark:text-zinc-100 shadow-xs border border-slate-200/70 dark:border-zinc-700"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <svg className="h-3.5 w-3.5 text-slate-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Read-Only
            </button>
            <button
              onClick={() => setMode("spreadsheet")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                mode === "spreadsheet"
                  ? "bg-white dark:bg-[#18191a] text-sky-600 dark:text-sky-400 shadow-xs border border-slate-200/70 dark:border-zinc-700"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <svg className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Spreadsheet
            </button>
          </div>
        )}

        {/* Filters Toggle Button inside Toolbar */}
        {setShowFilters && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
              showFilters
                ? "bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 shadow-xs"
                : "bg-white dark:bg-zinc-800 border-slate-200/90 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-xs"
            }`}
          >
            <svg className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        )}

        {/* Search Bar inside Toolbar */}
        {setSearchText && (
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by vehicle, company, invoice number..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-slate-50/80 dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
            />
          </div>
        )}
      </div>

      {/* Right Group: Undo/Redo, Modified badge, Discard, Save All */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        {/* Undo / Redo Buttons */}
        {mode === "spreadsheet" && (onUndo || onRedo) && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                canUndo
                  ? "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  : "text-slate-300 dark:text-zinc-600 cursor-not-allowed"
              }`}
              title={canUndo ? "Undo last change" : "Nothing to undo"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                canRedo
                  ? "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  : "text-slate-300 dark:text-zinc-600 cursor-not-allowed"
              }`}
              title={canRedo ? "Redo change" : "Nothing to redo"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>
        )}

        {/* Modified Rows Indicator Badge */}
        {mode === "spreadsheet" && hasChanges && (
          <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            {modifiedCount} modified
          </span>
        )}

        {/* Discard Changes Button */}
        {mode === "spreadsheet" && (
          <button
            onClick={onDiscard}
            disabled={!hasChanges || saving}
            className="px-3.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-400 dark:border-sky-700 disabled:border-slate-200 dark:disabled:border-zinc-800 disabled:bg-slate-50 dark:disabled:bg-zinc-900 disabled:text-slate-300 dark:disabled:text-zinc-600 rounded-lg text-xs font-semibold cursor-pointer disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1.5"
          >
            Discard
          </button>
        )}

        {/* Save All Button */}
        {mode === "spreadsheet" && (
          <button
            onClick={onSaveAll}
            disabled={!hasChanges || saving}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              !hasChanges || saving
                ? "bg-slate-100 dark:bg-zinc-800/60 text-slate-400 dark:text-zinc-600 border border-slate-200 dark:border-zinc-800 cursor-not-allowed"
                : "bg-sky-600 hover:bg-sky-500 text-white shadow-xs cursor-pointer"
            }`}
          >
            {saving ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Save All</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
