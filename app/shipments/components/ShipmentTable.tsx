import React, { useState } from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import { EDITABLE_COLUMNS } from "./ShipmentWorkspace";
import SearchableSelect, { SearchableSelectOption } from "@/components/ui/SearchableSelect";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import { getFilteredPackageOptions, buildPackageOptionsList, getPackageBadgeStatus, isGlobalRoutePackage } from "@/utils/package-filter";

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
    if (!s.paymentCompany) warnings.push("Payment Company is required.");
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
    if (field === "paymentCompany" && !val) return true;
    if (field === "packageType" && !val) return true;
    if (field === "quantity") {
      const qtyVal = calculateQuantity(val);
      if (qtyVal <= 0) return true;
    }
    if (field === "pricePerPiece" && (val === null || val === undefined || val <= 0)) return true;
    return false;
  };

  const EDITABLE_FIELDS: Array<keyof ShipmentRecord> = [
    "date",
    "vehicleNumber",
    "fromAmtBranch",
    "fromCompany",
    "toAmtBranch",
    "toCompany",
    "packageType",
    "quantity",
    "pricePerPiece",
    "pickupService",
    "deliveryService",
    "paymentReceivingBranch",
    "paymentCompany",
    "paymentStatus",
    "deliveryStatus",
    "ourInvoiceNumber",
    "customerInvoiceNumber"
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, shipmentId: string, field: keyof ShipmentRecord) => {
    if (mode !== "spreadsheet") return;

    const rowIdx = shipments.findIndex((s) => s.shipmentId === shipmentId);
    const colIdx = EDITABLE_FIELDS.indexOf(field);

    if (rowIdx === -1 || colIdx === -1) return;

    let nextRowIdx = rowIdx;
    let nextColIdx = colIdx;
    let shouldPreventDefault = false;

    switch (e.key) {
      case "ArrowUp":
        nextRowIdx = Math.max(0, rowIdx - 1);
        shouldPreventDefault = true;
        break;
      case "ArrowDown":
        nextRowIdx = Math.min(shipments.length - 1, rowIdx + 1);
        shouldPreventDefault = true;
        break;
      case "ArrowLeft": {
        const targetInput = e.target as HTMLInputElement;
        const isStart = targetInput.selectionStart === 0 || targetInput.selectionStart === null;
        if (isStart || targetInput.tagName === "SELECT") {
          nextColIdx = Math.max(0, colIdx - 1);
          shouldPreventDefault = true;
        }
        break;
      }
      case "ArrowRight": {
        const targetInput = e.target as HTMLInputElement;
        const isEnd = targetInput.selectionEnd === (targetInput.value || "").length || targetInput.selectionEnd === null;
        if (isEnd || targetInput.tagName === "SELECT") {
          nextColIdx = Math.min(EDITABLE_FIELDS.length - 1, colIdx + 1);
          shouldPreventDefault = true;
        }
        break;
      }
      case "Tab":
        if (e.shiftKey) {
          if (colIdx === 0) {
            if (rowIdx > 0) {
              nextRowIdx = rowIdx - 1;
              nextColIdx = EDITABLE_FIELDS.length - 1;
            }
          } else {
            nextColIdx = colIdx - 1;
          }
        } else {
          if (colIdx === EDITABLE_FIELDS.length - 1) {
            if (rowIdx < shipments.length - 1) {
              nextRowIdx = rowIdx + 1;
              nextColIdx = 0;
            }
          } else {
            nextColIdx = colIdx + 1;
          }
        }
        shouldPreventDefault = true;
        break;
      case "Enter":
        if (e.shiftKey) {
          nextRowIdx = Math.max(0, rowIdx - 1);
        } else {
          nextRowIdx = Math.min(shipments.length - 1, rowIdx + 1);
        }
        shouldPreventDefault = true;
        break;
      default:
        return;
    }

    if (shouldPreventDefault) {
      e.preventDefault();
    }

    const nextField = EDITABLE_FIELDS[nextColIdx];
    const nextShipment = shipments[nextRowIdx];
    if (nextShipment && nextField) {
      const nextId = `cell-${nextShipment.shipmentId}-${nextField}`;
      setTimeout(() => {
        const nextEl = document.getElementById(nextId);
        if (nextEl) {
          nextEl.focus();
          if (nextEl instanceof HTMLInputElement) {
            nextEl.select();
          }
        }
      }, 0);
    }
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
      ? "border-amber-500/60 focus:border-amber-500 bg-amber-955/15 text-amber-255"
      : isHighlighted
      ? "border-emerald-500 bg-emerald-955/40 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all duration-300"
      : "border-slate-800 focus:border-violet-500 bg-slate-950 text-slate-200";

    const alignClass = (field === "quantity" || field === "pricePerPiece" || field === "totalAmount" || field === "transportRate" || field === "pickupCharge" || field === "deliveryCharge")
      ? "text-right font-mono"
      : "";

    if (isEditing) {
      if (field === "totalAmount" || field === "transportRate" || field === "pickupCharge" || field === "deliveryCharge") {
        return (
          <div
            id={`cell-${shipment.shipmentId}-${field}`}
            className="w-full border border-slate-850 bg-slate-950/40 text-slate-350 rounded-lg px-3.5 h-[42px] text-sm text-right font-mono flex items-center justify-end select-none"
          >
            {val !== null && val !== undefined ? `₹${val.toLocaleString()}` : "-"}
          </div>
        );
      }

      if (field === "fromAmtBranch") {
        return (
          <div className="w-full relative">
            <SearchableSelect
              id={`cell-${shipment.shipmentId}-${field}`}
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(newVal) => onChangeRow?.(shipment.shipmentId, field, newVal)}
              placeholder="Select Origin..."
              warning={hasWarning ? "Same branch selected" : undefined}
              options={branches.map((b) => ({
                value: b.branchName,
                label: b.branchName,
                disabled: b.branchName === shipment.toAmtBranch,
                disabledReason: "(Selected in To)",
              }))}
            />
          </div>
        );
      }

      if (field === "toAmtBranch") {
        return (
          <div className="w-full relative">
            <SearchableSelect
              id={`cell-${shipment.shipmentId}-${field}`}
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(newVal) => onChangeRow?.(shipment.shipmentId, field, newVal)}
              placeholder="Select Destination..."
              warning={hasWarning ? "Same branch selected" : undefined}
              options={branches.map((b) => ({
                value: b.branchName,
                label: b.branchName,
                disabled: b.branchName === shipment.fromAmtBranch,
                disabledReason: "(Selected in From)",
              }))}
            />
          </div>
        );
      }

      if (field === "paymentReceivingBranch") {
        return (
          <select
            id={`cell-${shipment.shipmentId}-${field}`}
            value={val !== null && val !== undefined ? String(val) : ""}
            onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, shipment.shipmentId, field)}
            data-shipment-id={shipment.shipmentId}
            data-field={field}
            className={`w-full border rounded-lg px-3.5 h-[42px] text-sm outline-none cursor-pointer transition-colors ${borderClass}`}
          >
            <option value="">Select...</option>
            <option value="From Company">From Branch</option>
            <option value="To Company">To Branch</option>
          </select>
        );
      }

      if (field === "packageType") {
        const isEditingCell = editingCell?.shipmentId === shipment.shipmentId && editingCell?.field === field;

        const badgeStatus = getPackageBadgeStatus(
          val !== null && val !== undefined ? String(val) : "",
          shipment.fromAmtBranch,
          shipment.toAmtBranch,
          shipment.paymentCompany,
          companyRouteRates,
          globalRouteRates,
          companies,
          branches,
          packages,
          shipment.paymentReceivingBranch
        );

        const isUnregistered = badgeStatus === "unregistered";
        const isNoRate = badgeStatus === "no-rate";

        if (isEditingCell) {
          const packageOptionsList = buildPackageOptionsList(
            val !== null && val !== undefined ? String(val) : "",
            shipment.fromAmtBranch,
            shipment.toAmtBranch,
            shipment.paymentCompany,
            companyRouteRates,
            globalRouteRates,
            companies,
            branches,
            packages,
            shipment.paymentReceivingBranch
          );

          return (
            <div className="w-full relative animate-fade-in">
              <SearchableSelect
                id={`cell-${shipment.shipmentId}-${field}`}
                value={val !== null && val !== undefined ? String(val) : ""}
                onChange={(newVal) => {
                  onChangeRow?.(shipment.shipmentId, field, newVal);
                  setEditingCell(null);
                }}
                placeholder="Select package..."
                onClose={() => setEditingCell(null)}
                options={packageOptionsList}
                allowManualEntry={true}
                noResultsText="No packages configured for this route."
                manualEntryLabel="Package Type"
                manualEntryPlaceholder="Enter manual package type..."
                manualEntryButtonText="Enter Package Manually"
              />
            </div>
          );
        } else {
          return (
            <div
              id={`cell-${shipment.shipmentId}-${field}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "F2") {
                  e.preventDefault();
                  setEditingCell({ shipmentId: shipment.shipmentId, field });
                } else {
                  handleKeyDown(e, shipment.shipmentId, field);
                }
              }}
              onClick={() => {
                setEditingCell({ shipmentId: shipment.shipmentId, field });
              }}
              className={`w-full border rounded-lg px-3.5 h-[42px] text-sm text-left cursor-pointer transition-all truncate flex items-center justify-between gap-1.5 ${
                isUnregistered
                  ? "border-amber-500/60 focus:border-amber-500 bg-amber-955/15 text-amber-250 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                  : isNoRate
                  ? "border-amber-500/60 focus:border-amber-500 bg-amber-955/15 text-amber-250"
                  : isHighlighted
                  ? "border-emerald-500 bg-emerald-955/40 text-emerald-200"
                  : "border-slate-800 focus:border-violet-500 bg-slate-950 text-slate-200 hover:border-slate-700"
              }`}
              title={
                isUnregistered
                  ? "Package is not registered in the Package Master."
                  : isNoRate
                  ? "Package has no rate configured for the selected route."
                  : undefined
              }
            >
              <span className="truncate font-semibold text-slate-200">{val || "Select..."}</span>
              {isUnregistered && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                  ⚠️ Unregistered
                </span>
              )}
              {isNoRate && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                  ⚠️ No Rate
                </span>
              )}
            </div>
          );
        }
      }

      if (field === "fromCompany" || field === "toCompany") {
        const isEditingCell = editingCell?.shipmentId === shipment.shipmentId && editingCell?.field === field;
        const isUnregistered = val && options && !options.includes(String(val));

        if (isEditingCell) {
          return (
            <div className="w-full relative animate-fade-in">
              <SearchableSelect
                id={`cell-${shipment.shipmentId}-${field}`}
                value={val !== null && val !== undefined ? String(val) : ""}
                onChange={(newVal) => {
                  onChangeRow?.(shipment.shipmentId, field, newVal);
                  setEditingCell(null);
                }}
                placeholder="Select Company..."
                warning={hasWarning || isUnregistered ? "Warning" : undefined}
                onClose={() => setEditingCell(null)}
                allowManualEntry={true}
                options={(() => {
                  const selectOptions: SearchableSelectOption[] = (options || []).map((o) => {
                    const targetBranchName = field === "fromCompany" ? shipment.fromAmtBranch : field === "toCompany" ? shipment.toAmtBranch : undefined;
                    const targetBranchObj = branches.find((b) => b.branchName?.trim().toLowerCase() === targetBranchName?.trim().toLowerCase());
                    const comp = companies.find((c) => 
                      c.companyName === o && 
                      (!targetBranchObj || c.branchId === targetBranchObj.branchId)
                    );
                    const display = comp?.displayName || o;
                    return {
                      value: o,
                      label: display,
                    };
                  });
                  if (isUnregistered) {
                    selectOptions.push({
                      value: String(val),
                      label: String(val),
                      badge: "Unregistered",
                      badgeType: "shipment" as any,
                    });
                  }
                  return selectOptions;
                })()}
              />
            </div>
          );
        } else {
          return (
            <div
              id={`cell-${shipment.shipmentId}-${field}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "F2") {
                  e.preventDefault();
                  setEditingCell({ shipmentId: shipment.shipmentId, field });
                } else {
                  handleKeyDown(e, shipment.shipmentId, field);
                }
              }}
              onClick={() => {
                setEditingCell({ shipmentId: shipment.shipmentId, field });
              }}
              className={`w-full border rounded-lg px-3.5 h-[42px] text-sm text-left cursor-pointer transition-all truncate flex items-center justify-between gap-1.5 ${
                isUnregistered
                  ? "border-amber-500/60 focus:border-amber-500 bg-amber-955/15 text-amber-250 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                  : hasWarning
                  ? "border-amber-500/60 focus:border-amber-500 bg-amber-955/15 text-amber-250"
                  : isHighlighted
                  ? "border-emerald-500 bg-emerald-955/40 text-emerald-200"
                  : "border-slate-800 focus:border-violet-500 bg-slate-950 text-slate-200 hover:border-slate-700"
              }`}
              title={isUnregistered ? "Company is not registered in this branch master-data." : undefined}
            >
              <span className="truncate font-semibold text-slate-200">{val || "Select..."}</span>
              {isUnregistered && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                  ⚠️ Unregistered
                </span>
              )}
            </div>
          );
        }
      }

      if (field === "paymentCompany") {
        const isEditingCell = editingCell?.shipmentId === shipment.shipmentId && editingCell?.field === field;
        
        // Find selected Pay Branch for this shipment row
        const payBranchName = shipment.paymentReceivingBranch === "From Company" ? shipment.fromAmtBranch : shipment.paymentReceivingBranch === "To Company" ? shipment.toAmtBranch : "";
        const payBranchObj = branches.find(b => b.branchName?.trim().toLowerCase() === payBranchName?.trim().toLowerCase());
        const payBranchId = payBranchObj?.branchId || "";
        const payBranchCode = payBranchObj?.branchCode || "";

        // Build options
        const payCompanyOptions: SearchableSelectOption[] = [];
        
        // 1. Current shipment company
        const curCompanyName = shipment.paymentReceivingBranch === "From Company" ? shipment.fromCompany : shipment.paymentReceivingBranch === "To Company" ? shipment.toCompany : "";
        if (curCompanyName) {
          let curCompanyLabel = curCompanyName;
          const curCompanyObj = companies.find(c => c.companyName === curCompanyName && c.branchId === payBranchId);
          if (curCompanyObj?.displayName) {
            curCompanyLabel = curCompanyObj.displayName;
          } else if (payBranchCode) {
            curCompanyLabel = `${curCompanyName} - ${payBranchCode}`;
          }
          
          payCompanyOptions.push({
            value: curCompanyName,
            label: curCompanyLabel,
          });
        }

        // 2. All registered companies for the selected Pay Branch only (filtering out the current company to avoid duplicates)
        const registeredCompanies = companies.filter(c => c.branchId === payBranchId);
        const otherCompanies = registeredCompanies.filter(c => c.companyName !== curCompanyName);
        
        if (curCompanyName && otherCompanies.length > 0) {
          payCompanyOptions.push({
            value: "divider-current",
            label: "",
            isDivider: true,
          });
        }

        otherCompanies.forEach(c => {
          payCompanyOptions.push({
            value: c.companyName,
            label: c.displayName || c.companyName,
          });
        });

        // 3. Current selected value if unregistered/manual
        const isCurrentMatch = curCompanyName && val === curCompanyName;
        const isInRegistered = registeredCompanies.some(c => c.companyName === val);
        const isUnregistered = val && !isCurrentMatch && !isInRegistered;

        if (isUnregistered) {
          payCompanyOptions.push({
            value: String(val),
            label: String(val),
            badge: "Unregistered",
            badgeType: "shipment" as any,
          });
        }

        if (isEditingCell) {
          return (
            <div className="w-full relative animate-fade-in">
              <SearchableSelect
                id={`cell-${shipment.shipmentId}-${field}`}
                value={val !== null && val !== undefined ? String(val) : ""}
                onChange={(newVal) => {
                  onChangeRow?.(shipment.shipmentId, field, newVal);
                  setEditingCell(null);
                }}
                placeholder="Select Pay Company..."
                warning={isUnregistered ? "Warning" : undefined}
                onClose={() => setEditingCell(null)}
                allowManualEntry={true}
                manualEntryPosition="top"
                options={payCompanyOptions}
              />
            </div>
          );
        } else {
          return (
            <div
              id={`cell-${shipment.shipmentId}-${field}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "F2") {
                  e.preventDefault();
                  setEditingCell({ shipmentId: shipment.shipmentId, field });
                } else {
                  handleKeyDown(e, shipment.shipmentId, field);
                }
              }}
              onClick={() => {
                setEditingCell({ shipmentId: shipment.shipmentId, field });
              }}
              className={`w-full border rounded-lg px-3.5 h-[42px] text-sm text-left cursor-pointer transition-all truncate flex items-center justify-between gap-1.5 ${
                isUnregistered
                  ? "border-amber-500/60 focus:border-amber-500 bg-amber-955/15 text-amber-250 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                  : isHighlighted
                  ? "border-emerald-500 bg-emerald-955/40 text-emerald-200"
                  : "border-slate-800 focus:border-violet-500 bg-slate-950 text-slate-200 hover:border-slate-700"
              }`}
              title={isUnregistered ? "Company is not registered in this branch master-data." : undefined}
            >
              <span className="truncate font-semibold text-slate-200">
                {(() => {
                  if (!val) return "Select...";
                  const compObj = companies.find(c => c.companyName === val && c.branchId === payBranchId);
                  return compObj?.displayName || (payBranchCode ? `${val} - ${payBranchCode}` : val);
                })()}
              </span>
              {isUnregistered && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                  ⚠️ Unregistered
                </span>
              )}
            </div>
          );
        }
      }

      if (field === "paymentStatus") {
        return (
          <select
            id={`cell-${shipment.shipmentId}-${field}`}
            value={val !== null && val !== undefined ? String(val) : "Pending"}
            onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, shipment.shipmentId, field)}
            data-shipment-id={shipment.shipmentId}
            data-field={field}
            className={`w-full border rounded-lg px-3.5 h-[42px] text-sm outline-none cursor-pointer transition-colors font-semibold ${borderClass}`}
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
            id={`cell-${shipment.shipmentId}-${field}`}
            value={val !== null && val !== undefined ? String(val) : "Not Delivered"}
            onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, shipment.shipmentId, field)}
            data-shipment-id={shipment.shipmentId}
            data-field={field}
            className={`w-full border rounded-lg px-3.5 h-[42px] text-sm outline-none cursor-pointer transition-colors font-semibold ${borderClass}`}
          >
            <option value="Not Delivered">Not Delivered</option>
            <option value="Delivered">Delivered</option>
            <option value="Missing">Missing</option>
            <option value="Damaged">Damaged</option>
          </select>
        );
      }

      switch (type) {
        case "select": {
          const isGlobal = isGlobalRoutePackage(
            shipment.packageType,
            shipment.fromAmtBranch,
            shipment.toAmtBranch,
            shipment.paymentCompany,
            companyRouteRates,
            globalRouteRates,
            companies,
            branches,
            shipment.paymentReceivingBranch
          );
          const isDisabled = isGlobal && (field === "pickupService" || field === "deliveryService");
          return (
            <select
              id={`cell-${shipment.shipmentId}-${field}`}
              value={isDisabled ? "Branch" : (val !== null && val !== undefined ? String(val) : "")}
              onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, shipment.shipmentId, field)}
              disabled={isDisabled}
              data-shipment-id={shipment.shipmentId}
              data-field={field}
              className={`w-full border rounded-lg px-3.5 h-[42px] text-sm outline-none transition-colors ${
                isDisabled ? "bg-slate-900/60 border-slate-800 text-slate-550 cursor-not-allowed opacity-60 pointer-events-none" : `${borderClass} cursor-pointer`
              }`}
            >
              <option value="">Select...</option>
              {options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );
        }
        case "date":
          return (
            <input
              id={`cell-${shipment.shipmentId}-${field}`}
              type="date"
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, shipment.shipmentId, field)}
              onFocus={(e) => e.target.select?.()}
              data-shipment-id={shipment.shipmentId}
              data-field={field}
              className={`w-full border rounded-lg px-3.5 h-[42px] text-sm outline-none transition-colors ${borderClass}`}
            />
          );
        case "number":
          return (
            <input
              id={`cell-${shipment.shipmentId}-${field}`}
              type="number"
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(e) => {
                const numVal = e.target.value === "" ? null : Number(e.target.value);
                onChangeRow?.(shipment.shipmentId, field, numVal);
              }}
              onKeyDown={(e) => handleKeyDown(e, shipment.shipmentId, field)}
              onFocus={(e) => e.target.select?.()}
              data-shipment-id={shipment.shipmentId}
              data-field={field}
              className={`w-full border rounded-lg px-3.5 h-[42px] text-sm outline-none transition-colors ${borderClass} ${alignClass}`}
            />
          );
        case "text":
        default:
          return (
            <input
              id={`cell-${shipment.shipmentId}-${field}`}
              type="text"
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(e) => onChangeRow?.(shipment.shipmentId, field, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, shipment.shipmentId, field)}
              onFocus={(e) => e.target.select?.()}
              data-shipment-id={shipment.shipmentId}
              data-field={field}
              className={`w-full border rounded-lg px-3.5 h-[42px] text-sm outline-none transition-colors ${borderClass} ${alignClass}`}
            />
          );
      }
    }

    // Read Mode
    if (field === "paymentCompany") {
      const payBranchName = shipment.paymentReceivingBranch === "From Company" ? shipment.fromAmtBranch : shipment.paymentReceivingBranch === "To Company" ? shipment.toAmtBranch : "";
      const payBranchObj = branches.find(b => b.branchName?.trim().toLowerCase() === payBranchName?.trim().toLowerCase());
      const payBranchId = payBranchObj?.branchId || "";
      const payBranchCode = payBranchObj?.branchCode || "";
      const compObj = companies.find(c => c.companyName === val && c.branchId === payBranchId);
      const resolvedText = compObj?.displayName || (payBranchCode ? `${val} - ${payBranchCode}` : String(val || "-"));

      return (
        <span className="text-xs text-slate-350">
          {resolvedText}
        </span>
      );
    }

    if (field === "paymentReceivingBranch") {
      const displayVal = val === "From Company" ? "From Branch" : val === "To Company" ? "To Branch" : "-";
      return (
        <span className="text-xs text-slate-350">
          {displayVal}
        </span>
      );
    }

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
            {val !== null && val !== undefined ? `₹${val.toLocaleString()}` : "-"}
          </span>
        );
      case "text":
      default:
        return (
          <span className={`text-xs text-slate-350 ${alignClass ? "block text-right" : ""}`}>
            {val !== null && val !== undefined ? String(val) : "-"}
          </span>
        );
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
    if (mode !== "spreadsheet") return;

    const target = e.target as HTMLElement;
    const startShipmentId = target.getAttribute("data-shipment-id");
    const startField = target.getAttribute("data-field") as keyof ShipmentRecord | null;

    if (!startShipmentId || !startField) return;

    const clipboardText = e.clipboardData.getData("text/plain");
    if (!clipboardText) return;

    e.preventDefault();

    // Split rows by newline and columns by tab
    const parsedRows = clipboardText.split(/\r?\n/).map((row) => row.split("\t"));
    
    // Remove the trailing empty row if it's empty (Excel often adds a trailing newline)
    if (
      parsedRows.length > 1 &&
      parsedRows[parsedRows.length - 1].length === 1 &&
      parsedRows[parsedRows.length - 1][0] === ""
    ) {
      parsedRows.pop();
    }

    const startRowIdx = shipments.findIndex((s) => s.shipmentId === startShipmentId);
    const startColIdx = EDITABLE_FIELDS.indexOf(startField);

    if (startRowIdx === -1 || startColIdx === -1) return;

    const updates: Record<string, Partial<ShipmentRecord>> = {};

    parsedRows.forEach((rowCells, rOffset) => {
      const targetRowIdx = startRowIdx + rOffset;
      if (targetRowIdx >= shipments.length) return;

      const targetShipment = shipments[targetRowIdx];
      const shipmentId = targetShipment.shipmentId;

      rowCells.forEach((cellVal, cOffset) => {
        const targetColIdx = startColIdx + cOffset;
        if (targetColIdx >= EDITABLE_FIELDS.length) return;

        const targetField = EDITABLE_FIELDS[targetColIdx];

        const cleanVal = cellVal.trim();
        let finalVal: any = cleanVal;

        // Field-specific parsing/conversions
        if (targetField === "pricePerPiece") {
          finalVal = cleanVal === "" ? null : Number(cleanVal);
          if (isNaN(finalVal)) finalVal = null;
        }

        if (!updates[shipmentId]) {
          updates[shipmentId] = {};
        }

        updates[shipmentId][targetField] = finalVal;
      });
    });

    if (Object.keys(updates).length > 0) {
      onBatchChangeRow?.(updates);
    }
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto overflow-y-auto max-h-[68vh] relative">
        <table 
          className="w-full text-left border-collapse min-w-[3400px]"
          onPaste={handlePaste}
        >
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
                  Vehicle <SortIcon colKey="vehicleNumber" />
                </div>
              </th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "130px", minWidth: "130px" }}>From Branch</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "240px", minWidth: "240px" }}>From Company</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "130px", minWidth: "130px" }}>To Branch</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "240px", minWidth: "240px" }}>To Company</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "200px", minWidth: "200px" }}>Package</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right border-b border-slate-800" style={{ width: "90px", minWidth: "90px" }}>Qty</th>
              <th onClick={() => onSort("transportRate")} className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer group select-none border-b border-slate-800 text-right" style={{ width: "120px", minWidth: "120px" }}>
                <div className="flex items-center justify-end gap-1.5">
                  Rate <SortIcon colKey="transportRate" />
                </div>
              </th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right border-b border-slate-800" style={{ width: "120px", minWidth: "120px" }}>Price</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "140px", minWidth: "140px" }}>Pickup Service</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right border-b border-slate-800" style={{ width: "120px", minWidth: "120px" }}>Pickup Charge</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "150px", minWidth: "150px" }}>Delivery Service</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right border-b border-slate-800" style={{ width: "120px", minWidth: "120px" }}>Delivery Charge</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-right border-b border-slate-800" style={{ width: "140px", minWidth: "140px" }}>Total</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "130px", minWidth: "130px" }}>Pay Branch</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800" style={{ width: "240px", minWidth: "240px" }}>Pay Company</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-center border-b border-slate-800" style={{ width: "120px", minWidth: "120px" }}>Payment</th>
              <th className="sticky top-0 bg-slate-950 z-20 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-center border-b border-slate-800" style={{ width: "140px", minWidth: "140px" }}>Delivery</th>
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
              <th className="sticky right-0 top-0 bg-slate-950 z-30 py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none text-center border-b border-slate-800 border-l border-slate-800 shadow-[-4px_0_12px_rgba(0,0,0,0.5)]" style={{ width: "120px", minWidth: "120px" }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="border-b border-slate-850/60 h-[50px] bg-slate-950/10">
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-4 mx-auto animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-16 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-20 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-24 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-28 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-24 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-28 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-20 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-8 ml-auto animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-12 ml-auto animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-12 ml-auto animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-20 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-12 ml-auto animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-20 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-12 ml-auto animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-14 ml-auto animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-24 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-28 animate-pulse"></div></td>
                  <td className="p-4 text-center"><div className="h-5 bg-slate-800/40 rounded-full w-16 mx-auto animate-pulse"></div></td>
                  <td className="p-4 text-center"><div className="h-5 bg-slate-800/40 rounded-full w-16 mx-auto animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-16 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-800/40 rounded w-16 animate-pulse"></div></td>
                  <td className="sticky right-0 bg-slate-950/90 backdrop-blur-sm p-4 border-l border-slate-800 text-center"><div className="h-8 bg-slate-800/40 rounded w-20 mx-auto animate-pulse"></div></td>
                </tr>
              ))
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={23} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-800/40 flex items-center justify-center text-slate-500 border border-slate-750">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m15 3.5v-2m-3-1v2m-3-2v2M9 21h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-350">{emptyStateMessage}</p>
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
                const fromBranchObj = branches.find(
                  (b) => b.branchName?.trim().toLowerCase() === shipment.fromAmtBranch?.trim().toLowerCase()
                );
                const fromAmtCompanies = companies
                  .filter((c) => fromBranchObj && c.branchId === fromBranchObj.branchId)
                  .map((c) => c.companyName);

                const toBranchObj = branches.find(
                  (b) => b.branchName?.trim().toLowerCase() === shipment.toAmtBranch?.trim().toLowerCase()
                );
                const toAmtCompanies = companies
                  .filter((c) => toBranchObj && c.branchId === toBranchObj.branchId)
                  .map((c) => c.companyName);

                const activePackagesList = packages.map((p) => p.packageName);

                return (
                  <tr
                    key={shipment.shipmentId}
                    title={hasWarnings ? `Validation issues:\n${warnings.join("\n")}` : undefined}
                    className={`transition-colors border-l-2 h-[50px] ${
                      isDirty
                        ? "bg-emerald-950/10 border-emerald-500 hover:bg-emerald-950/20"
                        : hasWarnings
                        ? "bg-amber-955/5 border-amber-500/50 hover:bg-amber-955/10"
                        : "hover:bg-slate-800/30 border-transparent"
                    }`}
                  >
                    {/* Checkbox Select Cell */}
                    <td className="py-[4px] px-3 text-center align-middle w-[50px]" style={{ width: "50px", minWidth: "50px" }}>
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
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "110px", minWidth: "110px" }}>
                      {renderCell(shipment, "date", "date")}
                    </td>
                    <td className="py-[4px] px-3 font-semibold text-slate-200 align-middle" style={{ width: "110px", minWidth: "110px" }}>
                      {renderCell(shipment, "vehicleNumber", "text")}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "130px", minWidth: "130px" }}>
                      {renderCell(shipment, "fromAmtBranch", "select", branches.map((b) => b.branchName))}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "240px", minWidth: "240px" }}>
                      {renderCell(shipment, "fromCompany", "select", fromAmtCompanies)}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "130px", minWidth: "130px" }}>
                      {renderCell(shipment, "toAmtBranch", "select", branches.map((b) => b.branchName))}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "240px", minWidth: "240px" }}>
                      {renderCell(shipment, "toCompany", "select", toAmtCompanies)}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "200px", minWidth: "200px" }}>
                      {renderCell(shipment, "packageType", "select", activePackagesList)}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "90px", minWidth: "90px" }}>
                      {renderCell(shipment, "quantity", "text")}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "120px", minWidth: "120px" }}>
                      {renderCell(shipment, "transportRate", "number")}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "120px", minWidth: "120px" }}>
                      {renderCell(shipment, "pricePerPiece", "number")}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "140px", minWidth: "140px" }}>
                      {renderCell(shipment, "pickupService", "select", ["Branch", "Home", "Free Home"])}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "120px", minWidth: "120px" }}>
                      {renderCell(shipment, "pickupCharge", "number")}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "150px", minWidth: "150px" }}>
                      {renderCell(shipment, "deliveryService", "select", ["Branch", "Home", "Free Home"])}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "120px", minWidth: "120px" }}>
                      {renderCell(shipment, "deliveryCharge", "number")}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "140px", minWidth: "140px" }}>
                      {renderCell(shipment, "totalAmount", "number")}
                    </td>
                    {/* Pay Branch & Pay Company renders */}
                    <td className="py-[4px] px-3 align-middle" style={{ width: "130px", minWidth: "130px" }}>
                      {renderCell(shipment, "paymentReceivingBranch", "select", ["From Company", "To Company"])}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "240px", minWidth: "240px" }}>
                      {renderCell(
                        shipment,
                        "paymentCompany",
                        "select",
                        Array.from(new Set(companies.map((c) => c.companyName)))
                      )}
                    </td>
                    <td className="py-[4px] px-3 text-center align-middle" style={{ width: "120px", minWidth: "120px" }}>
                      {renderCell(shipment, "paymentStatus", "badge")}
                    </td>
                    <td className="py-[4px] px-3 text-center align-middle" style={{ width: "140px", minWidth: "140px" }}>
                      {renderCell(shipment, "deliveryStatus", "badge")}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "130px", minWidth: "130px" }}>
                      {renderCell(shipment, "ourInvoiceNumber", "text")}
                    </td>
                    <td className="py-[4px] px-3 align-middle" style={{ width: "150px", minWidth: "150px" }}>
                      {renderCell(shipment, "customerInvoiceNumber", "text")}
                    </td>
                    <td className="sticky right-0 bg-slate-955/95 backdrop-blur-sm py-[4px] px-3 align-middle text-center border-l border-slate-800 z-10 shadow-[-4px_0_12px_rgba(0,0,0,0.5)]" style={{ width: "120px", minWidth: "120px" }}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onPreviewShipment?.(shipment)}
                          className="p-1.5 bg-slate-800 border border-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Preview Shipment"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditShipment?.(shipment)}
                          className="p-1.5 bg-violet-900/40 border border-violet-800/50 hover:bg-violet-800/20 text-violet-450 hover:text-violet-350 rounded-lg transition-colors cursor-pointer"
                          title="Edit Shipment"
                        >
                          ✏️
                        </button>
                        {shipment.imageId ? (
                          <button
                            type="button"
                            onClick={() => onViewImage?.(shipment.imageId!, shipment.imageFileName || "register.jpg")}
                            className="p-1.5 bg-blue-950/40 border border-blue-900/50 hover:bg-blue-900/20 text-blue-400 hover:text-blue-300 rounded-lg transition-colors cursor-pointer"
                            title="View Register Image"
                          >
                            🖼️
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="p-1.5 bg-slate-950/40 border border-slate-850/40 text-slate-650 rounded-lg cursor-not-allowed"
                            title="No register image"
                          >
                            🖼️
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(shipment.shipmentId)}
                          className="p-1.5 bg-red-950/40 border border-red-900/50 hover:bg-red-900/20 text-red-400 hover:text-red-350 rounded-lg transition-colors cursor-pointer"
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
