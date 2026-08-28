import React from "react";
import type { ShipmentRecord } from "@/types/shipment";

export interface ShipmentTableHeaderProps {
  shipments: ShipmentRecord[];
  selectedIds: string[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (columnKey: string) => void;
  onSelectAll?: (selectedIds: string[]) => void;
}

export default function ShipmentTableHeader({
  shipments,
  selectedIds,
  sortBy,
  sortOrder,
  onSort,
  onSelectAll,
}: ShipmentTableHeaderProps) {
  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortBy !== colKey) {
      return (
        <svg className="h-3 w-3 opacity-30 group-hover:opacity-75 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
      <svg className="h-3 w-3 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="h-3 w-3 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <thead>
      <tr className="bg-[#f8fafc] dark:bg-[#1c1d1e] border-b border-slate-200 dark:border-zinc-800">
        <th onClick={() => onSort("date")} className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-200 dark:border-zinc-800 transition-colors" style={{ width: "115px", minWidth: "115px" }}>
          <div className="flex items-center gap-1.5">
            Date <SortIcon colKey="date" />
          </div>
        </th>
        <th onClick={() => onSort("vehicleNumber")} className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-200 dark:border-zinc-800 transition-colors" style={{ width: "120px", minWidth: "120px" }}>
          <div className="flex items-center gap-1.5">
            Vehicle No <SortIcon colKey="vehicleNumber" />
          </div>
        </th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none border-b border-slate-200 dark:border-zinc-800" style={{ width: "135px", minWidth: "135px" }}>From Branch</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none border-b border-slate-200 dark:border-zinc-800" style={{ width: "240px", minWidth: "240px" }}>From Company</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none border-b border-slate-200 dark:border-zinc-800" style={{ width: "135px", minWidth: "135px" }}>To Branch</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none border-b border-slate-200 dark:border-zinc-800" style={{ width: "240px", minWidth: "240px" }}>To Company</th>
        <th onClick={() => onSort("ourInvoiceNumber")} className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-200 dark:border-zinc-800 transition-colors" style={{ width: "130px", minWidth: "130px" }}>
          <div className="flex items-center gap-1.5">
            Our Invoice <SortIcon colKey="ourInvoiceNumber" />
          </div>
        </th>
        <th onClick={() => onSort("customerInvoiceNumber")} className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-200 dark:border-zinc-800 transition-colors" style={{ width: "150px", minWidth: "150px" }}>
          <div className="flex items-center gap-1.5">
            Cust Invoice <SortIcon colKey="customerInvoiceNumber" />
          </div>
        </th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none border-b border-slate-200 dark:border-zinc-800" style={{ width: "200px", minWidth: "200px" }}>Material</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none text-right border-b border-slate-200 dark:border-zinc-800" style={{ width: "90px", minWidth: "90px" }}>Qty</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none border-b border-slate-200 dark:border-zinc-800" style={{ width: "140px", minWidth: "140px" }}>Pickup Service</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none border-b border-slate-200 dark:border-zinc-800" style={{ width: "150px", minWidth: "150px" }}>Delivery Service</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none border-b border-slate-200 dark:border-zinc-800" style={{ width: "135px", minWidth: "135px" }}>Pay Branch</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none border-b border-slate-200 dark:border-zinc-800" style={{ width: "240px", minWidth: "240px" }}>Pay Company</th>
        <th onClick={() => onSort("transportRate")} className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-200 dark:border-zinc-800 text-right transition-colors" style={{ width: "130px", minWidth: "130px" }}>
          <div className="flex items-center justify-end gap-1.5">
            Transport Rate <SortIcon colKey="transportRate" />
          </div>
        </th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none text-right border-b border-slate-200 dark:border-zinc-800" style={{ width: "125px", minWidth: "125px" }}>Pickup Charge</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none text-right border-b border-slate-200 dark:border-zinc-800" style={{ width: "125px", minWidth: "125px" }}>Delivery Charge</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none text-right border-b border-slate-200 dark:border-zinc-800" style={{ width: "140px", minWidth: "140px" }}>Price Per Piece</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none text-right border-b border-slate-200 dark:border-zinc-800" style={{ width: "140px", minWidth: "140px" }}>Total Amount</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none text-center border-b border-slate-200 dark:border-zinc-800" style={{ width: "140px", minWidth: "140px" }}>Delivery Status</th>
        <th className="sticky top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-20 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none text-center border-b border-slate-200 dark:border-zinc-800" style={{ width: "130px", minWidth: "130px" }}>Payment Status</th>
        <th className="sticky right-0 top-0 bg-[#f8fafc] dark:bg-[#1c1d1e] backdrop-blur-xs z-30 py-3 px-3.5 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider select-none text-center border-b border-slate-200 dark:border-zinc-800 border-l border-slate-200 dark:border-zinc-800" style={{ width: "120px", minWidth: "120px" }}>Actions</th>
      </tr>
    </thead>
  );
}
