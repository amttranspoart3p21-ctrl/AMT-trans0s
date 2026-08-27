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
    <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 select-none backdrop-blur-md shadow-lg">
      {/* Left Group: Mode Selector, Search Input, Filters Toggle */}
      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
        {/* Mode Toggle Selector */}
        {actions.includes("spreadsheet") && (
          <div className="flex bg-slate-955 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setMode("read-only")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                mode === "read-only"
                  ? "bg-slate-800 text-slate-200"
                  : "text-slate-500 hover:text-slate-350"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Read-Only
            </button>
            <button
              onClick={() => setMode("spreadsheet")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                mode === "spreadsheet"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-500 hover:text-slate-350"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Spreadsheet
            </button>
          </div>
        )}

        {/* Search Bar inside Toolbar */}
        {setSearchText && (
          <div className="flex-1 min-w-[220px] max-w-md relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by vehicle, company, invoice number..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all shadow-inner"
            />
          </div>
        )}

        {/* Filters Toggle Button inside Toolbar */}
        {setShowFilters && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-1.5 border rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
              showFilters
                ? "bg-violet-600 border-violet-500 text-white shadow"
                : "bg-slate-955 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        )}
      </div>

      {/* Right Group: Undo/Redo (Right Side), Modified badge, Discard, Save All */}
      <div className="flex items-center justify-end gap-3 shrink-0">
        {/* Undo / Redo Buttons (Moved to the Right side) */}
        {mode === "spreadsheet" && (onUndo || onRedo) && (
          <div className="flex items-center gap-1 bg-slate-955 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg text-xs font-semibold border transition-all ${
                canUndo
                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 cursor-pointer"
                  : "bg-transparent border-transparent text-slate-650 cursor-not-allowed"
              }`}
              title={canUndo ? "Undo last change" : "Nothing to undo"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg text-xs font-semibold border transition-all ${
                canRedo
                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 cursor-pointer"
                  : "bg-transparent border-transparent text-slate-655 cursor-not-allowed"
              }`}
              title={canRedo ? "Redo change" : "Nothing to redo"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>
        )}

        {/* Modified Rows Indicator Badge */}
        {mode === "spreadsheet" && hasChanges && (
          <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl animate-pulse flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-450 animate-ping"></span>
            {modifiedCount} row{modifiedCount > 1 ? "s" : ""} modified
          </span>
        )}

        {/* Workspace Extra Action Buttons */}
        {mode === "spreadsheet" && actions.includes("statement") && (
          <button
            disabled
            className="px-3.5 py-1.5 bg-slate-850/80 border border-slate-750 text-slate-455 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
            title="Generate statement summary (Reserved)"
          >
            📄 Generate Statement
          </button>
        )}

        {mode === "spreadsheet" && actions.includes("billing") && (
          <button
            disabled
            className="px-3.5 py-1.5 bg-violet-950/40 border border-violet-900/50 text-violet-400 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
            title="Process invoices billing (Reserved)"
          >
            💸 Process Billing
          </button>
        )}

        {/* Discard Changes Button */}
        {mode === "spreadsheet" && (
          <button
            onClick={onDiscard}
            disabled={!hasChanges || saving}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 disabled:bg-slate-900/20 text-slate-355 hover:text-slate-200 disabled:text-slate-650 border border-slate-700/60 disabled:border-slate-850 rounded-xl text-xs font-semibold cursor-pointer disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            Discard
          </button>
        )}

        {/* Save All Button */}
        {mode === "spreadsheet" && (
          <button
            onClick={onSaveAll}
            disabled={!hasChanges || saving}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white disabled:text-slate-500 text-xs font-bold rounded-xl shadow-lg disabled:shadow-none cursor-pointer disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
