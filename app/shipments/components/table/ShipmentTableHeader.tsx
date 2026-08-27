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
    <thead>
      <tr className="bg-slate-955/40 border-b border-slate-850">
        {/* Checkbox Select All Column */}
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 w-[50px] text-center select-none border-b border-slate-800" style={{ width: "50px", minWidth: "50px" }}>
          <input
            type="checkbox"
            checked={shipments.length > 0 && shipments.every((s) => selectedIds.includes(s.shipmentId))}
            onChange={(e) => {
              if (e.target.checked) {
                const newSelected = [...selectedIds];
                shipments.forEach((s) => {
                  if (!newSelected.includes(s.shipmentId)) {
                    newSelected.push(s.shipmentId);
                  }
                });
                onSelectAll?.(newSelected);
              } else {
                const idsToRemove = shipments.map((s) => s.shipmentId);
                onSelectAll?.(selectedIds.filter((id) => !idsToRemove.includes(id)));
              }
            }}
            className="rounded border-slate-700 bg-slate-950 text-violet-600 focus:ring-violet-500 cursor-pointer h-3.5 w-3.5"
          />
        </th>
        <th onClick={() => onSort("date")} className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-800" style={{ width: "110px", minWidth: "110px" }}>
          <div className="flex items-center gap-1.5">
            Date <SortIcon colKey="date" />
          </div>
        </th>
        <th onClick={() => onSort("vehicleNumber")} className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-800" style={{ width: "110px", minWidth: "110px" }}>
          <div className="flex items-center gap-1.5">
            Vehicle No <SortIcon colKey="vehicleNumber" />
          </div>
        </th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "130px", minWidth: "130px" }}>From Branch</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "240px", minWidth: "240px" }}>From Company</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "130px", minWidth: "130px" }}>To Branch</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "240px", minWidth: "240px" }}>To Company</th>
        <th onClick={() => onSort("ourInvoiceNumber")} className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-800" style={{ width: "130px", minWidth: "130px" }}>
          <div className="flex items-center gap-1.5">
            Our Invoice <SortIcon colKey="ourInvoiceNumber" />
          </div>
        </th>
        <th onClick={() => onSort("customerInvoiceNumber")} className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-800" style={{ width: "150px", minWidth: "150px" }}>
          <div className="flex items-center gap-1.5">
            Cust Invoice <SortIcon colKey="customerInvoiceNumber" />
          </div>
        </th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "200px", minWidth: "200px" }}>Material</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right border-b border-slate-800" style={{ width: "90px", minWidth: "90px" }}>Qty</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "140px", minWidth: "140px" }}>Pickup Service</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "150px", minWidth: "150px" }}>Delivery Service</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "130px", minWidth: "130px" }}>Pay Branch</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "240px", minWidth: "240px" }}>Pay Company</th>
        <th onClick={() => onSort("transportRate")} className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-800 text-right" style={{ width: "120px", minWidth: "120px" }}>
          <div className="flex items-center justify-end gap-1.5">
            Transport Rate <SortIcon colKey="transportRate" />
          </div>
        </th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right border-b border-slate-800" style={{ width: "120px", minWidth: "120px" }}>Pickup Charge</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right border-b border-slate-800" style={{ width: "120px", minWidth: "120px" }}>Delivery Charge</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right border-b border-slate-800" style={{ width: "140px", minWidth: "140px" }}>Price Per Material</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right border-b border-slate-800" style={{ width: "140px", minWidth: "140px" }}>Total Amount</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-center border-b border-slate-800" style={{ width: "140px", minWidth: "140px" }}>Delivery Status</th>
        <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-center border-b border-slate-800" style={{ width: "120px", minWidth: "120px" }}>Payment Status</th>
        <th className="sticky right-0 top-0 bg-slate-950 z-30 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-center border-b border-slate-800 border-l border-slate-800 shadow-[-4px_0_12px_rgba(0,0,0,0.5)]" style={{ width: "120px", minWidth: "120px" }}>Actions</th>
      </tr>
    </thead>
  );
}
