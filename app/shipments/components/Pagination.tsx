import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

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
    <div className="flex items-center justify-between mt-6 px-4 py-3 bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-2xl shadow-lg">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page === 1}
          className="relative inline-flex items-center px-4 py-2 border border-slate-800 text-xs font-semibold rounded-xl text-slate-300 bg-slate-950/60 hover:bg-slate-850/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          disabled={page === totalPages}
          className="relative inline-flex items-center px-4 py-2 border border-slate-800 text-xs font-semibold rounded-xl text-slate-300 bg-slate-950/60 hover:bg-slate-850/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            Page <span className="font-semibold text-slate-350">{page}</span> of{" "}
            <span className="font-semibold text-slate-350">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px gap-1.5" aria-label="Pagination">
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
                    className="relative inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-slate-500 select-none"
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
                  className={`relative inline-flex items-center px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
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
      </div>
    </div>
  );
}
