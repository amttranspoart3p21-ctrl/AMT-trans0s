"use client";

import React, { useRef } from "react";
import toast from "react-hot-toast";
import type { Branch } from "@/types/branch";
import type {
  OcrMetadata,
  EntryMode,
  OcrShipmentRow as Shipment,
  BoundingBox,
} from "@/types/ocr";
import type { ImageViewerPosition } from "@/hooks/useImageViewer";
import SearchableSelect from "@/components/ui/SearchableSelect";
import RegisterImageViewport from "@/components/ocr/review/RegisterImageViewport";
import ShipmentTable from "@/components/ocr/review/ShipmentTable";
import DeleteShipmentModal from "@/components/ocr/review/DeleteShipmentModal";

export interface ReviewWorkspaceProps {
  // Navigation & Mode
  entryMode: EntryMode;
  onBack: () => void;

  // Metadata
  metadata: OcrMetadata;
  onMetadataChange: (updated: OcrMetadata) => void;
  branches: Branch[];
  isBranchSelectionValid: boolean;

  // Upload / Image Session State & Handlers
  uploadFile: File | null;
  activeFilename: string;
  uploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // OCR Workflow State & Actions
  loading: boolean;
  loadingStep: string;
  errorMsg: string;
  onErrorDismiss: () => void;
  onRunOCR: () => void;

  // Save State & Actions
  saving: boolean;
  onSaveAll: () => void;

  // Image Viewer Canvas (from useImageViewer)
  scale: number;
  position: ImageViewerPosition;
  isDragging: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  imgRef: React.RefObject<HTMLImageElement | null>;

  // Shipment Rows Dataset & Handlers (from useShipmentRows)
  shipments: Shipment[];
  coordinates: Record<string, BoundingBox>;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rowToRemove: string | null;
  onFieldChange: (
    shipmentId: string,
    field: keyof Shipment,
    value: string
  ) => void;
  onAddRow: () => void;
  onInitiateRemove: (shipmentId: string) => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
}

/**
 * ReviewWorkspace presentation component encapsulating:
 * - Top header bar with Back navigation, breadcrumb, active filename, statistics, and primary actions
 * - Compact horizontal Shipment Info metadata strip (Date, Invoices, Vehicle, From/To branches)
 * - 30% / 70% split layout (30% Register Image Viewport, 70% Editable Shipment Table)
 * - Full Light Mode (#F0F7FF) and Dark Mode (#18191A) theme fidelity
 * - Delete confirmation modal dialog
 */
export default function ReviewWorkspace({
  entryMode,
  onBack,
  metadata,
  onMetadataChange,
  branches,
  isBranchSelectionValid,
  uploadFile,
  activeFilename,
  uploading,
  onFileChange,
  loading,
  loadingStep,
  errorMsg,
  onErrorDismiss,
  onRunOCR,
  saving,
  onSaveAll,
  scale,
  position,
  isDragging,
  zoomIn,
  zoomOut,
  resetZoom,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleWheel,
  imgRef,
  shipments,
  coordinates,
  totalRows,
  validRows,
  invalidRows,
  rowToRemove,
  onFieldChange,
  onAddRow,
  onInitiateRemove,
  onCancelRemove,
  onConfirmRemove,
}: ReviewWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [metadataErrors, setMetadataErrors] = React.useState<{
    date?: string;
    ourInvoiceNumber?: string;
    vehicleNumber?: string;
    fromAmtBranch?: string;
    toAmtBranch?: string;
  }>({});

  // Helper to validate metadata fields and highlight missing inputs
  const validateMetadata = (): boolean => {
    const errors: {
      date?: string;
      ourInvoiceNumber?: string;
      vehicleNumber?: string;
      fromAmtBranch?: string;
      toAmtBranch?: string;
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

    setMetadataErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMetadataFieldChange = (
    field: keyof OcrMetadata,
    value: string
  ) => {
    if (metadataErrors[field]) {
      setMetadataErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    onMetadataChange({ ...metadata, [field]: value });
  };

  const handleRunOcrClick = () => {
    const isValid = validateMetadata();
    if (!isValid) return;
    onRunOCR();
  };

  const handleSaveAllClick = () => {
    const isValid = validateMetadata();
    if (!isValid) return;
    if (shipments.length === 0) {
      toast.error("No shipment entries found to save. Please add rows or run OCR.");
      return;
    }
    onSaveAll();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="h-full w-full bg-[#F0F7FF] dark:bg-[#18191A] text-slate-800 dark:text-slate-100 p-4 md:p-6 select-none flex flex-col overflow-hidden">
        {/* Workspace Top Header Bar */}
        <header className="flex flex-col md:flex-row justify-between items-stretch md:items-center pb-4 gap-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBack}
              className="px-3 py-1.5 bg-white dark:bg-[#242526] hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Home</span>
              <span>&rsaquo;</span>
              <span>Operations</span>
              <span>&rsaquo;</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {entryMode === "manual"
                  ? "Manual Entry Workspace"
                  : "OCR Review Screen"}
              </span>
            </div>

            {entryMode === "ocr" && activeFilename && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-[#242526] px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 max-w-[180px] truncate shadow-2xs">
                  {activeFilename}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || loading}
                  className="px-2 py-1 bg-white dark:bg-[#242526] hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-all text-[10px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Replace current register image"
                >
                  <svg
                    className="h-3 w-3 text-[#0077c5] dark:text-[#38bdf8]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <span>{uploading ? "Uploading..." : "Change Image"}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Statistics Counters */}
            <div className="flex items-center gap-3 bg-white dark:bg-[#242526] px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Total Rows
                </span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                  {totalRows}
                </span>
              </div>
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Valid
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">
                  {validRows}
                </span>
              </div>
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">
                  Invalid
                </span>
                <span className="text-xs font-extrabold text-red-500 dark:text-red-400 leading-none mt-0.5">
                  {invalidRows}
                </span>
              </div>
            </div>

            {/* Action Buttons: NOT prematurely disabled */}
            <div className="flex items-center gap-2">
              {entryMode === "ocr" && (
                <button
                  onClick={handleRunOcrClick}
                  disabled={loading || saving}
                  className="px-3.5 py-1.5 bg-white dark:bg-[#242526] hover:bg-slate-50 dark:hover:bg-slate-700 border border-[#0077c5] text-[#0077c5] dark:text-[#38bdf8] text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-3.5 w-3.5 text-[#0077c5] dark:text-[#38bdf8]"
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
                    <>
                      <svg
                        className="h-3.5 w-3.5"
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
                      <span>Run OCR</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleSaveAllClick}
                disabled={saving || loading}
                className="px-4 py-1.5 bg-[#0077c5] hover:bg-[#006bb2] active:bg-[#005a96] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {saving ? (
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Save to Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Shipment Information Metadata Strip with Live Validation Error Display */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 select-none">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={metadata.date}
              onChange={(e) => handleMetadataFieldChange("date", e.target.value)}
              className={`h-8 w-full bg-white dark:bg-[#242526] border rounded-lg px-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition-all cursor-pointer shadow-2xs ${
                metadataErrors.date
                  ? "border-red-500 bg-red-50/30 dark:bg-red-950/20 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-[#0077c5] focus:border-[#0077c5]"
              }`}
            />
            {metadataErrors.date && (
              <span className="text-[10px] text-red-500 font-medium leading-none">
                {metadataErrors.date}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Invoice No
            </label>
            <input
              type="text"
              placeholder="e.g. TX-49502"
              value={metadata.ourInvoiceNumber}
              onChange={(e) =>
                handleMetadataFieldChange("ourInvoiceNumber", e.target.value)
              }
              className={`h-8 w-full bg-white dark:bg-[#242526] border rounded-lg px-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all shadow-2xs ${
                metadataErrors.ourInvoiceNumber
                  ? "border-red-500 bg-red-50/30 dark:bg-red-950/20 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-[#0077c5] focus:border-[#0077c5]"
              }`}
            />
            {metadataErrors.ourInvoiceNumber && (
              <span className="text-[10px] text-red-500 font-medium leading-none">
                {metadataErrors.ourInvoiceNumber}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Vehicle No
            </label>
            <input
              type="text"
              placeholder="e.g. TN23 L4495"
              value={metadata.vehicleNumber}
              onChange={(e) =>
                handleMetadataFieldChange("vehicleNumber", e.target.value)
              }
              className={`h-8 w-full bg-white dark:bg-[#242526] border rounded-lg px-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all shadow-2xs ${
                metadataErrors.vehicleNumber
                  ? "border-red-500 bg-red-50/30 dark:bg-red-950/20 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-[#0077c5] focus:border-[#0077c5]"
              }`}
            />
            {metadataErrors.vehicleNumber && (
              <span className="text-[10px] text-red-500 font-medium leading-none">
                {metadataErrors.vehicleNumber}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              From
            </label>
            <SearchableSelect
              value={metadata.fromAmtBranch}
              onChange={(val) => handleMetadataFieldChange("fromAmtBranch", val)}
              placeholder="Select Origin Branch"
              className={`!h-8 !px-2.5 !bg-white dark:!bg-[#242526] !text-slate-800 dark:!text-slate-100 !text-xs !rounded-lg !shadow-2xs ${
                metadataErrors.fromAmtBranch
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
            {metadataErrors.fromAmtBranch && (
              <span className="text-[10px] text-red-500 font-medium leading-none">
                {metadataErrors.fromAmtBranch}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              To
            </label>
            <SearchableSelect
              value={metadata.toAmtBranch}
              onChange={(val) => handleMetadataFieldChange("toAmtBranch", val)}
              placeholder="Select Destination Branch"
              className={`!h-8 !px-2.5 !bg-white dark:!bg-[#242526] !text-slate-800 dark:!text-slate-100 !text-xs !rounded-lg !shadow-2xs ${
                metadataErrors.toAmtBranch
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
            {metadataErrors.toAmtBranch && (
              <span className="text-[10px] text-red-500 font-medium leading-none">
                {metadataErrors.toAmtBranch}
              </span>
            )}
          </div>
        </section>

        {metadata.fromAmtBranch &&
          metadata.toAmtBranch &&
          metadata.fromAmtBranch === metadata.toAmtBranch && (
            <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <svg
                className="h-4 w-4 text-red-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="font-semibold">
                Validation Error: Origin and Destination branches cannot be the same.
              </span>
            </div>
          )}

        {errorMsg && (
          <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-red-600 dark:text-red-400 text-xs flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-red-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <span className="font-bold">OCR Pipeline Error: </span>
                <span className="font-mono text-[11px]">{errorMsg}</span>
              </div>
            </div>
            <button
              onClick={onErrorDismiss}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold cursor-pointer px-2 py-0.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 30% / 70% Split Screen Main Review Workspace */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 mt-4">
          {/* Left 30%: Register Image Viewport */}
          {entryMode === "ocr" && (
            <div className="w-full lg:w-[30%] shrink-0 flex flex-col min-h-0 h-64 lg:h-auto overflow-hidden">
              <RegisterImageViewport
                activeFilename={activeFilename}
                uploading={uploading}
                loading={loading}
                onTriggerImagePicker={() => fileInputRef.current?.click()}
                scale={scale}
                position={position}
                isDragging={isDragging}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                resetZoom={resetZoom}
                handleMouseDown={handleMouseDown}
                handleMouseMove={handleMouseMove}
                handleMouseUp={handleMouseUp}
                handleWheel={handleWheel}
                imgRef={imgRef}
              />
            </div>
          )}

          {/* Right 70%: Editable Shipment Table */}
          <div
            className={`w-full min-h-0 ${
              entryMode === "ocr" ? "lg:w-[70%]" : "lg:w-full"
            } flex flex-col overflow-hidden`}
          >
            <ShipmentTable
              shipments={shipments}
              onFieldChange={onFieldChange}
              onAddRow={onAddRow}
              onInitiateRemove={onInitiateRemove}
            />
          </div>
        </div>

        {/* Delete Row Confirmation Modal */}
        <DeleteShipmentModal
          isOpen={rowToRemove !== null}
          onCancel={onCancelRemove}
          onConfirm={onConfirmRemove}
        />
      </div>
    </>
  );
}
