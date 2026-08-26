export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface OcrShipmentRow {
  id: string;
  fromCompany: string | null;
  customerInvoice: string | null;
  toCompany: string | null;
  packageType: string | null;
  quantity: string | null;
  paymentStatus: string | null;
  isValid: boolean;
  validationErrors: string[];
  isManual?: boolean;
}

export interface OcrMetadata {
  date: string;
  ourInvoiceNumber: string;
  vehicleNumber: string;
  fromAmtBranch: string;
  toAmtBranch: string;
}

export type EntryMode = "ocr" | "manual";

export interface RowValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RawOcrExtractedShipment {
  rowNumber?: number;
  fromCompany?: string;
  customerInvoice?: string;
  toCompany?: string;
  packageType?: string;
  quantity?: string | number | null;
  paymentStatus?: string;
  isValid?: boolean;
  validationErrors?: string[];
}

export interface OcrApiResponse {
  shipments: RawOcrExtractedShipment[];
  coordinates: Record<string, BoundingBox>;
}

export interface UploadApiResponse {
  success: boolean;
  filename: string;
}

export interface OcrShipmentToSave extends OcrShipmentRow {
  date: string;
  ourInvoiceNumber: string;
  vehicleNumber: string;
  fromAmtBranch: string;
  toAmtBranch: string;
}

export interface SaveShipmentsPayload {
  year: number;
  month: string;
  shipments: OcrShipmentToSave[];
  imageFileName?: string;
  uploadSessionId?: string;
}

export interface SaveShipmentsResponse {
  success: boolean;
  totalSaved: number;
  failedRows?: Array<{
    shipment: {
      fromCompany?: string;
      customerInvoice?: string;
      toCompany?: string;
      packageType?: string;
      quantity?: string;
      paymentStatus?: string;
    };
    error: string;
  }>;
  error?: string;
}
