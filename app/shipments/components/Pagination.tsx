import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  limit: number;
  onLimitChange: (newLimit: number) => void;
  totalRecords: number;
  limitOptions?: number[];
  entityName?: string;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
  totalRecords,
  limitOptions,
  entityName = "Shipments",
}: PaginationProps) {
  if (totalRecords === 0) return null;

  const fromIndex = (page - 1) * limit + 1;
  const toIndex = Math.min(page * limit, totalRecords);

  const getPageNumbers = () => {
    const range: number[] = [];
    const delta = 1; // Number of pages to show around current page
    const left = page - delta;
    const right = page + delta + 1;
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        range.push(i);
      }
    }

    const rangeWithDots: (number | string)[] = [];
    for (const i of range) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6 px-6 py-4 bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl shadow-xl select-none">
      {/* Left side: Range indicator */}
      <div className="flex items-center">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
          Showing <span className="font-bold text-slate-350">{fromIndex}–{toIndex}</span> of{" "}
          <span className="font-bold text-slate-350">{totalRecords}</span> {entityName}
        </p>
      </div>

      {/* Middle: Rows per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-350 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none cursor-pointer"
        >
          {(limitOptions || [15, 25, 50, 100]).map((opt) => (
            <option key={opt} value={opt}>
              {opt} Rows
            </option>
          ))}
        </select>
      </div>

      {/* Right side: Page navigation */}
      {totalPages > 1 && (
        <div>
          <nav className="relative z-0 inline-flex rounded-xl shadow-sm gap-1.5" aria-label="Pagination">
            {/* Previous */}
            <button
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page === 1}
              className="relative inline-flex items-center p-2 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page Buttons */}
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === "...") {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="relative inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-slate-500 select-none"
                  >
                    ...
                  </span>
                );
              }
              const isCurrent = pageNum === page;
              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => onPageChange(pageNum as number)}
                  className={`relative inline-flex items-center px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? "z-10 bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-500/20"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-250 hover:bg-slate-850/80"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next */}
            <button
              onClick={() => onPageChange(Math.min(page + 1, totalPages))}
              disabled={page === totalPages}
              className="relative inline-flex items-center p-2 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <span className="sr-only">Next</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
