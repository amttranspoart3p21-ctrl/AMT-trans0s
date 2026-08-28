import React from "react";
import type { ShipmentRecord } from "@/types/shipment";

export interface ShipmentModalPricingFieldsProps {
  formData: ShipmentRecord;
  isEdit: boolean;
  handleFieldChange: (field: keyof ShipmentRecord, value: any) => void;
}

export function ShipmentModalLogisticsFields({
  formData,
  isEdit,
  handleFieldChange,
}: ShipmentModalPricingFieldsProps) {
  return (
    <>
      {/* Quantity */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Quantity</label>
        {isEdit ? (
          <input
            type="number"
            value={formData.quantity || ""}
            onChange={(e) => handleFieldChange("quantity", e.target.value)}
            placeholder="0"
            className="w-full bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-100 text-right font-mono outline-none focus:border-sky-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 text-right font-mono shadow-2xs min-h-[36px] flex items-center justify-end">
            {formData.quantity ?? "-"}
          </div>
        )}
      </div>

      {/* Transport Rate */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Transport Rate</label>
        {isEdit ? (
          <input
            type="number"
            step="any"
            value={formData.transportRate === null ? "" : formData.transportRate}
            onChange={(e) => handleFieldChange("transportRate", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Auto-calculated"
            className="w-full bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 outline-none focus:border-sky-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 shadow-2xs min-h-[36px] flex items-center">
            {formData.transportRate === null ? "Auto" : formData.transportRate}
          </div>
        )}
      </div>

      {/* Price per Piece */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Price Per Piece</label>
        {isEdit ? (
          <input
            type="number"
            step="any"
            value={formData.pricePerPiece === null ? "" : formData.pricePerPiece}
            onChange={(e) => handleFieldChange("pricePerPiece", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Auto-calculated"
            className="w-full bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 outline-none focus:border-sky-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 shadow-2xs min-h-[36px] flex items-center">
            {formData.pricePerPiece === null ? "Auto" : formData.pricePerPiece}
          </div>
        )}
      </div>
    </>
  );
}

export function ShipmentModalFinancialFields({
  formData,
  isEdit,
  handleFieldChange,
}: ShipmentModalPricingFieldsProps) {
  return (
    <>
      {/* Pickup Charge */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Pickup Charge</label>
        {isEdit ? (
          <input
            id="modal-pickupCharge"
            type="number"
            value={formData.pickupCharge === null || formData.pickupCharge === undefined ? "" : formData.pickupCharge}
            disabled={formData.pickupService !== "Home"}
            onChange={(e) => handleFieldChange("pickupCharge", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="0"
            className={`w-full border rounded-lg px-3 py-2 text-xs outline-none font-semibold text-right font-mono transition-colors shadow-2xs ${
              formData.pickupService !== "Home"
                ? "opacity-50 bg-slate-100 dark:bg-zinc-800/50 cursor-not-allowed text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800"
                : "bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-100 focus:border-sky-500"
            }`}
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 text-right font-mono shadow-2xs min-h-[36px] flex items-center justify-end">
            {formData.pickupCharge ?? 0}
          </div>
        )}
      </div>

      {/* Delivery Charge */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Delivery Charge</label>
        {isEdit ? (
          <input
            id="modal-deliveryCharge"
            type="number"
            value={formData.deliveryCharge === null || formData.deliveryCharge === undefined ? "" : formData.deliveryCharge}
            disabled={formData.deliveryService !== "Home"}
            onChange={(e) => handleFieldChange("deliveryCharge", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="0"
            className={`w-full border rounded-lg px-3 py-2 text-xs outline-none font-semibold text-right font-mono transition-colors shadow-2xs ${
              formData.deliveryService !== "Home"
                ? "opacity-50 bg-slate-100 dark:bg-zinc-800/50 cursor-not-allowed text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800"
                : "bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-100 focus:border-sky-500"
            }`}
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 text-right font-mono shadow-2xs min-h-[36px] flex items-center justify-end">
            {formData.deliveryCharge ?? 0}
          </div>
        )}
      </div>

      {/* Total Amount (Highlighted Special Box) */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Total Amount</label>
        <div className="bg-sky-50/60 dark:bg-sky-950/40 border-2 border-sky-600 dark:border-sky-500 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 dark:text-sky-300 text-right font-mono shadow-2xs min-h-[38px] flex items-center justify-end">
          {formData.totalAmount ?? 0}
        </div>
      </div>
    </>
  );
}

export default function ShipmentModalPricingFields(props: ShipmentModalPricingFieldsProps) {
  return (
    <>
      <ShipmentModalLogisticsFields {...props} />
      <ShipmentModalFinancialFields {...props} />
    </>
  );
}
