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
    ? "border-2 border-amber-300 dark:border-amber-700 focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
    : isHighlighted
    ? "border-2 border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs transition-all duration-300"
    : "border-2 border-transparent hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-2xs focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 focus:shadow-sm focus:outline-none bg-transparent text-slate-800 dark:text-zinc-100 transition-all";

  const alignClass =
    field === "quantity" ||
    field === "pricePerPiece" ||
    field === "totalAmount" ||
    field === "transportRate" ||
    field === "pickupCharge" ||
    field === "deliveryCharge"
      ? "text-right font-mono tabular-nums"
      : "";

  if (isEditing) {
    if (field === "totalAmount") {
      return (
        <div
          id={`cell-${shipment.shipmentId}-${field}`}
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, shipment.shipmentId, field)}
          className={`w-full rounded-lg px-3 h-[36px] text-sm text-right font-mono tabular-nums font-medium flex items-center justify-end select-none outline-none ${borderClass}`}
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
            className={`w-full rounded-lg px-3 h-[36px] text-sm text-left cursor-pointer transition-colors flex items-center ${borderClass}`}
          >
            <span className={!val ? "text-slate-400 dark:text-zinc-500 font-normal" : "text-slate-800 dark:text-zinc-100 font-medium"}>{displayVal}</span>
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
            className={`w-full rounded-lg px-3 h-[36px] text-sm text-left cursor-pointer transition-all truncate flex items-center justify-between gap-1.5 ${
              isUnregistered
                ? "border-2 border-amber-300 dark:border-amber-700 focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 bg-amber-50/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 shadow-2xs"
                : isNoRate
                ? "border-2 border-rose-200 dark:border-rose-800 focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 bg-rose-50/70 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 shadow-2xs"
                : isHighlighted
                ? "border-2 border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs"
                : "border-2 border-transparent hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-2xs focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 focus:shadow-sm focus:outline-none bg-transparent text-slate-800 dark:text-zinc-100"
            }`}
            title={
              isUnregistered
                ? "Package is not registered in the Package Master."
                : isNoRate
                ? "Package has no rate configured for the selected route."
                : undefined
            }
          >
            <span className={`truncate ${val ? "text-slate-800 dark:text-zinc-100 font-medium" : "text-slate-400 dark:text-zinc-500 font-normal"}`}>
              {val || "Select..."}
            </span>
            {isUnregistered && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 select-none flex items-center gap-1">
                ⚠️ UNREGISTERED
              </span>
            )}
            {isNoRate && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0 select-none flex items-center gap-1">
                🚫 NO RATE
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
            className={`w-full rounded-lg px-3 h-[36px] text-sm text-left cursor-pointer transition-all truncate flex items-center justify-between gap-1.5 ${
              isUnregistered
                ? "border-2 border-amber-300 dark:border-amber-700 focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 bg-amber-50/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 shadow-2xs"
                : hasWarning
                ? "border-2 border-amber-300 dark:border-amber-700 focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 bg-amber-50/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 shadow-2xs"
                : isHighlighted
                ? "border-2 border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs"
                : "border-2 border-transparent hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-2xs focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 focus:shadow-sm focus:outline-none bg-transparent text-slate-800 dark:text-zinc-100"
            }`}
            title={isUnregistered ? "Company is not registered in this branch master-data." : undefined}
          >
            <span className={`truncate ${val ? "text-slate-800 dark:text-zinc-100 font-medium" : "text-slate-400 dark:text-zinc-500 font-normal"}`}>
              {val || "Select..."}
            </span>
            {isUnregistered && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 select-none flex items-center gap-1">
                ⚠️ UNREGISTERED
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
              placeholder="Select Payment Company..."
              warning={isUnregistered ? "Warning" : undefined}
              onClose={() => setEditingCell?.(null)}
              allowManualEntry={true}
              manualEntryPosition="top"
              options={payCompanyOptions}
            />
          </div>
        );
      } else {
        const resolvedText = getPaymentCompanyDisplayText({
          paymentCompany: val !== null && val !== undefined ? String(val) : "",
          paymentReceivingBranch: shipment.paymentReceivingBranch,
          fromAmtBranch: shipment.fromAmtBranch,
          toAmtBranch: shipment.toAmtBranch,
          branches,
          companies,
        });

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
            className={`w-full rounded-lg px-3 h-[36px] text-sm text-left cursor-pointer transition-all truncate flex items-center justify-between gap-1.5 ${
              isUnregistered
                ? "border-2 border-amber-300 dark:border-amber-700 focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 bg-amber-50/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 shadow-2xs"
                : isHighlighted
                ? "border-2 border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs"
                : "border-2 border-transparent hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-2xs focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 focus:shadow-sm focus:outline-none bg-transparent text-slate-800 dark:text-zinc-100"
            }`}
            title={isUnregistered ? "Company is not registered in this branch master-data." : undefined}
          >
            <span className={`truncate ${resolvedText ? "text-slate-800 dark:text-zinc-100 font-medium" : "text-slate-400 dark:text-zinc-500 font-normal"}`}>
              {resolvedText || "Select..."}
            </span>
            {isUnregistered && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 select-none flex items-center gap-1">
                ⚠️ UNREGISTERED
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
            className={`w-full rounded-lg px-3 h-[36px] text-sm text-left cursor-pointer transition-colors font-medium flex items-center ${borderClass}`}
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
            className={`w-full rounded-lg px-3 h-[36px] text-sm text-left cursor-pointer transition-colors font-medium flex items-center ${borderClass}`}
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
              className={`w-full rounded-lg px-3 h-[36px] text-sm text-left cursor-pointer transition-colors flex items-center ${borderClass}`}
            >
              <span className={val ? "text-slate-800 dark:text-zinc-100 font-medium" : "text-slate-400 dark:text-zinc-500 font-normal"}>{val || "Select..."}</span>
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
            className={`w-full rounded-lg px-3 h-[36px] text-sm outline-none transition-colors dark:[color-scheme:dark] ${borderClass}`}
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
            className={`w-full rounded-lg px-3 h-[36px] text-sm outline-none transition-colors ${borderClass} ${alignClass} ${
              isDisabled ? "opacity-50 bg-slate-100 dark:bg-zinc-800/50 cursor-not-allowed text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800" : ""
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
            className={`w-full rounded-lg px-3 h-[36px] text-sm outline-none transition-colors ${borderClass} ${alignClass}`}
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

    return <span className="text-sm text-slate-800 dark:text-zinc-100 font-normal truncate block">{resolvedText}</span>;
  }

  if (field === "paymentReceivingBranch") {
    const displayVal = val === "From Company" ? "From Branch" : val === "To Company" ? "To Branch" : "-";
    return <span className="text-sm text-slate-800 dark:text-zinc-100 font-normal truncate block">{displayVal}</span>;
  }

  switch (type) {
    case "badge":
      if (field === "deliveryStatus") {
        return (
          <span
            className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${getDeliveryStatusStyle(
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
            className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${getPaymentStatusStyle(
              val as any
            )}`}
          >
            {val}
          </span>
        );
      }
      return <span className="text-sm text-slate-800 dark:text-zinc-100">{String(val || "-")}</span>;
    case "number":
      return (
        <span className="font-mono tabular-nums text-slate-900 dark:text-zinc-100 font-medium text-sm text-right block">
          {val !== null && val !== undefined ? `₹${val.toLocaleString()}` : "-"}
        </span>
      );
    case "text":
    default:
      return (
        <span className={`text-sm text-slate-800 dark:text-zinc-100 font-normal ${alignClass ? "block text-right font-mono tabular-nums font-medium text-slate-900 dark:text-zinc-100" : "truncate block"}`}>
          {val !== null && val !== undefined ? String(val) : "-"}
        </span>
      );
  }
}
