import React, { useState } from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import { EDITABLE_COLUMNS } from "../constants/shipmentWorkspace.constants";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import { useTableKeyboardNavigation } from "../hooks/useTableKeyboardNavigation";
import { useTableClipboardPaste } from "../hooks/useTableClipboardPaste";
import ShipmentTableHeader from "./table/ShipmentTableHeader";
import ShipmentTableRow from "./table/ShipmentTableRow";

interface ShipmentTableProps {
  shipments: ShipmentRecord[];
  loading: boolean;
  onDelete: (shipmentId: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (columnKey: string) => void;
  // Spreadsheet Mode hooks
  mode?: "read-only" | "spreadsheet";
  onChangeRow?: (shipmentId: string, field: keyof ShipmentRecord, value: any) => void;
  onBatchChangeRow?: (updates: Record<string, Partial<ShipmentRecord>>) => void;
  branches?: Branch[];
  onViewImage?: (imageId: string, fileName: string) => void;
  // Selection and Dirty indicators
  selectedIds?: string[];
  onSelectRow?: (selectedIds: string[]) => void;
  onSelectAll?: (selectedIds: string[]) => void;
  dirtyRows?: Record<string, { original: ShipmentRecord; current: ShipmentRecord }>;
  // Master databases for dynamic dropdowns & calculations
  companies?: Company[];
  packages?: Package[];
  companyRouteRates?: CompanyRouteRate[];
  globalRouteRates?: GlobalRouteRate[];
  highlightedCells?: Record<string, Set<string>>;
  emptyStateMessage?: string;
  onPreviewShipment?: (shipment: ShipmentRecord) => void;
  onEditShipment?: (shipment: ShipmentRecord) => void;
}

export default function ShipmentTable({
  shipments,
  loading,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
  mode = "read-only",
  onChangeRow,
  onBatchChangeRow,
  branches = [],
  onViewImage,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  dirtyRows = {},
  companies = [],
  packages = [],
  companyRouteRates = [],
  globalRouteRates = [],
  highlightedCells = {},
  emptyStateMessage = "No shipments found",
  onPreviewShipment,
  onEditShipment,
}: ShipmentTableProps) {
  const [editingCell, setEditingCell] = useState<{ shipmentId: string; field: string } | null>(null);

  const EDITABLE_FIELDS = EDITABLE_COLUMNS;

  const { handleKeyDown } = useTableKeyboardNavigation({
    shipments,
    mode,
    editableFields: EDITABLE_FIELDS,
  });

  const { handlePaste } = useTableClipboardPaste({
    shipments,
    mode,
    onBatchChangeRow,
    editableFields: EDITABLE_FIELDS,
  });





  return (
    <div className="w-full bg-white dark:bg-[#1f2021] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs flex-1 flex flex-col min-h-0">
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 relative">
        <table 
          className="w-full text-left border-collapse min-w-[3400px]"
          onPaste={handlePaste}
        >
          <ShipmentTableHeader
            shipments={shipments}
            selectedIds={selectedIds}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
            onSelectAll={onSelectAll}
          />
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70">
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-zinc-800/80 h-[50px] bg-white dark:bg-[#242526] even:bg-slate-50/50 dark:even:bg-[#1f2021]/80">
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-16 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-20 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-24 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-28 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-24 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-28 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-20 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-8 ml-auto animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-12 ml-auto animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-12 ml-auto animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-20 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-12 ml-auto animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-20 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-12 ml-auto animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-14 ml-auto animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-24 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-28 animate-pulse"></div></td>
                  <td className="p-3.5 text-center"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded-full w-16 mx-auto animate-pulse"></div></td>
                  <td className="p-3.5 text-center"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded-full w-16 mx-auto animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-16 animate-pulse"></div></td>
                  <td className="p-3.5"><div className="h-4 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-16 animate-pulse"></div></td>
                  <td className="sticky right-0 bg-white/95 dark:bg-[#242526]/95 backdrop-blur-xs p-3.5 border-l border-slate-200 dark:border-zinc-800 text-center"><div className="h-6 bg-slate-200/60 dark:bg-zinc-700/60 rounded w-20 mx-auto animate-pulse"></div></td>
                </tr>
              ))
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={22} className="py-16 px-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 border border-slate-200 dark:border-zinc-700">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m15 3.5v-2m-3-1v2m-3-2v2M9 21h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">{emptyStateMessage}</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Try adjusting your search query or active filters.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              shipments.map((shipment) => (
                <ShipmentTableRow
                  key={shipment.shipmentId}
                  shipment={shipment}
                  isSelected={selectedIds.includes(shipment.shipmentId)}
                  isDirty={!!dirtyRows[shipment.shipmentId]}
                  selectedIds={selectedIds}
                  onSelectRow={onSelectRow}
                  mode={mode}
                  branches={branches}
                  companies={companies}
                  packages={packages}
                  companyRouteRates={companyRouteRates}
                  globalRouteRates={globalRouteRates}
                  highlightedCells={highlightedCells}
                  editingCell={editingCell}
                  setEditingCell={setEditingCell}
                  onChangeRow={onChangeRow}
                  handleKeyDown={handleKeyDown}
                  onPreviewShipment={onPreviewShipment}
                  onEditShipment={onEditShipment}
                  onViewImage={onViewImage}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
