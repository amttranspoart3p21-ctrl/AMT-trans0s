import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";

const calculateQuantity = (qty: string | null | undefined): number => {
  if (qty === null || qty === undefined) return 1;
  const clean = qty.trim();
  if (clean === "") return 1;
  const pattern = /^\d+(?:\s*[xX*×]\s*\d+)*$/;
  if (!pattern.test(clean)) return 1;
  const parts = clean.split(/[xX*×]/);
  let product = 1;
  for (const part of parts) {
    const valStr = part.trim();
    if (!/^\d+$/.test(valStr)) return 1;
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val <= 0) return 1;
    product *= val;
  }
  return product;
};

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
  highlightedCells?: Record<string, Set<string>>;
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
  branches = [],
  onViewImage,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  dirtyRows = {},
  companies = [],
  packages = [],
  highlightedCells = {},
}: ShipmentTableProps) {
  const getDeliveryStatusStyle = (status: ShipmentRecord["deliveryStatus"]) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
      case "Not Delivered":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/25";
      case "Missing":
        return "bg-red-500/10 text-red-400 border border-red-500/25";
      case "Damaged":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/25";
    }
  };

  const getPaymentStatusStyle = (status: ShipmentRecord["paymentStatus"]) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
      case "Pending":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";
      case "Free":
        return "bg-sky-500/10 text-sky-400 border border-sky-500/25";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/25";
    }
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

  // Warning Validation Checks (Disappears instantly after correction)
  const getRowWarnings = (s: ShipmentRecord): string[] => {
    const warnings: string[] = [];
    if (!s.date) warnings.push("Date is required.");
    if (!s.vehicleNumber || s.vehicleNumber === "MOCK-1234") warnings.push("Vehicle number is required.");
    if (!s.fromAmtBranch) warnings.push("From Branch is required.");
    if (!s.fromCompany) warnings.push("From Company is required.");
    if (!s.toAmtBranch) warnings.push("To Branch is required.");
    if (!s.toCompany) warnings.push("To Company is required.");
    if (s.fromAmtBranch && s.toAmtBranch && s.fromAmtBranch === s.toAmtBranch) {
      warnings.push("Origin and destination branches cannot be the same.");
    }
    if (!s.packageType) warnings.push("Package Type is required.");
    
    const qtyVal = calculateQuantity(s.quantity);
    if (qtyVal <= 0) {
      warnings.push("Quantity must be greater than 0.");
    }
    if (s.pricePerPiece === null || s.pricePerPiece === undefined || s.pricePerPiece <= 0) {
      warnings.push("Price per piece must be greater than 0.");
    }
    return warnings;
  };

  const isFieldWarning = (field: keyof ShipmentRecord, val: any, shipment: ShipmentRecord) => {
    if (field === "date" && !val) return true;
    if (field === "vehicleNumber" && (!val || val === "MOCK-1234")) return true;
    if (field === "fromAmtBranch") {
      if (!val) return true;
      if (val === shipment.toAmtBranch) return true;
    }
    if (field === "toAmtBranch") {
      if (!val) return true;
      if (val === shipment.fromAmtBranch) return true;
    }
    if (field === "fromCompany" && !val) return true;
    if (field === "toCompany" && !val) return true;
    if (field === "packageType" && !val) return true;
    if (field === "quantity") {
      const qtyVal = calculateQuantity(val);
      if (qtyVal <= 0) return true;
    }
    if (field === "pricePerPiece" && (val === null || val === undefined || val <= 0)) return true;
    return false;
  };

  // Central cell rendering abstraction to support read-only vs inline editing spreadsheet modes
  const renderCell = (
    shipment: ShipmentRecord,
    field: keyof ShipmentRecord,
    type: "text" | "badge" | "number" | "select" | "date",
    options?: string[]
  ) => {
    const isEditing = mode === "spreadsheet";
    const val = shipment[field];
    
    const hasWarning = isEditing && isFieldWarning(field, val, shipment);
    const isHighlighted = highlightedCells[shipment.shipmentId]?.has(String(field));

    const borderClass = hasWarning
      ? "border-amber-500/60 focus:border-amber-500 bg-amber-955/15 text-amber-200"
      : isHighlighted
      ? "border-emerald-500 bg-emerald-950/40 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all duration-300"
      : "border-slate-800 focus:border-violet-500 bg-slate-950 text-slate-200";

    if (isEditing) {
      if (field === "paymentStatus") {
        return (
          <select
            value={val !== null && val !== undefined ? String(val) : "Pending"}
            onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
            className={`w-full border rounded-lg px-2 py-1 text-xs outline-none cursor-pointer transition-colors font-semibold ${borderClass}`}
          >
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Free">Free</option>
          </select>
        );
      }
      if (field === "deliveryStatus") {
        return (
          <select
            value={val !== null && val !== undefined ? String(val) : "Not Delivered"}
            onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
            className={`w-full border rounded-lg px-2 py-1 text-xs outline-none cursor-pointer transition-colors font-semibold ${borderClass}`}
          >
            <option value="Not Delivered">Not Delivered</option>
            <option value="Delivered">Delivered</option>
            <option value="Missing">Missing</option>
            <option value="Damaged">Damaged</option>
          </select>
        );
      }

      switch (type) {
        case "select":
          return (
            <select
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
              className={`w-full border rounded-lg px-2 py-1 text-xs outline-none cursor-pointer transition-colors ${borderClass}`}
            >
              <option value="">Select...</option>
              {options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );
        case "date":
          return (
            <input
              type="date"
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
              className={`w-full border rounded-lg px-2 py-1 text-xs outline-none transition-colors ${borderClass}`}
            />
          );
        case "number":
          return (
            <input
              type="number"
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(e) => {
                const numVal = e.target.value === "" ? null : Number(e.target.value);
                onChangeRow?.(shipment.shipmentId, field, numVal);
              }}
              className={`w-full border rounded-lg px-2 py-1 text-xs outline-none text-right font-mono transition-colors ${borderClass}`}
            />
          );
        case "text":
        default:
          return (
            <input
              type="text"
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
              className={`w-full border rounded-lg px-2 py-1 text-xs outline-none transition-colors ${borderClass}`}
            />
          );
      }
    }

    // Read Mode
    switch (type) {
      case "badge":
        if (field === "deliveryStatus") {
          return (
            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${getDeliveryStatusStyle(val as any)}`}>
              {val}
            </span>
          );
        }
        if (field === "paymentStatus") {
          return (
            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${getPaymentStatusStyle(val as any)}`}>
              {val}
            </span>
          );
        }
        return <span className="text-xs text-slate-350">{String(val || "-")}</span>;
      case "number":
        return (
          <span className="font-mono text-slate-300 text-right block">
            {val !== null && val !== undefined ? `₹${val}` : "-"}
          </span>
        );
      case "text":
      default:
        return <span className="text-xs text-slate-350">{val !== null && val !== undefined ? String(val) : "-"}</span>;
    }
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-850">
              {/* Checkbox Select All Column */}
              <th className="py-4 px-4 w-10 text-center select-none">
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
              <th onClick={() => onSort("date")} className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer group select-none">
                <div className="flex items-center gap-1.5">
                  Date <SortIcon colKey="date" />
                </div>
              </th>
              <th onClick={() => onSort("vehicleNumber")} className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer group select-none">
                <div className="flex items-center gap-1.5">
                  Vehicle <SortIcon colKey="vehicleNumber" />
                </div>
              </th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">From Branch</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">From Company</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">To Branch</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">To Company</th>
              {/* Pay Branch & Pay Company Billing Rules */}
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Pay Branch</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Pay Company</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Package</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right">Qty</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right">Price</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right">Total</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-center">Delivery</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-center">Payment</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-center">Image</th>
              <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse bg-slate-900/10">
                  <td colSpan={17} className="py-4 px-4">
                    <div className="h-4 bg-slate-800/50 rounded-md w-full"></div>
                  </td>
                </tr>
              ))
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={17} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-800/40 flex items-center justify-center text-slate-500 border border-slate-750">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m15 3.5v-2m-3-1v2m-3-2v2M9 21h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-350">No shipments found</p>
                      <p className="text-[10px] text-slate-550 mt-0.5">Try adjusting your search query or filters.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              shipments.map((shipment) => {
                const isDirty = !!dirtyRows[shipment.shipmentId];
                const warnings = getRowWarnings(shipment);
                const hasWarnings = warnings.length > 0;
                const isSelected = selectedIds.includes(shipment.shipmentId);

                // Dynamically filter company dropdowns by branch selection to enforce Master integrity
                const fromAmtCompanies = companies
                  .filter((c) => c.branchName === shipment.fromAmtBranch)
                  .map((c) => c.companyName);

                const toAmtCompanies = companies
                  .filter((c) => c.branchName === shipment.toAmtBranch)
                  .map((c) => c.companyName);

                const activePackagesList = packages.map((p) => p.packageName);

                return (
                  <tr
                    key={shipment.shipmentId}
                    className={`transition-colors border-l-2 ${
                      isDirty
                        ? "bg-emerald-950/10 border-emerald-500 hover:bg-emerald-950/20"
                        : hasWarnings
                        ? "bg-amber-955/5 border-amber-500/50 hover:bg-amber-955/10"
                        : "hover:bg-slate-850/20 border-transparent"
                    }`}
                  >
                    {/* Checkbox Select Cell */}
                    <td className="py-3 px-4 text-center align-middle w-10">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const newSelected = isSelected
                              ? selectedIds.filter((id) => id !== shipment.shipmentId)
                              : [...selectedIds, shipment.shipmentId];
                            onSelectRow?.(newSelected);
                          }}
                          className="rounded border-slate-700 bg-slate-950 text-violet-600 focus:ring-violet-500 cursor-pointer h-3.5 w-3.5"
                        />
                        {/* Hover warnings tooltip */}
                        {hasWarnings && (
                          <div className="relative group/warning select-none">
                            <span className="text-amber-500 cursor-help" title={warnings.join("\n")}>
                              ⚠️
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "date", "date")}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200 align-middle">
                      {renderCell(shipment, "vehicleNumber", "text")}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "fromAmtBranch", "select", branches.map((b) => b.branchName))}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "fromCompany", "select", fromAmtCompanies)}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "toAmtBranch", "select", branches.map((b) => b.branchName))}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "toCompany", "select", toAmtCompanies)}
                    </td>
                    {/* Pay Branch & Pay Company renders */}
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "paymentReceivingBranch", "select", ["From Company", "To Company"])}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "paymentCompany", "text")}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "packageType", "select", activePackagesList)}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "quantity", "text")}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "pricePerPiece", "number")}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {renderCell(shipment, "totalAmount", "number")}
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      {renderCell(shipment, "deliveryStatus", "badge")}
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      {renderCell(shipment, "paymentStatus", "badge")}
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      {shipment.imageId ? (
                        <button
                          onClick={() => onViewImage?.(shipment.imageId!, shipment.imageFileName || "register.jpg")}
                          className="px-2.5 py-1 bg-violet-950/40 border border-violet-900/50 hover:bg-violet-900/20 text-violet-400 hover:text-violet-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          title="View original register image"
                        >
                          🖼️ Image
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs font-semibold select-none">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-middle text-center">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => onDelete(shipment.shipmentId)}
                          className="p-1.5 bg-red-950/40 border border-red-900/50 hover:bg-red-900/20 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                          title="Delete Shipment"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
