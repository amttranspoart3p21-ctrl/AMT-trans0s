import type {
  BoundingBox,
  OcrShipmentRow,
  OcrMetadata,
  RawOcrExtractedShipment,
  SaveShipmentsPayload,
  OcrShipmentToSave,
} from "@/types/ocr";
import { validateRow } from "@/validators/ocr.validator";

/**
 * Maps raw OCR API extracted shipments into validated frontend OcrShipmentRow items.
 */
export function mapOcrResponseToRows(
  rawShipments: RawOcrExtractedShipment[]
): OcrShipmentRow[] {
  if (!Array.isArray(rawShipments)) {
    return [];
  }

  return rawShipments.map((s, idx) => {
    const shipment: OcrShipmentRow = {
      id: String(s.rowNumber || idx + 1),
      fromCompany: s.fromCompany || "",
      customerInvoice: s.customerInvoice || "",
      toCompany: s.toCompany || "",
      packageType: s.packageType || "",
      quantity:
        s.quantity !== null && s.quantity !== undefined
          ? String(s.quantity)
          : null,
      paymentStatus: s.paymentStatus || "Pending",
      isValid: true,
      validationErrors: [],
    };

    const validation = validateRow(shipment);
    shipment.isValid = validation.isValid;
    shipment.validationErrors = validation.errors;

    return shipment;
  });
}

/**
 * Merges existing manual rows with newly extracted OCR shipment rows,
 * renumbering all rows sequentially (1..N) and maintaining their bounding box coordinates.
 */
export function mergeManualAndOcrRows(
  prevShipments: OcrShipmentRow[],
  extractedShipments: OcrShipmentRow[],
  coordsMap: Record<string, BoundingBox>,
  prevCoords: Record<string, BoundingBox>
): {
  updatedShipments: OcrShipmentRow[];
  newCoordinates: Record<string, BoundingBox>;
} {
  const manualRows = prevShipments.filter((s) => s.isManual);
  const merged = [...manualRows, ...extractedShipments];
  const newCoords: Record<string, BoundingBox> = {};

  const updated = merged.map((s, idx) => {
    const newId = String(idx + 1);

    let coord: BoundingBox | undefined = undefined;
    if (prevShipments.includes(s)) {
      coord = prevCoords[s.id];
    } else {
      coord = coordsMap[s.id];
    }

    if (coord) {
      newCoords[newId] = coord;
    }

    return {
      ...s,
      id: newId,
    };
  });

  return {
    updatedShipments: updated,
    newCoordinates: newCoords,
  };
}

/**
 * Applies a field update to a shipment row in the collection and recalculates validation.
 */
export function applyCellFieldEdit(
  shipments: OcrShipmentRow[],
  shipmentId: string,
  field: keyof OcrShipmentRow,
  value: string
): OcrShipmentRow[] {
  return shipments.map((s) => {
    if (s.id === shipmentId) {
      const shipment = { ...s };

      if (field === "quantity") {
        shipment.quantity = value === "" ? null : value;
      } else {
        (shipment as any)[field] = value === "" ? null : value;
      }

      const validation = validateRow(shipment);
      shipment.isValid = validation.isValid;
      shipment.validationErrors = validation.errors;

      return shipment;
    }
    return s;
  });
}

/**
 * Creates a new blank manual entry shipment row appended with sequential ID (currentLength + 1).
 */
export function createEmptyManualRow(currentLength: number): OcrShipmentRow {
  const newId = String(currentLength + 1);
  const newRow: OcrShipmentRow = {
    id: newId,
    fromCompany: "",
    customerInvoice: "",
    toCompany: "",
    packageType: "",
    quantity: "",
    paymentStatus: "Pending",
    isValid: false,
    validationErrors: [],
    isManual: true,
  };

  const validation = validateRow(newRow);
  newRow.isValid = validation.isValid;
  newRow.validationErrors = validation.errors;

  return newRow;
}

/**
 * Removes a shipment row by ID, renumbers remaining rows to 1..N,
 * re-validates each, and re-keys the bounding-box coordinates dictionary accordingly.
 */
export function removeShipmentRowAndRenumber(
  shipments: OcrShipmentRow[],
  coordinates: Record<string, BoundingBox>,
  rowToRemoveId: string
): {
  updatedShipments: OcrShipmentRow[];
  newCoordinates: Record<string, BoundingBox>;
} {
  const filtered = shipments.filter((s) => s.id !== rowToRemoveId);

  const updated = filtered.map((s, idx) => {
    const newId = String(idx + 1);
    const shipment: OcrShipmentRow = {
      ...s,
      id: newId,
    };
    const validation = validateRow(shipment);
    shipment.isValid = validation.isValid;
    shipment.validationErrors = validation.errors;
    return shipment;
  });

  const newCoords: Record<string, BoundingBox> = {};
  filtered.forEach((s, idx) => {
    const oldId = s.id;
    const newId = String(idx + 1);
    if (coordinates[oldId]) {
      newCoords[newId] = coordinates[oldId];
    }
  });

  return {
    updatedShipments: updated,
    newCoordinates: newCoords,
  };
}

/**
 * Assembles the full Save payload sent to /api/shipments from the current metadata and shipment rows.
 */
export function buildSaveShipmentsPayload(
  metadata: OcrMetadata,
  shipments: OcrShipmentRow[],
  activeFilename?: string,
  now: Date = new Date()
): SaveShipmentsPayload {
  const shipmentsToSave: OcrShipmentToSave[] = shipments.map((s) => ({
    ...s,
    date: metadata.date,
    ourInvoiceNumber: metadata.ourInvoiceNumber,
    vehicleNumber: metadata.vehicleNumber,
    fromAmtBranch: metadata.fromAmtBranch,
    toAmtBranch: metadata.toAmtBranch,
  }));

  const uploadSessionId = activeFilename
    ? `US-${activeFilename.split("-")[0]}`
    : `US-MANUAL-${now.getTime()}`;

  return {
    year: now.getFullYear(),
    month: now.toLocaleString("default", { month: "long" }),
    shipments: shipmentsToSave,
    imageFileName: activeFilename ? activeFilename : undefined,
    uploadSessionId,
  };
}
