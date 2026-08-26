"use client";

import React from "react";

export interface DeleteShipmentModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * DeleteShipmentModal presentation component encapsulating:
 * - Backdrop overlay with glassmorphism blur
 * - Confirmation dialog with warning message
 * - Cancel and Remove action buttons
 */
export default function DeleteShipmentModal({
  isOpen,
  onCancel,
  onConfirm,
}: DeleteShipmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-slate-800 p-6 rounded-xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
          Remove this shipment?
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          This row will be removed and subsequent rows will be renumbered.
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 bg-white dark:bg-[#18191A] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
