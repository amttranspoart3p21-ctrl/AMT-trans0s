import React from "react";

interface DocumentToolbarProps {
  docType: string;
  onDocTypeChange: (docType: string) => void;
  onFiltersToggle: () => void;
  showFilters: boolean;
  activeFiltersCount: number;
  onPrint: () => void;
  onExportExcel: () => void;
}

export default function DocumentToolbar({
  docType,
  onDocTypeChange,
  onFiltersToggle,
  showFilters,
  activeFiltersCount,
  onPrint,
  onExportExcel,
}: DocumentToolbarProps) {
  const templates = [
    {
      id: "shipment",
      label: "Shipment Statement",
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "billing",
      label: "Company Billing Statement",
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#18191A] border border-slate-200/90 dark:border-zinc-800 shadow-xs rounded-xl p-2 sm:px-3 sm:py-2 flex flex-wrap items-center justify-between gap-2.5 select-none transition-colors">
      {/* 1. Left Group: ERP Segmented Template Tabs & Filters */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Segmented Document Switcher */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          {templates.map((tpl) => {
            const isActive = docType === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onDocTypeChange(tpl.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-sky-600 dark:bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 border border-transparent"
                }`}
                title={`Switch to ${tpl.label}`}
              >
                {tpl.icon}
                <span>{tpl.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

        {/* ERP Filter Trigger Button */}
        <button
          type="button"
          onClick={onFiltersToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
            showFilters
              ? "bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-500/80 text-sky-700 dark:text-sky-300 font-bold ring-1 ring-sky-400/30"
              : "bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Toggle search and filter options"
        >
          <svg className={`h-3.5 w-3.5 ${showFilters ? "text-sky-600 dark:text-sky-400" : "text-slate-500 dark:text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 bg-sky-600 text-white rounded-full text-[10px] font-extrabold shadow-2xs">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Right Group: ERP Document Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-2xs active:scale-95"
          title="Print document or save as PDF"
        >
          <svg className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print</span>
        </button>

        <button
          type="button"
          onClick={onExportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border border-emerald-300/80 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs active:scale-95"
          title="Export current document to Excel"
        >
          <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export Excel</span>
        </button>
      </div>
    </div>
  );
}
