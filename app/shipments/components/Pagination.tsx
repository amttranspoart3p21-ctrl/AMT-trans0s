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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-2 py-2 select-none">
      {/* Left side: Range indicator */}
      <div className="flex items-center">
        <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
          SHOWING {fromIndex}–{toIndex} OF {totalRecords} {entityName.toUpperCase()}
        </p>
      </div>

      {/* Right side: Rows per page and page navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">ROWS PER PAGE:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none cursor-pointer shadow-2xs"
          >
            {(limitOptions || [15, 25, 50, 100]).map((opt) => (
              <option key={opt} value={opt} className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100">
                {opt} Rows
              </option>
            ))}
          </select>
        </div>

        {totalPages > 1 && (
          <nav className="inline-flex rounded-lg shadow-2xs gap-1" aria-label="Pagination">
            {/* Previous */}
            <button
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page === 1}
              className="inline-flex items-center p-1.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page Buttons */}
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === "...") {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-400 dark:text-zinc-500 select-none"
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
                  className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
                    isCurrent
                      ? "z-10 bg-sky-600 border-sky-600 text-white shadow-xs"
                      : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700"
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
              className="inline-flex items-center p-1.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <span className="sr-only">Next</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
