import React from "react";

interface DocumentToolbarProps {
  onFiltersToggle: () => void;
  showFilters: boolean;
  activeFiltersCount: number;
  onPrint: () => void;
  onExportExcel: () => void;
}

export default function DocumentToolbar({
  onFiltersToggle,
  showFilters,
  activeFiltersCount,
  onPrint,
  onExportExcel,
}: DocumentToolbarProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none backdrop-blur-md">
      {/* 1. Filter Trigger button */}
      <div>
        <button
          onClick={onFiltersToggle}
          className={`px-4 py-2.5 border rounded-2xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-md ${
            showFilters
              ? "bg-violet-600 border-violet-500 text-white"
              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </div>

      {/* 2. Action Buttons */}
      <div className="flex items-center justify-end gap-3 shrink-0">
        <button
          onClick={onPrint}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
          title="Print document"
        >
          🖨️ Print
        </button>


        <button
          onClick={onExportExcel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
          title="Export as Excel workbook"
        >
          📤 Export Excel
        </button>

        <button
          disabled
          className="px-4.5 py-2 bg-gradient-to-r from-emerald-800/40 to-teal-800/40 text-slate-500 text-xs font-bold rounded-xl shadow-lg cursor-not-allowed flex items-center gap-1.5 border border-slate-800/50"
          title="Generate final invoice (Reserved)"
        >
          ⚙️ Generate
        </button>
      </div>
    </div>
  );
}
