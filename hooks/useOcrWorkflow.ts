import { useState, useCallback } from "react";
import type { BoundingBox, OcrShipmentRow } from "@/types/ocr";
import { uploadRegisterImage, executeOcrPipeline } from "@/services/ocr.api";
import { mapOcrResponseToRows } from "@/utils/ocr-transformers";

export const OCR_LOADING_STEPS = [
  "Initializing PaddleOCR Engine...",
  "Scanning register spatial layout...",
  "Grouping horizontal row structures...",
  "Resolving quote repetition propagation...",
  "Analyzing text blocks and lines...",
  "Assembling structured preview schema...",
] as const;

export interface UseOcrWorkflowReturn {
  uploadFile: File | null;
  setUploadFile: React.Dispatch<React.SetStateAction<File | null>>;
  activeFilename: string;
  setActiveFilename: React.Dispatch<React.SetStateAction<string>>;
  uploading: boolean;
  loading: boolean;
  loadingStep: string;
  errorMsg: string;
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
  uploadImage: (file: File, onUploadSuccess?: () => void) => Promise<void>;
  handleRunOCR: (
    filenameParam?: string,
    onOcrExtracted?: (
      extractedShipments: OcrShipmentRow[],
      coordsMap: Record<string, BoundingBox>
    ) => void
  ) => Promise<void>;
  resetOcrWorkflow: () => void;
}

/**
 * Headless custom hook managing image file uploading, OCR pipeline execution,
 * simulated step ticker progress, and OCR error state.
 */
export function useOcrWorkflow(): UseOcrWorkflowReturn {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeFilename, setActiveFilename] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const uploadImage = useCallback(
    async (file: File, onUploadSuccess?: () => void) => {
      setUploading(true);
      setErrorMsg("");

      try {
        const data = await uploadRegisterImage(file);
        setActiveFilename(data.filename);
        setUploadFile(file);

        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to upload image.");
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const handleRunOCR = useCallback(
    async (
      filenameParam?: string,
      onOcrExtracted?: (
        extractedShipments: OcrShipmentRow[],
        coordsMap: Record<string, BoundingBox>
      ) => void
    ) => {
      const targetFilename = filenameParam || activeFilename;
      setLoading(true);
      setErrorMsg("");

      let stepIdx = 0;
      setLoadingStep(OCR_LOADING_STEPS[0]);
      const stepInterval = setInterval(() => {
        if (stepIdx < OCR_LOADING_STEPS.length - 1) {
          stepIdx++;
          setLoadingStep(OCR_LOADING_STEPS[stepIdx]);
        }
      }, 2500);

      try {
        const data = await executeOcrPipeline(targetFilename);
        clearInterval(stepInterval);

        const extractedShipments: OcrShipmentRow[] = mapOcrResponseToRows(
          data.shipments
        );
        const coordsMap: Record<string, BoundingBox> = data.coordinates || {};

        if (extractedShipments.length > 0) {
          if (onOcrExtracted) {
            onOcrExtracted(extractedShipments, coordsMap);
          }
        } else {
          throw new Error("No shipments returned by the OCR pipeline.");
        }
      } catch (err: any) {
        clearInterval(stepInterval);
        setErrorMsg(err.message || "An unexpected error occurred during OCR.");
      } finally {
        setLoading(false);
        setLoadingStep("");
      }
    },
    [activeFilename]
  );

  const resetOcrWorkflow = useCallback(() => {
    setUploadFile(null);
    setActiveFilename("");
    setUploading(false);
    setLoading(false);
    setLoadingStep("");
    setErrorMsg("");
  }, []);

  return {
    uploadFile,
    setUploadFile,
    activeFilename,
    setActiveFilename,
    uploading,
    loading,
    loadingStep,
    errorMsg,
    setErrorMsg,
    uploadImage,
    handleRunOCR,
    resetOcrWorkflow,
  };
}
