import { useCallback } from "react";
import type { ShipmentRecord } from "@/types/shipment";
import { EDITABLE_COLUMNS } from "../constants/shipmentWorkspace.constants";

export interface UseTableKeyboardNavigationProps {
  shipments: ShipmentRecord[];
  mode?: "read-only" | "spreadsheet";
  editableFields?: (keyof ShipmentRecord)[];
}

export function useTableKeyboardNavigation({
  shipments,
  mode = "read-only",
  editableFields = EDITABLE_COLUMNS,
}: UseTableKeyboardNavigationProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, shipmentId: string, field: keyof ShipmentRecord) => {
      if (mode !== "spreadsheet") return;

      const rowIdx = shipments.findIndex((s) => s.shipmentId === shipmentId);
      const colIdx = editableFields.indexOf(field);

      if (rowIdx === -1 || colIdx === -1) return;

      let nextRowIdx = rowIdx;
      let nextColIdx = colIdx;
      let shouldPreventDefault = false;

      switch (e.key) {
        case "ArrowUp":
          if ((e.target as HTMLElement).tagName !== "SELECT") {
            nextRowIdx = Math.max(0, rowIdx - 1);
            shouldPreventDefault = true;
          }
          break;
        case "ArrowDown":
          if ((e.target as HTMLElement).tagName !== "SELECT") {
            nextRowIdx = Math.min(shipments.length - 1, rowIdx + 1);
            shouldPreventDefault = true;
          }
          break;
        case "Tab":
          if (e.shiftKey) {
            if (colIdx === 0) {
              if (rowIdx > 0) {
                nextRowIdx = rowIdx - 1;
                nextColIdx = editableFields.length - 1;
              }
            } else {
              nextColIdx = colIdx - 1;
            }
          } else {
            if (colIdx === editableFields.length - 1) {
              if (rowIdx < shipments.length - 1) {
                nextRowIdx = rowIdx + 1;
                nextColIdx = 0;
              }
            } else {
              nextColIdx = colIdx + 1;
            }
          }
          shouldPreventDefault = true;
          break;
        case "Enter":
          if (e.shiftKey) {
            nextRowIdx = Math.max(0, rowIdx - 1);
          } else {
            nextRowIdx = Math.min(shipments.length - 1, rowIdx + 1);
          }
          shouldPreventDefault = true;
          break;
        default:
          return;
      }

      if (shouldPreventDefault) {
        e.preventDefault();
      }

      const nextField = editableFields[nextColIdx];
      const nextShipment = shipments[nextRowIdx];
      if (nextShipment && nextField) {
        const nextId = `cell-${nextShipment.shipmentId}-${nextField}`;
        setTimeout(() => {
          const nextEl = document.getElementById(nextId);
          if (nextEl) {
            nextEl.focus();
            if (nextEl instanceof HTMLInputElement) {
              nextEl.select();
            }
          }
        }, 0);
      }
    },
    [shipments, mode, editableFields]
  );

  return { handleKeyDown };
}
