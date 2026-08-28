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
      className="sticky right-0 bg-white/95 dark:bg-[#242526]/95 backdrop-blur-xs py-2 px-3.5 align-middle text-center border-l border-slate-200 dark:border-zinc-800 z-10"
      style={{ width: "120px", minWidth: "120px" }}
    >
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onPreviewShipment?.(shipment)}
          className="p-1 text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
          title="Preview Shipment"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onEditShipment?.(shipment)}
          className="p-1 text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
          title="Edit Shipment"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        {shipment.imageId && (
          <button
            type="button"
            onClick={() => onViewImage?.(shipment.imageId!, shipment.imageFileName || "register.jpg")}
            className="p-1 text-slate-400 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded transition-colors cursor-pointer"
            title="View Register Image"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(shipment.shipmentId)}
          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
          title="Delete Shipment"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </td>
  );
}
