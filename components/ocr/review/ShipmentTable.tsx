"use client";

import React from "react";
import type { OcrShipmentRow as Shipment } from "@/types/ocr";

export interface ShipmentTableProps {
  shipments: Shipment[];
  onFieldChange: (
    shipmentId: string,
    field: keyof Shipment,
    value: string
  ) => void;
  onAddRow: () => void;
  onInitiateRemove: (shipmentId: string) => void;
}

interface PaymentStatusDropdownProps {
  value: string;
  onChange: (val: string) => void;
}

const PAYMENT_OPTIONS = [
  {
    id: "Paid",
    label: "Paid",
    dotColor: "text-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-300",
    hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
    activeBg: "bg-emerald-50/90 dark:bg-emerald-950/50 font-semibold",
  },
  {
    id: "Pending",
    label: "Pending",
    dotColor: "text-amber-500",
    textColor: "text-amber-700 dark:text-amber-300",
    hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-950/40",
    activeBg: "bg-amber-50/90 dark:bg-amber-950/50 font-semibold",
  },
  {
    id: "Free",
    label: "Free",
    dotColor: "text-sky-500",
    textColor: "text-sky-700 dark:text-sky-300",
    hoverBg: "hover:bg-sky-50 dark:hover:bg-sky-950/40",
    activeBg: "bg-sky-50/90 dark:bg-sky-950/50 font-semibold",
  },
];

function PaymentStatusDropdown({ value, onChange }: PaymentStatusDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const currentVal = value || "Pending";
  const isPaid = currentVal === "Paid";
  const isFree = currentVal === "Free";

  React.useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center w-full min-w-[110px]" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between border rounded-md px-3 py-1 text-[13px] font-medium outline-none cursor-pointer transition-all shadow-2xs ${
          isPaid
            ? "border-emerald-300 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/60"
            : isFree
            ? "border-sky-300 dark:border-sky-800/80 text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100/60"
            : "border-[#fde68a] dark:border-amber-900/60 text-[#b45309] dark:text-amber-400 bg-[#fffbeb] dark:bg-amber-950/30 hover:bg-amber-100/60"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span
            className={`text-[10px] ${
              isPaid
                ? "text-emerald-500"
                : isFree
                ? "text-sky-500"
                : "text-amber-500"
            }`}
          >
            ●
          </span>
          <span>{currentVal}</span>
        </span>
        <svg
          className={`h-3 w-3 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          } ${
            isPaid
              ? "text-emerald-600 dark:text-emerald-400"
              : isFree
              ? "text-sky-600 dark:text-sky-400"
              : "text-[#b45309] dark:text-amber-400"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full min-w-[120px] bg-white dark:bg-[#202225] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
          {PAYMENT_OPTIONS.map((opt) => {
            const isSelected = currentVal === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer text-left ${
                  opt.textColor
                } ${isSelected ? opt.activeBg : opt.hoverBg}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`text-[9px] ${opt.dotColor}`}>●</span>
                  <span>{opt.label}</span>
                </span>
                {isSelected && (
                  <svg
                    className="h-3.5 w-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * ShipmentTable presentation component matching the exact enterprise design:
 * - Clean spreadsheet layout with subtle vertical & horizontal grid lines
 * - Two-line stacked column headers (CUSTOMER INVOICE, PACKAGE TYPE, PAYMENT STATUS)
 * - Seamless borderless inputs on valid rows with clear hover & focus states
 * - Distinct RED outlined box on invalid input fields (e.g. invalid quantity like '11 UNI')
 * - Red-highlighted From Company identifier and red trash icon on invalid rows
 * - Full-width warning banner positioned directly above the invalid row
 * - Custom elevated popover dropdown for Payment Status
 */
export default function ShipmentTable({
  shipments,
  onFieldChange,
  onAddRow,
  onInitiateRemove,
}: ShipmentTableProps) {
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const fromCompanyInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const [pendingFocusLastRow, setPendingFocusLastRow] = React.useState(false);

  // Auto-scroll to and focus the From Company input of the newly added row
  React.useEffect(() => {
    if (!pendingFocusLastRow || shipments.length === 0) return;

    const lastRow = shipments[shipments.length - 1];
    if (!lastRow) return;

    const timer = setTimeout(() => {
      // Scroll the table container down to the bottom
      if (tableScrollRef.current) {
        tableScrollRef.current.scrollTo({
          top: tableScrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }

      // Focus and ensure visibility of the From Company input
      const inputEl = fromCompanyInputRefs.current[lastRow.id];
      if (inputEl) {
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      setPendingFocusLastRow(false);
    }, 60);

    return () => clearTimeout(timer);
  }, [shipments, pendingFocusLastRow]);

  const handleAddRowClick = () => {
    setPendingFocusLastRow(true);
    onAddRow();
  };

  // Helper to detect if a specific field in a row is invalid
  const isFieldInvalid = (s: Shipment, field: keyof Shipment) => {
    if (s.isValid) return false;
    const errors = s.validationErrors || [];
    const errorText = errors.join(" ").toLowerCase();

    if (field === "quantity") {
      return (
        errorText.includes("quantity") ||
        s.quantity === null ||
        s.quantity === undefined ||
        s.quantity === ""
      );
    }
    if (field === "fromCompany") {
      return (
        !s.fromCompany ||
        s.fromCompany.trim() === "" ||
        errorText.includes("from company")
      );
    }
    if (field === "customerInvoice") {
      return (
        !s.customerInvoice ||
        s.customerInvoice.trim() === "" ||
        errorText.includes("customer invoice") ||
        errorText.includes("invoice")
      );
    }
    if (field === "toCompany") {
      return (
        !s.toCompany ||
        s.toCompany.trim() === "" ||
        errorText.includes("to company")
      );
    }
    if (field === "packageType") {
      return (
        !s.packageType ||
        s.packageType.trim() === "" ||
        errorText.includes("package")
      );
    }
    return false;
  };

  // Render a cell input
  const renderCellInput = (s: Shipment, field: keyof Shipment) => {
    const val = s[field];
    const stringVal = val === null || val === undefined ? "" : String(val);
    const invalid = isFieldInvalid(s, field);
    const isFromCompanyInInvalidRow = field === "fromCompany" && !s.isValid;

    return (
      <td className="py-2.5 px-3 align-middle border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">
        <div className="relative flex flex-col w-full">
          <input
            ref={
              field === "fromCompany"
                ? (el) => {
                    fromCompanyInputRefs.current[s.id] = el;
                  }
                : undefined
            }
            type="text"
            value={stringVal}
            onChange={(e) => onFieldChange(s.id, field, e.target.value)}
            placeholder={invalid ? "Required" : ""}
            className={`w-full text-[14px] leading-snug transition-all outline-none rounded-md px-2.5 py-1.5 ${
              invalid
                ? "border border-red-500 bg-white dark:bg-[#18191A] text-red-600 dark:text-red-400 font-semibold focus:border-red-600 focus:ring-1 focus:ring-red-500 shadow-2xs"
                : isFromCompanyInInvalidRow
                ? "bg-transparent border border-transparent text-[#b91c1c] dark:text-red-400 font-medium hover:border-slate-200 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-[#18191A] focus:border-[#0077c5] focus:ring-1 focus:ring-[#0077c5]"
                : "bg-transparent border border-transparent text-slate-800 dark:text-slate-100 font-normal hover:border-slate-200 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-[#18191A] focus:border-[#0077c5] focus:ring-1 focus:ring-[#0077c5]"
            }`}
          />
        </div>
      </td>
    );
  };

  const renderPaymentStatusCell = (s: Shipment) => {
    return (
      <td className="py-2.5 px-3 align-middle border-r border-slate-100 dark:border-slate-800/60">
        <PaymentStatusDropdown
          value={s.paymentStatus || "Pending"}
          onChange={(newVal) => onFieldChange(s.id, "paymentStatus", newVal)}
        />
      </td>
    );
  };

  return (
    <section className="bg-white dark:bg-[#242526] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs flex flex-col min-h-0 h-full overflow-hidden select-none">
      {/* Table Card Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Editable Shipment Table
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Edit cells and review extracted values
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddRowClick}
          className="px-3.5 py-1.5 bg-white dark:bg-[#18191A] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all hover:border-slate-300 active:scale-[0.98]"
        >
          <svg
            className="h-4 w-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add Row</span>
        </button>
      </div>

      {/* Responsive Table Scroll Container */}
      <div ref={tableScrollRef} className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider bg-[#f8fafc]/95 dark:bg-[#18191A]/95 sticky top-0 z-10 select-none">
              <th className="py-3 px-3.5 min-w-[140px] border-r border-slate-100 dark:border-slate-800/60 leading-tight">
                From Company
              </th>
              <th className="py-3 px-3 min-w-[110px] w-28 border-r border-slate-100 dark:border-slate-800/60 leading-tight">
                <div>Customer</div>
                <div>Invoice</div>
              </th>
              <th className="py-3 px-3.5 min-w-[140px] border-r border-slate-100 dark:border-slate-800/60 leading-tight">
                To Company
              </th>
              <th className="py-3 px-3 min-w-[110px] w-28 border-r border-slate-100 dark:border-slate-800/60 leading-tight">
                <div>Package</div>
                <div>Type</div>
              </th>
              <th className="py-3 px-3 min-w-[90px] w-24 border-r border-slate-100 dark:border-slate-800/60 leading-tight">
                Quantity
              </th>
              <th className="py-3 px-3 min-w-[125px] w-32 border-r border-slate-100 dark:border-slate-800/60 leading-tight">
                <div>Payment</div>
                <div>Status</div>
              </th>
              <th className="py-3 px-3 w-16 text-center leading-tight">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {shipments.map((s) => {
              return (
                <React.Fragment key={s.id}>
                  {/* Warning banner placed directly above the invalid row (matches reference image) */}
                  {!s.isValid && (
                    <tr className="bg-[#fef2f2] dark:bg-red-950/20 border-t border-b border-[#fee2e2] dark:border-red-900/30 select-none">
                      <td colSpan={7} className="py-1.5 px-4">
                        <div className="flex items-center gap-2 text-[12px] text-[#dc2626] dark:text-red-400 font-normal">
                          <svg
                            className="h-3.5 w-3.5 text-red-500 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>
                            Review Required:{" "}
                            {s.validationErrors.join(", ") ||
                              "Invalid format"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  <tr className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 group">
                    {renderCellInput(s, "fromCompany")}
                    {renderCellInput(s, "customerInvoice")}
                    {renderCellInput(s, "toCompany")}
                    {renderCellInput(s, "packageType")}
                    {renderCellInput(s, "quantity")}
                    {renderPaymentStatusCell(s)}

                    <td className="py-2.5 px-3 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => onInitiateRemove(s.id)}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center ${
                          !s.isValid
                            ? "text-[#ef4444] hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                            : "text-[#94a3b8] hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title="Remove Row"
                        aria-label="Remove Row"
                      >
                        <svg
                          className="h-4.5 w-4.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.75"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}


