import React from "react";
import type { ShipmentRecord } from "@/types/shipment";

export interface ShipmentTableActionsProps {
  shipment: ShipmentRecord;
  onPreviewShipment?: (shipment: ShipmentRecord) => void;
  onEditShipment?: (shipment: ShipmentRecord) => void;
  onViewImage?: (imageId: string, fileName: string) => void;
  onDelete: (shipmentId: string) => void;
}

export default function ShipmentTableActions({
  shipment,
  onPreviewShipment,
  onEditShipment,
  onViewImage,
  onDelete,
}: ShipmentTableActionsProps) {
  return (
    <td
      className="sticky right-0 bg-slate-955/95 backdrop-blur-sm py-[4px] px-3 align-middle text-center border-l border-slate-800 z-10 shadow-[-4px_0_12px_rgba(0,0,0,0.5)]"
      style={{ width: "120px", minWidth: "120px" }}
    >
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
  );
}
