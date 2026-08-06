import React from "react";
import Loader from "./Loader";
import EmptyState from "./EmptyState";

interface TableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render?: (row: T, idx: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  onSort?: (key: string) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey?: (row: T, idx: number) => string | number;
}

export default function Table<T>({
  columns,
  data,
  loading = false,
  onSort,
  sortBy,
  sortOrder,
  pagination,
  emptyTitle,
  emptyDescription,
  rowKey,
}: TableProps<T>) {
  const getRowKey = (row: T, idx: number) => {
    if (rowKey) return rowKey(row, idx);
    // fallback if object has id or uuid
    const anyRow = row as any;
    return anyRow.id || anyRow._id || anyRow.companyId || anyRow.branchId || anyRow.companyRouteRateId || anyRow.routeRateId || anyRow.packageName || anyRow.packageId || idx;
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortBy !== colKey) {
      return (
        <svg className="h-3 w-3 opacity-30 group-hover:opacity-75 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
      <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse select-text text-xs">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-850 select-none">
              {columns.map((col) => {
                const isSortable = !!onSort;
                return (
                  <th
                    key={col.key}
                    onClick={() => isSortable && onSort?.(col.key)}
                    className={`py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${
                      isSortable ? "cursor-pointer group" : ""
                    } ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        col.align === "right"
                          ? "justify-end"
                          : col.align === "center"
                          ? "justify-center"
                          : "justify-start"
                      }`}
                    >
                      {col.header}
                      {isSortable && <SortIcon colKey={col.key} />}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 px-4">
                  <Loader variant="skeleton" rows={4} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-4">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={getRowKey(row, rIdx)}
                  className="hover:bg-slate-850/20 border-l-2 border-transparent hover:border-violet-500/50 transition-colors"
                >
                  {columns.map((col) => {
                    const val = (row as any)[col.key];
                    return (
                      <td
                        key={col.key}
                        className={`py-3 px-4 align-middle text-slate-300 font-medium ${
                          col.align === "right"
                            ? "text-right font-mono"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left"
                        }`}
                      >
                        {col.render ? col.render(row, rIdx) : val !== null && val !== undefined ? String(val) : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component built inside table */}
      {pagination && !loading && data.length > 0 && (
        <div className="px-6 py-4.5 border-t border-slate-850/50 flex justify-between items-center select-none bg-slate-950/20">
          <span className="text-[10px] text-slate-500 font-bold uppercase">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:cursor-not-allowed border border-slate-700/60 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="px-4.5 py-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:cursor-not-allowed border border-slate-700/60 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
