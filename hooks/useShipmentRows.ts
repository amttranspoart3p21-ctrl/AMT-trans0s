import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { BoundingBox, OcrShipmentRow } from "@/types/ocr";
import {
  applyCellFieldEdit,
  createEmptyManualRow,
  removeShipmentRowAndRenumber,
  mergeManualAndOcrRows,
} from "@/utils/ocr-transformers";

export interface UseShipmentRowsReturn {
  shipments: OcrShipmentRow[];
  setShipments: React.Dispatch<React.SetStateAction<OcrShipmentRow[]>>;
  coordinates: Record<string, BoundingBox>;
  setCoordinates: React.Dispatch<React.SetStateAction<Record<string, BoundingBox>>>;
  rowToRemove: string | null;
  setRowToRemove: React.Dispatch<React.SetStateAction<string | null>>;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  handleFieldChange: (
    shipmentId: string,
    field: keyof OcrShipmentRow,
    value: string
  ) => void;
  handleAddRow: () => void;
  handleInitiateRemove: (shipmentId: string) => void;
  handleCancelRemove: () => void;
  handleConfirmRemove: () => void;
  mergeExtractedOcrRows: (
    extractedShipments: OcrShipmentRow[],
    coordsMap: Record<string, BoundingBox>
  ) => void;
  resetShipments: () => void;
}

/**
 * Headless custom hook managing shipment row dataset, cell modifications,
 * row addition/deletion, validation state, and coordinate synchronization.
 */
export function useShipmentRows(
  initialShipments: OcrShipmentRow[] = [],
  initialCoordinates: Record<string, BoundingBox> = {}
): UseShipmentRowsReturn {
  const [shipments, setShipments] = useState<OcrShipmentRow[]>(initialShipments);
  const [coordinates, setCoordinates] = useState<Record<string, BoundingBox>>(initialCoordinates);
  const [rowToRemove, setRowToRemove] = useState<string | null>(null);

  const coordinatesRef = useRef(coordinates);
  useEffect(() => {
    coordinatesRef.current = coordinates;
  }, [coordinates]);

  const totalRows = shipments.length;
  const validRows = useMemo(
    () => shipments.filter((s) => s.isValid).length,
    [shipments]
  );
  const invalidRows = totalRows - validRows;

  const handleFieldChange = useCallback(
    (shipmentId: string, field: keyof OcrShipmentRow, value: string) => {
      setShipments((prev) => applyCellFieldEdit(prev, shipmentId, field, value));
    },
    []
  );

  const handleAddRow = useCallback(() => {
    setShipments((prev) => [...prev, createEmptyManualRow(prev.length)]);
  }, []);

  const handleInitiateRemove = useCallback((shipmentId: string) => {
    setRowToRemove(shipmentId);
  }, []);

  const handleCancelRemove = useCallback(() => {
    setRowToRemove(null);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (!rowToRemove) return;

    const { updatedShipments, newCoordinates } = removeShipmentRowAndRenumber(
      shipments,
      coordinates,
      rowToRemove
    );

    setShipments(updatedShipments);
    setCoordinates(newCoordinates);
    setRowToRemove(null);
  }, [rowToRemove, shipments, coordinates]);

  const mergeExtractedOcrRows = useCallback(
    (
      extractedShipments: OcrShipmentRow[],
      coordsMap: Record<string, BoundingBox>
    ) => {
      setShipments((prev) => {
        const { updatedShipments, newCoordinates } = mergeManualAndOcrRows(
          prev,
          extractedShipments,
          coordsMap,
          coordinatesRef.current
        );
        setCoordinates(newCoordinates);
        return updatedShipments;
      });
    },
    []
  );

  const resetShipments = useCallback(() => {
    setShipments([]);
    setCoordinates({});
    setRowToRemove(null);
  }, []);

  return {
    shipments,
    setShipments,
    coordinates,
    setCoordinates,
    rowToRemove,
    setRowToRemove,
    totalRows,
    validRows,
    invalidRows,
    handleFieldChange,
    handleAddRow,
    handleInitiateRemove,
    handleCancelRemove,
    handleConfirmRemove,
    mergeExtractedOcrRows,
    resetShipments,
  };
}
