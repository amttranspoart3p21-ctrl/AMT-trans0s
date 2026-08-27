import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import { PAYMENT_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import SearchableSelect, { SearchableSelectOption } from "@/components/ui/SearchableSelect";
import { isFieldWarning } from "../../utils/shipmentValidation";
import { buildPaymentCompanyOptions, getPaymentCompanyDisplayText } from "../../utils/paymentCompanyOptions";
import { getDeliveryStatusStyle, getPaymentStatusStyle } from "../../utils/shipmentStatusStyles";
import { buildPackageOptionsList, getPackageBadgeStatus } from "@/utils/package-filter";

export interface ShipmentTableCellProps {
  shipment: ShipmentRecord;
  field: keyof ShipmentRecord;
  type: "text" | "badge" | "number" | "select" | "date";
  options?: string[];
  mode?: "read-only" | "spreadsheet";
  branches?: Branch[];
  companies?: Company[];
  packages?: Package[];
  companyRouteRates?: CompanyRouteRate[];
  globalRouteRates?: GlobalRouteRate[];
  highlightedCells?: Record<string, Set<string>>;
  editingCell?: { shipmentId: string; field: string } | null;
  setEditingCell?: (cell: { shipmentId: string; field: string } | null) => void;
  onChangeRow?: (shipmentId: string, field: keyof ShipmentRecord, value: any) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, shipmentId: string, field: keyof ShipmentRecord) => void;
}

export default function ShipmentTableCell({
  shipment,
  field,
  type,
  options,
  mode = "read-only",
  branches = [],
  companies = [],
  packages = [],
  companyRouteRates = [],
  globalRouteRates = [],
  highlightedCells = {},
  editingCell = null,
  setEditingCell,
  onChangeRow,
  handleKeyDown,
}: ShipmentTableCellProps) {
  const isEditing = mode === "spreadsheet";
  const val = shipment[field];

  const hasWarning = isEditing && isFieldWarning(field, val, shipment);
  const isHighlighted = highlightedCells[shipment.shipmentId]?.has(String(field));

  const borderClass = hasWarning
    ? "border-amber-500/60 focus:border-amber-500 bg-amber-955/15 text-amber-255"
    : isHighlighted
    ? "border-emerald-500 bg-emerald-955/40 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all duration-300"
    : "border-slate-800 focus:border-violet-500 bg-slate-950 text-slate-200";

  const alignClass =
    field === "quantity" ||
    field === "pricePerPiece" ||
    field === "totalAmount" ||
    field === "transportRate" ||
    field === "pickupCharge" ||
    field === "deliveryCharge"
      ? "text-right font-mono"
      : "";

  if (isEditing) {
    if (field === "totalAmount") {
      return (
        <div
          id={`cell-${shipment.shipmentId}-${field}`}
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, shipment.shipmentId, field)}
          className={`w-full border rounded-lg px-3.5 h-[42px] text-sm text-right font-mono flex items-center justify-end select-none outline-none ${borderClass} bg-slate-950/40 text-slate-350`}
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
      const isEditingCell = editingCell?.shipmentId === shipment.shipmentId && editingCell?.field === field;
      if (isEditingCell) {
        return (
          <div className="w-full relative animate-fade-in">
            <SearchableSelect
              id={`cell-${shipment.shipmentId}-${field}`}
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(newVal) => {
                onChangeRow?.(shipment.shipmentId, field, newVal);
                setEditingCell?.(null);
              }}
              onClose={() => setEditingCell?.(null)}
              options={[
                { value: "From Company", label: "From Branch" },
                { value: "To Company", label: "To Branch" },
              ]}
              hideClearOption={false}
            />
          </div>
        );
      } else {
        const displayVal = val === "From Company" ? "From Branch" : val === "To Company" ? "To Branch" : "Select...";
        return (
          <div
            id={`cell-${shipment.shipmentId}-${field}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "F2") {
                e.preventDefault();
                setEditingCell?.({ shipmentId: shipment.shipmentId, field });
              } else {
                handleKeyDown(e, shipment.shipmentId, field);
              }
            }}
            onClick={() => setEditingCell?.({ shipmentId: shipment.shipmentId, field })}
            className={`w-full border rounded-lg px-3.5 h-[42px] text-sm text-left cursor-pointer transition-colors flex items-center ${borderClass}`}
          >
            <span className={!val ? "text-slate-500" : ""}>{displayVal}</span>
          </div>
        );
      }
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
                setEditingCell?.(null);
              }}
              placeholder="Select package..."
              onClose={() => setEditingCell?.(null)}
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
                setEditingCell?.({ shipmentId: shipment.shipmentId, field });
              } else {
                handleKeyDown(e, shipment.shipmentId, field);
              }
            }}
            onClick={() => {
              setEditingCell?.({ shipmentId: shipment.shipmentId, field });
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
                setEditingCell?.(null);
              }}
              placeholder="Select Company..."
              warning={hasWarning || isUnregistered ? "Warning" : undefined}
              onClose={() => setEditingCell?.(null)}
              allowManualEntry={true}
              options={(() => {
                const selectOptions: SearchableSelectOption[] = (options || []).map((o) => {
                  const targetBranchName =
                    field === "fromCompany" ? shipment.fromAmtBranch : field === "toCompany" ? shipment.toAmtBranch : undefined;
                  const targetBranchObj = branches.find(
                    (b) => b.branchName?.trim().toLowerCase() === targetBranchName?.trim().toLowerCase()
                  );
                  const comp = companies.find(
                    (c) => c.companyName === o && (!targetBranchObj || c.branchId === targetBranchObj.branchId)
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
                setEditingCell?.({ shipmentId: shipment.shipmentId, field });
              } else {
                handleKeyDown(e, shipment.shipmentId, field);
              }
            }}
            onClick={() => {
              setEditingCell?.({ shipmentId: shipment.shipmentId, field });
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

      const payCompanyOptions = buildPaymentCompanyOptions({
        paymentReceivingBranch: shipment.paymentReceivingBranch,
        fromAmtBranch: shipment.fromAmtBranch,
        toAmtBranch: shipment.toAmtBranch,
        fromCompany: shipment.fromCompany,
        toCompany: shipment.toCompany,
        currentPaymentCompany: val !== null && val !== undefined ? String(val) : "",
        branches,
        companies,
      });
      const isUnregistered = payCompanyOptions.some((opt) => opt.value === String(val) && opt.badge === "Unregistered");

      if (isEditingCell) {
        return (
          <div className="w-full relative animate-fade-in">
            <SearchableSelect
              id={`cell-${shipment.shipmentId}-${field}`}
              value={val !== null && val !== undefined ? String(val) : ""}
              onChange={(newVal) => {
                onChangeRow?.(shipment.shipmentId, field, newVal);
                setEditingCell?.(null);
              }}
              placeholder="Select Pay Company..."
              warning={isUnregistered ? "Warning" : undefined}
              onClose={() => setEditingCell?.(null)}
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
                setEditingCell?.({ shipmentId: shipment.shipmentId, field });
              } else {
                handleKeyDown(e, shipment.shipmentId, field);
              }
            }}
            onClick={() => {
              setEditingCell?.({ shipmentId: shipment.shipmentId, field });
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
              {getPaymentCompanyDisplayText({
                paymentCompany: val !== null && val !== undefined ? String(val) : "",
                paymentReceivingBranch: shipment.paymentReceivingBranch,
                fromAmtBranch: shipment.fromAmtBranch,
                toAmtBranch: shipment.toAmtBranch,
                branches,
                companies,
              })}
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
      const isEditingCell = editingCell?.shipmentId === shipment.shipmentId && editingCell?.field === field;
      if (isEditingCell) {
        return (
          <div className="w-full relative animate-fade-in">
            <SearchableSelect
              id={`cell-${shipment.shipmentId}-${field}`}
              value={val !== null && val !== undefined ? String(val) : "Pending"}
              onChange={(newVal) => {
                onChangeRow?.(shipment.shipmentId, field, newVal);
                setEditingCell?.(null);
              }}
              onClose={() => setEditingCell?.(null)}
              options={PAYMENT_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              hideClearOption
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
                setEditingCell?.({ shipmentId: shipment.shipmentId, field });
              } else {
                handleKeyDown(e, shipment.shipmentId, field);
              }
            }}
            onClick={() => setEditingCell?.({ shipmentId: shipment.shipmentId, field })}
            className={`w-full border rounded-lg px-3.5 h-[42px] text-sm text-left cursor-pointer transition-colors font-semibold flex items-center ${borderClass}`}
          >
            {val || "Pending"}
          </div>
        );
      }
    }

    if (field === "deliveryStatus") {
      const isEditingCell = editingCell?.shipmentId === shipment.shipmentId && editingCell?.field === field;
      if (isEditingCell) {
        return (
          <div className="w-full relative animate-fade-in">
            <SearchableSelect
              id={`cell-${shipment.shipmentId}-${field}`}
              value={val !== null && val !== undefined ? String(val) : "Not Delivered"}
              onChange={(newVal) => {
                onChangeRow?.(shipment.shipmentId, field, newVal);
                setEditingCell?.(null);
              }}
              onClose={() => setEditingCell?.(null)}
              options={DELIVERY_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              hideClearOption
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
                setEditingCell?.({ shipmentId: shipment.shipmentId, field });
              } else {
                handleKeyDown(e, shipment.shipmentId, field);
              }
            }}
            onClick={() => setEditingCell?.({ shipmentId: shipment.shipmentId, field })}
            className={`w-full border rounded-lg px-3.5 h-[42px] text-sm text-left cursor-pointer transition-colors font-semibold flex items-center ${borderClass}`}
          >
            {val || "Not Delivered"}
          </div>
        );
      }
    }

    switch (type) {
      case "select": {
        const isEditingCell = editingCell?.shipmentId === shipment.shipmentId && editingCell?.field === field;
        if (isEditingCell) {
          return (
            <div className="w-full relative animate-fade-in">
              <SearchableSelect
                id={`cell-${shipment.shipmentId}-${field}`}
                value={val !== null && val !== undefined ? String(val) : ""}
                onChange={(newVal) => {
                  onChangeRow?.(shipment.shipmentId, field, newVal);
                  setEditingCell?.(null);
                }}
                onClose={() => setEditingCell?.(null)}
                options={(options || []).filter((opt) => opt !== "").map((opt) => ({ value: opt, label: opt }))}
                hideClearOption={!(options || []).includes("")}
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
                  setEditingCell?.({ shipmentId: shipment.shipmentId, field });
                } else {
                  handleKeyDown(e, shipment.shipmentId, field);
                }
              }}
              onClick={() => setEditingCell?.({ shipmentId: shipment.shipmentId, field })}
              className={`w-full border rounded-lg px-3.5 h-[42px] text-sm text-left cursor-pointer transition-colors flex items-center ${borderClass}`}
            >
              {val || "Select..."}
            </div>
          );
        }
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
      case "number": {
        const isPickupDisabled = field === "pickupCharge" && shipment.pickupService !== "Home";
        const isDeliveryDisabled = field === "deliveryCharge" && shipment.deliveryService !== "Home";
        const isDisabled = isPickupDisabled || isDeliveryDisabled;

        return (
          <input
            id={`cell-${shipment.shipmentId}-${field}`}
            type="number"
            value={val !== null && val !== undefined ? String(val) : isDisabled ? "0" : ""}
            disabled={isDisabled}
            onChange={(e) => {
              const numVal = e.target.value === "" ? null : Number(e.target.value);
              onChangeRow?.(shipment.shipmentId, field, numVal);
            }}
            onKeyDown={(e) => handleKeyDown(e, shipment.shipmentId, field)}
            onFocus={(e) => e.target.select?.()}
            data-shipment-id={shipment.shipmentId}
            data-field={field}
            className={`w-full border rounded-lg px-3.5 h-[42px] text-sm outline-none transition-colors ${borderClass} ${alignClass} ${
              isDisabled ? "opacity-50 bg-slate-900/80 cursor-not-allowed text-slate-500 border-slate-850" : ""
            }`}
          />
        );
      }
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
    const resolvedText = getPaymentCompanyDisplayText({
      paymentCompany: val !== null && val !== undefined ? String(val) : "",
      paymentReceivingBranch: shipment.paymentReceivingBranch,
      fromAmtBranch: shipment.fromAmtBranch,
      toAmtBranch: shipment.toAmtBranch,
      branches,
      companies,
    });

    return <span className="text-xs text-slate-350">{resolvedText}</span>;
  }

  if (field === "paymentReceivingBranch") {
    const displayVal = val === "From Company" ? "From Branch" : val === "To Company" ? "To Branch" : "-";
    return <span className="text-xs text-slate-350">{displayVal}</span>;
  }

  switch (type) {
    case "badge":
      if (field === "deliveryStatus") {
        return (
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${getDeliveryStatusStyle(
              val as any
            )}`}
          >
            {val}
          </span>
        );
      }
      if (field === "paymentStatus") {
        return (
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${getPaymentStatusStyle(
              val as any
            )}`}
          >
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
}
