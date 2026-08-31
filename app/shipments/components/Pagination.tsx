import React, { useState, useRef, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";

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
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (totalRecords === 0) return null;

  const fromIndex = (page - 1) * limit + 1;
  const toIndex = Math.min(page * limit, totalRecords);

  const getPageNumbers = () => {
    const range: number[] = [];
    const delta = 1;
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
        <p
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: isDarkMode ? "#8B949E" : "#64748B" }}
        >
          SHOWING {fromIndex}–{toIndex} OF {totalRecords} {entityName.toUpperCase()}
        </p>
      </div>

      {/* Right side: Rows per page and page navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: isDarkMode ? "#8B949E" : "#64748B" }}
          >
            ROWS PER PAGE:
          </span>
          
          {/* Custom ERP Rows Per Page Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold outline-none cursor-pointer shadow-2xs transition-all active:scale-95 border ${
                isDarkMode
                  ? "bg-[#21262D] hover:bg-[#30363D] border-[#30363D] text-[#F0F6FC]"
                  : "bg-white hover:bg-slate-50 border-slate-300 text-slate-700"
              }`}
            >
              <span>{limit} Rows</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  dropdownOpen
                    ? "rotate-180 text-sky-500"
                    : isDarkMode
                    ? "text-[#8B949E]"
                    : "text-slate-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Dropdown Popover (Opens Upward) */}
            {dropdownOpen && (
              <div
                className={`absolute right-0 bottom-full mb-1.5 w-32 rounded-xl shadow-xl p-1 z-50 animate-fade-in select-none border ${
                  isDarkMode
                    ? "bg-[#18191A] border-[#30363D] text-[#F0F6FC]"
                    : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <div
                  className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border-b mb-0.5 ${
                    isDarkMode ? "text-[#8B949E] border-[#30363D]" : "text-slate-400 border-slate-100"
                  }`}
                >
                  Rows Per Page
                </div>
                {(limitOptions || [15, 25, 50, 100]).map((opt) => {
                  const isSelected = limit === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onLimitChange(opt);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? isDarkMode
                            ? "bg-sky-950/60 text-sky-300 font-extrabold"
                            : "bg-sky-50 text-sky-700 font-extrabold"
                          : isDarkMode
                          ? "text-[#C9D1D9] hover:bg-[#21262D] hover:text-white"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span>{opt} Rows</span>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <nav className="inline-flex rounded-lg shadow-2xs gap-1" aria-label="Pagination">
            {/* Previous */}
            <button
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page === 1}
              className={`inline-flex items-center p-1.5 rounded-md border disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                isDarkMode
                  ? "bg-[#21262D] hover:bg-[#30363D] border-[#30363D] text-[#C9D1D9]"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500"
              }`}
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
                    className="inline-flex items-center px-2 py-1 text-xs font-medium select-none"
                    style={{ color: isDarkMode ? "#8B949E" : "#94A3B8" }}
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
                      ? "z-10 bg-sky-600 border-sky-600 text-white shadow-xs font-bold"
                      : isDarkMode
                      ? "bg-[#21262D] hover:bg-[#30363D] border-[#30363D] text-[#C9D1D9]"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
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
              className={`inline-flex items-center p-1.5 rounded-md border disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors ${
                isDarkMode
                  ? "bg-[#21262D] hover:bg-[#30363D] border-[#30363D] text-[#C9D1D9]"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500"
              }`}
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
