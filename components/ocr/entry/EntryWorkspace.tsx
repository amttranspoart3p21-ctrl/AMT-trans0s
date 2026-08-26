"use client";

import React, { useRef } from "react";
import type { Branch } from "@/types/branch";
import type { OcrMetadata, EntryMode } from "@/types/ocr";
import SearchableSelect from "@/components/ui/SearchableSelect";

export interface EntryWorkspaceProps {
  entryMode: EntryMode;
  onSelectEntryMode: (mode: EntryMode) => void;
  metadata: OcrMetadata;
  onMetadataChange: (updated: OcrMetadata) => void;
  branches: Branch[];
  isBranchSelectionValid: boolean;
  uploadFile: File | null;
  uploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  loadingStep: string;
  errorMsg: string;
  onRunOCR: () => void;
  onStartManualEntry: () => void;
}

/**
 * EntryWorkspace UI component representing the initial entry screen:
 * - 100% Light Enterprise Theme matching target design Image 2
 * - Seamless Dark Mode support matching #18191A / #242526 theme
 * - Mode selection segmented control (OCR Upload vs Manual Entry)
 * - Step 1: Shipment Information Form (Date, Invoices, Vehicle, From/To branches)
 * - Step 2: Register image upload drag-and-drop zone & OCR runner / Manual Entry
 */
export default function EntryWorkspace({
  entryMode,
  onSelectEntryMode,
  metadata,
  onMetadataChange,
  branches,
  isBranchSelectionValid,
  uploadFile,
  uploading,
  onFileChange,
  loading,
  loadingStep,
  errorMsg,
  onRunOCR,
  onStartManualEntry,
}: EntryWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formErrors, setFormErrors] = React.useState<{
    date?: string;
    ourInvoiceNumber?: string;
    vehicleNumber?: string;
    fromAmtBranch?: string;
    toAmtBranch?: string;
    image?: string;
  }>({});

  // Helper to validate form and highlight missing inputs
  const validateForm = (checkImage = true): boolean => {
    const errors: {
      date?: string;
      ourInvoiceNumber?: string;
      vehicleNumber?: string;
      fromAmtBranch?: string;
      toAmtBranch?: string;
      image?: string;
    } = {};

    if (!metadata.date || metadata.date.trim() === "") {
      errors.date = "Date is required";
    }
    if (!metadata.ourInvoiceNumber || metadata.ourInvoiceNumber.trim() === "") {
      errors.ourInvoiceNumber = "Invoice number is required";
    }
    if (!metadata.vehicleNumber || metadata.vehicleNumber.trim() === "") {
      errors.vehicleNumber = "Vehicle number is required";
    }
    if (!metadata.fromAmtBranch || metadata.fromAmtBranch.trim() === "") {
      errors.fromAmtBranch = "From branch is required";
    }
    if (!metadata.toAmtBranch || metadata.toAmtBranch.trim() === "") {
      errors.toAmtBranch = "To branch is required";
    } else if (
      metadata.fromAmtBranch &&
      metadata.toAmtBranch &&
      metadata.fromAmtBranch.trim().toLowerCase() ===
        metadata.toAmtBranch.trim().toLowerCase()
    ) {
      errors.toAmtBranch = "Cannot be same as From branch";
    }

    if (checkImage && entryMode === "ocr" && !uploadFile) {
      errors.image = "Register image is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMetadataFieldChange = (
    field: keyof OcrMetadata,
    value: string
  ) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    onMetadataChange({ ...metadata, [field]: value });
  };

  const handleUploadBoxClick = () => {
    const isValid = validateForm(false);
    if (!isValid) return;
    fileInputRef.current?.click();
  };

  const handleProceedClick = () => {
    const isValid = validateForm(true);
    if (!isValid) return;
    onRunOCR();
  };

  const handleManualEntryClick = () => {
    const isValid = validateForm(false);
    if (!isValid) return;
    onStartManualEntry();
  };

  return (
    <div className="min-h-full w-full bg-[#F0F7FF] dark:bg-[#18191A] text-slate-800 dark:text-slate-100 p-6 md:p-8 select-none flex flex-col items-center">
      <div className="w-full">
        {/* Top Mode Switcher */}
        <div className="flex items-center mb-6">
          <div className="inline-flex bg-white dark:bg-[#242526] border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setFormErrors({});
                onSelectEntryMode("ocr");
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                entryMode === "ocr"
                  ? "bg-[#0077c5] hover:bg-[#006bb2] text-white shadow-2xs"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M3 17v2a2 2 0 0 1 2 2h2" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>OCR Upload</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormErrors({});
                onSelectEntryMode("manual");
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                entryMode === "manual"
                  ? "bg-[#0077c5] hover:bg-[#006bb2] text-white shadow-2xs"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span>Manual Entry</span>
            </button>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Step 1: Shipment Information Form */}
          <section className="lg:col-span-7 bg-white dark:bg-[#242526] border border-slate-200/90 dark:border-slate-800 p-6 rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#e8f3fa] dark:bg-[#0077c5]/20 text-[#0077c5] dark:text-[#38bdf8] text-xs font-bold shrink-0">
                  1
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
                    Shipment Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Enter details that apply to the entire register sheet.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 my-5" />

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Register Date
                    </label>
                    <input
                      type="date"
                      value={metadata.date}
                      onChange={(e) =>
                        handleMetadataFieldChange("date", e.target.value)
                      }
                      className={`w-full bg-white dark:bg-[#18191A] border rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none transition-all cursor-pointer ${
                        formErrors.date
                          ? "border-red-500 bg-red-50/30 dark:bg-red-950/20 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-[#0077c5] focus:border-[#0077c5]"
                      }`}
                    />
                    {formErrors.date && (
                      <span className="text-[10px] text-red-500 font-medium leading-none">
                        {formErrors.date}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Transport Invoice Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TX-49502"
                      value={metadata.ourInvoiceNumber}
                      onChange={(e) =>
                        handleMetadataFieldChange(
                          "ourInvoiceNumber",
                          e.target.value
                        )
                      }
                      className={`w-full bg-white dark:bg-[#18191A] border rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all ${
                        formErrors.ourInvoiceNumber
                          ? "border-red-500 bg-red-50/30 dark:bg-red-950/20 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-[#0077c5] focus:border-[#0077c5]"
                      }`}
                    />
                    {formErrors.ourInvoiceNumber && (
                      <span className="text-[10px] text-red-500 font-medium leading-none">
                        {formErrors.ourInvoiceNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TN23 L4495"
                    value={metadata.vehicleNumber}
                    onChange={(e) =>
                      handleMetadataFieldChange(
                        "vehicleNumber",
                        e.target.value
                      )
                    }
                    className={`w-full bg-white dark:bg-[#18191A] border rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all ${
                      formErrors.vehicleNumber
                        ? "border-red-500 bg-red-50/30 dark:bg-red-950/20 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-[#0077c5] focus:border-[#0077c5]"
                    }`}
                  />
                  {formErrors.vehicleNumber && (
                    <span className="text-[10px] text-red-500 font-medium leading-none">
                      {formErrors.vehicleNumber}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      From Branch
                    </label>
                    <SearchableSelect
                      value={metadata.fromAmtBranch}
                      onChange={(val) =>
                        handleMetadataFieldChange("fromAmtBranch", val)
                      }
                      placeholder="Select Origin Branch"
                      className={`!bg-white dark:!bg-[#18191A] !text-slate-900 dark:!text-slate-100 !h-[38px] !text-xs !rounded-lg ${
                        formErrors.fromAmtBranch
                          ? "!border-red-500 focus:!ring-1 focus:!ring-red-500 focus:!border-red-500"
                          : "!border-slate-200 dark:!border-slate-700 focus:!ring-1 focus:!ring-[#0077c5] focus:!border-[#0077c5]"
                      }`}
                      options={branches.map((b) => ({
                        value: b.branchName,
                        label: b.branchName,
                        disabled: b.branchName === metadata.toAmtBranch,
                        disabledReason: "(Selected in To)",
                      }))}
                    />
                    {formErrors.fromAmtBranch && (
                      <span className="text-[10px] text-red-500 font-medium leading-none">
                        {formErrors.fromAmtBranch}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      To Branch
                    </label>
                    <SearchableSelect
                      value={metadata.toAmtBranch}
                      onChange={(val) =>
                        handleMetadataFieldChange("toAmtBranch", val)
                      }
                      placeholder="Select Destination Branch"
                      className={`!bg-white dark:!bg-[#18191A] !text-slate-900 dark:!text-slate-100 !h-[38px] !text-xs !rounded-lg ${
                        formErrors.toAmtBranch
                          ? "!border-red-500 focus:!ring-1 focus:!ring-red-500 focus:!border-red-500"
                          : "!border-slate-200 dark:!border-slate-700 focus:!ring-1 focus:!ring-[#0077c5] focus:!border-[#0077c5]"
                      }`}
                      options={branches.map((b) => ({
                        value: b.branchName,
                        label: b.branchName,
                        disabled: b.branchName === metadata.fromAmtBranch,
                        disabledReason: "(Selected in From)",
                      }))}
                    />
                    {formErrors.toAmtBranch && (
                      <span className="text-[10px] text-red-500 font-medium leading-none">
                        {formErrors.toAmtBranch}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 mt-6 pt-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0077c5] dark:bg-[#38bdf8]"></span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                All shipment-level information fields are required.
              </span>
            </div>
          </section>

          {/* Step 2: Upload Image & Run OCR or Start Manual Entry */}
          {entryMode === "ocr" ? (
            <section className="lg:col-span-5 bg-white dark:bg-[#242526] border border-slate-200/90 dark:border-slate-800 p-6 rounded-xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#e8f3fa] dark:bg-[#0077c5]/20 text-[#0077c5] dark:text-[#38bdf8] text-xs font-bold shrink-0">
                    2
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
                      Upload Image & Run OCR
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Select register sheet and extract data entries.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-5" />

                <div
                  onClick={handleUploadBoxClick}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[160px] group ${
                    formErrors.image
                      ? "border-red-400 bg-red-50/20 dark:bg-red-950/20"
                      : "border-[#d2e3f0] dark:border-slate-700 hover:border-[#0077c5] dark:hover:border-[#38bdf8] bg-[#fbfdff] dark:bg-[#18191A]/60 hover:bg-[#f4f9fd] dark:hover:bg-[#18191A]"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (formErrors.image) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.image;
                          return next;
                        });
                      }
                      onFileChange(e);
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <svg
                        className="animate-spin h-7 w-7 text-[#0077c5] dark:text-[#38bdf8] mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                        Uploading image...
                      </p>
                    </div>
                  ) : uploadFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-2.5 text-emerald-600 dark:text-emerald-400 shadow-xs">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[200px] truncate">
                        {uploadFile.name}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Click to replace image
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-2.5 text-[#0077c5] dark:text-[#38bdf8] group-hover:scale-105 transition-transform">
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <path d="M12 18v-6" />
                          <path d="M9 15l3-3 3 3" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Upload Register Image
                      </p>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Select PNG, JPG, or JPEG
                      </span>
                      {formErrors.image && (
                        <span className="text-[11px] text-red-500 font-semibold mt-2">
                          {formErrors.image}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleProceedClick}
                  disabled={loading || uploading}
                  className="w-full py-2.5 px-4 bg-[#0077c5] hover:bg-[#006bb2] active:bg-[#005a96] text-white font-bold text-xs rounded-lg shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-3.5 w-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Proceed to OCR Review</span>
                  )}
                </button>

                {loading && (
                  <div className="mt-3 p-3 bg-[#f0f7fc] dark:bg-[#18191A] rounded-lg border border-[#d2e3f0] dark:border-slate-700 text-center animate-pulse">
                    <p className="text-[11px] text-[#0077c5] dark:text-[#38bdf8] font-mono">
                      {loadingStep}
                    </p>
                  </div>
                )}

                {errorMsg && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs">
                    <p className="font-semibold">Pipeline Error:</p>
                    <p className="text-[10px] font-mono mt-1 leading-relaxed">
                      {errorMsg}
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="lg:col-span-5 bg-white dark:bg-[#242526] border border-slate-200/90 dark:border-slate-800 p-6 rounded-xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#e8f3fa] dark:bg-[#0077c5]/20 text-[#0077c5] dark:text-[#38bdf8] text-xs font-bold shrink-0">
                    2
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
                      Start Manual Entry
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Create empty rows and enter shipments manually.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-5" />

                <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#18191A] border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    You have selected Manual Entry. Fill in the Shipment Information on the left, then click below to open the editable shipment table.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleManualEntryClick}
                  disabled={loading || uploading}
                  className="w-full py-2.5 px-4 bg-[#0077c5] hover:bg-[#006bb2] active:bg-[#005a96] text-white font-bold text-xs rounded-lg shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <svg
                    className="h-4 w-4"
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
                  <span>+ Add Shipment Row</span>
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
