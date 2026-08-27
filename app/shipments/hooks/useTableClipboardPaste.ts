import { useCallback } from "react";
import type { ShipmentRecord } from "@/types/shipment";
import { EDITABLE_COLUMNS } from "../constants/shipmentWorkspace.constants";

export interface UseTableClipboardPasteProps {
  shipments: ShipmentRecord[];
  mode?: "read-only" | "spreadsheet";
  onBatchChangeRow?: (updates: Record<string, Partial<ShipmentRecord>>) => void;
  editableFields?: (keyof ShipmentRecord)[];
}

export function useTableClipboardPaste({
  shipments,
  mode = "read-only",
  onBatchChangeRow,
  editableFields = EDITABLE_COLUMNS,
}: UseTableClipboardPasteProps) {
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTableElement>) => {
      if (mode !== "spreadsheet") return;

      const target = e.target as HTMLElement;
      const startShipmentId = target.getAttribute("data-shipment-id");
      const startField = target.getAttribute("data-field") as keyof ShipmentRecord | null;

      if (!startShipmentId || !startField) return;

      const clipboardText = e.clipboardData.getData("text/plain");
      if (!clipboardText) return;

      e.preventDefault();

      // Split rows by newline and columns by tab
      const parsedRows = clipboardText.split(/\r?\n/).map((row) => row.split("\t"));

      // Remove the trailing empty row if it's empty (Excel often adds a trailing newline)
      if (
        parsedRows.length > 1 &&
        parsedRows[parsedRows.length - 1].length === 1 &&
        parsedRows[parsedRows.length - 1][0] === ""
      ) {
        parsedRows.pop();
      }

      const startRowIdx = shipments.findIndex((s) => s.shipmentId === startShipmentId);
      const startColIdx = editableFields.indexOf(startField);

      if (startRowIdx === -1 || startColIdx === -1) return;

      const updates: Record<string, Partial<ShipmentRecord>> = {};

      parsedRows.forEach((rowCells, rOffset) => {
        const targetRowIdx = startRowIdx + rOffset;
        if (targetRowIdx >= shipments.length) return;

        const targetShipment = shipments[targetRowIdx];
        const shipmentId = targetShipment.shipmentId;

        rowCells.forEach((cellVal, cOffset) => {
          const targetColIdx = startColIdx + cOffset;
          if (targetColIdx >= editableFields.length) return;

          const targetField = editableFields[targetColIdx];

          const cleanVal = cellVal.trim();
          let finalVal: any = cleanVal;

          // Field-specific parsing/conversions
          if (targetField === "pricePerPiece") {
            finalVal = cleanVal === "" ? null : Number(cleanVal);
            if (isNaN(finalVal)) finalVal = null;
          }

          if (!updates[shipmentId]) {
            updates[shipmentId] = {};
          }

          updates[shipmentId][targetField] = finalVal;
        });
      });

      if (Object.keys(updates).length > 0) {
        onBatchChangeRow?.(updates);
      }
    },
    [shipments, mode, onBatchChangeRow, editableFields]
  );

  return { handlePaste };
}
