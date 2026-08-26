import type { Branch } from "@/types/branch";
import type {
  OcrApiResponse,
  UploadApiResponse,
  SaveShipmentsPayload,
  SaveShipmentsResponse,
} from "@/types/ocr";

/**
 * Fetches all currently active branches from the database.
 */
export async function fetchActiveBranches(): Promise<Branch[]> {
  const res = await fetch("/api/branches?status=Active");
  if (!res.ok) {
    throw new Error("Failed to fetch branches.");
  }
  const json = await res.json();
  if (json.success && Array.isArray(json.data)) {
    return json.data as Branch[];
  }
  return [];
}

/**
 * Uploads a register image file via multipart/form-data to /api/upload.
 */
export async function uploadRegisterImage(file: File): Promise<UploadApiResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "File upload failed.");
  }

  const data: UploadApiResponse = await response.json();
  return data;
}

/**
 * Initiates Python PaddleOCR processing on the uploaded image filename.
 */
export async function executeOcrPipeline(filename: string): Promise<OcrApiResponse> {
  const response = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "OCR extraction failed.");
  }

  const data: OcrApiResponse = await response.json();
  return data;
}

/**
 * Batch saves approved shipment records and metadata to the monthly Excel register.
 */
export async function saveShipmentsBatch(
  payload: SaveShipmentsPayload
): Promise<SaveShipmentsResponse> {
  const response = await fetch("/api/shipments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to save shipments to Excel.");
  }

  const resData: SaveShipmentsResponse = await response.json();
  return resData;
}
