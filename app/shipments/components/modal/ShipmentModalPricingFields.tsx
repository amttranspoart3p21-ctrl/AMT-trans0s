import React from "react";
import type { ShipmentRecord } from "@/types/shipment";

export interface ShipmentModalPricingFieldsProps {
  formData: ShipmentRecord;
  isEdit: boolean;
  handleFieldChange: (field: keyof ShipmentRecord, value: any) => void;
}

export default function ShipmentModalPricingFields({
  formData,
  isEdit,
  handleFieldChange,
}: ShipmentModalPricingFieldsProps) {
  return (
    <>
      {/* Quantity */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Quantity</label>
        {isEdit ? (
          <input
            type="number"
            value={formData.quantity || ""}
            onChange={(e) => handleFieldChange("quantity", e.target.value)}
            placeholder="0"
            className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
          />
        ) : (
          <div className="bg-slate-955/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.quantity}</div>
        )}
      </div>

      {/* Transport Rate */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Transport Rate</label>
        {isEdit ? (
          <input
            type="number"
            step="any"
            value={formData.transportRate === null ? "" : formData.transportRate}
            onChange={(e) => handleFieldChange("transportRate", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Auto-calculated"
            className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
          />
        ) : (
          <div className="bg-slate-955/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.transportRate === null ? "Auto" : formData.transportRate}</div>
        )}
      </div>

      {/* Price per Piece */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Price Per Piece</label>
        {isEdit ? (
          <input
            type="number"
            step="any"
            value={formData.pricePerPiece === null ? "" : formData.pricePerPiece}
            onChange={(e) => handleFieldChange("pricePerPiece", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Auto-calculated"
            className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
          />
        ) : (
          <div className="bg-slate-955/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.pricePerPiece === null ? "Auto" : formData.pricePerPiece}</div>
        )}
      </div>

      {/* Pickup Charge */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Pickup Charge</label>
        {isEdit ? (
          <input
            id="modal-pickupCharge"
            type="number"
            value={formData.pickupCharge === null || formData.pickupCharge === undefined ? "" : formData.pickupCharge}
            disabled={formData.pickupService !== "Home"}
            onChange={(e) => handleFieldChange("pickupCharge", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="0"
            className={`w-full border rounded-xl px-3 py-2 text-xs outline-none font-semibold text-right font-mono transition-colors ${
              formData.pickupService !== "Home"
                ? "opacity-50 bg-slate-900/80 cursor-not-allowed text-slate-500 border-slate-850"
                : "bg-slate-950 border-slate-800 text-slate-200 focus:border-violet-500"
            }`}
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold text-right font-mono">{formData.pickupCharge ?? 0}</div>
        )}
      </div>

      {/* Delivery Charge */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Delivery Charge</label>
        {isEdit ? (
          <input
            id="modal-deliveryCharge"
            type="number"
            value={formData.deliveryCharge === null || formData.deliveryCharge === undefined ? "" : formData.deliveryCharge}
            disabled={formData.deliveryService !== "Home"}
            onChange={(e) => handleFieldChange("deliveryCharge", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="0"
            className={`w-full border rounded-xl px-3 py-2 text-xs outline-none font-semibold text-right font-mono transition-colors ${
              formData.deliveryService !== "Home"
                ? "opacity-50 bg-slate-900/80 cursor-not-allowed text-slate-500 border-slate-850"
                : "bg-slate-950 border-slate-800 text-slate-200 focus:border-violet-500"
            }`}
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold text-right font-mono">{formData.deliveryCharge ?? 0}</div>
        )}
      </div>

      {/* Total Amount */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Total Amount</label>
        <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-100 font-bold text-sm bg-violet-955/20 border-violet-850">{formData.totalAmount ?? 0}</div>
      </div>
    </>
  );
}
