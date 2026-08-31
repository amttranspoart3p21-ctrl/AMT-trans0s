"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Layout from "@/components/layout/Layout";
import type { Branch } from "@/types/branch";
import type { OcrMetadata, EntryMode } from "@/types/ocr";
import {
  validateBranchSelection,
  reconcileActiveBranches,
} from "@/validators/ocr.validator";
import { buildSaveShipmentsPayload } from "@/utils/ocr-transformers";
import { fetchActiveBranches, saveShipmentsBatch } from "@/services/ocr.api";
import { useImageViewer } from "@/hooks/useImageViewer";
import { useShipmentRows } from "@/hooks/useShipmentRows";
import { useOcrWorkflow } from "@/hooks/useOcrWorkflow";
import EntryWorkspace from "@/components/ocr/entry/EntryWorkspace";
import ReviewWorkspace from "@/components/ocr/review/ReviewWorkspace";

/**
 * OCRPageClient client-side orchestrator:
 * - Owns and orchestrates client state, metadata, and custom hooks
 * - Fetches active branches and synchronizes branch reconciliation
 * - Wires user actions to API services and transformation pipelines
 * - Coordinates view switching between EntryWorkspace and ReviewWorkspace
 */
export default function OCRPageClient() {
  const [branches, setBranches] = useState<Branch[]>([]);

  // Entry Mode States
  const [entryMode, setEntryMode] = useState<EntryMode>("ocr");
  const [isManualWorkspace, setIsManualWorkspace] = useState(false);
  const [isInReviewWorkspace, setIsInReviewWorkspace] = useState(false);

  // Shipment Metadata Form State
  const [metadata, setMetadata] = useState<OcrMetadata>({
    date: "",
    ourInvoiceNumber: "",
    vehicleNumber: "",
    fromAmtBranch: "",
    toAmtBranch: "",
  });

  // Save States
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<any>(null);

  // OCR Ingestion Workflow Hook
  const {
    uploadFile,
    activeFilename,
    uploading,
    loading,
    loadingStep,
    errorMsg,
    setErrorMsg,
    uploadImage,
    handleRunOCR,
    resetOcrWorkflow,
  } = useOcrWorkflow();

  // Interactive Zoom/Pan Hook
  const {
    scale,
    position,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    imgRef,
  } = useImageViewer();

  // Shipment Rows Hook
  const {
    shipments,
    coordinates,
    rowToRemove,
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
  } = useShipmentRows();

  // Fetch active branches from the database
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const activeBranches = await fetchActiveBranches();
        setBranches(activeBranches);

        // Validate current selections against new active branch list
        setMetadata((prev) => {
          const result = reconcileActiveBranches(
            prev.fromAmtBranch,
            prev.toAmtBranch,
            activeBranches
          );

          if (result.errorMessage) {
            setErrorMsg(result.errorMessage);
          }

          return {
            ...prev,
            fromAmtBranch: result.updatedFrom,
            toAmtBranch: result.updatedTo,
          };
        });
      } catch (err: any) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, []);

  const isBranchSelectionValid = validateBranchSelection(
    metadata.fromAmtBranch,
    metadata.toAmtBranch
  );

  // Handle Drag-and-Drop / Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!isInReviewWorkspace) {
        const isFormComplete =
          metadata.date.trim() !== "" &&
          metadata.ourInvoiceNumber.trim() !== "" &&
          metadata.vehicleNumber.trim() !== "" &&
          metadata.fromAmtBranch.trim() !== "" &&
          metadata.toAmtBranch.trim() !== "" &&
          isBranchSelectionValid;

        if (!isFormComplete) {
          toast.error(
            "Please fill in all Shipment Information (Step 1) before uploading the register image."
          );
          e.target.value = "";
          return;
        }

        // Upload image and redirect to Review Workspace upon upload completion
        uploadImage(file, () => {
          resetShipments();
          setSaveResult(null);
          resetZoom();
          setIsInReviewWorkspace(true);
        });
      } else {
        // Change image within Review Workspace
        uploadImage(file, () => {
          resetShipments();
          setSaveResult(null);
          resetZoom();
        });
      }
    }
    e.target.value = "";
  };

  // Continue to review screen from entry
  const handleProceedToReview = () => {
    if (uploadFile && isBranchSelectionValid) {
      setIsInReviewWorkspace(true);
    }
  };

  // Save approved valid rows to Excel
  const handleSaveAll = async () => {
    if (!isBranchSelectionValid) {
      toast.error(
        "Origin and Destination branches cannot be the same. Please select different branches."
      );
      return;
    }
    setSaving(true);
    setSaveResult(null);

    if (shipments.length === 0) {
      toast.error("No shipments found to save.");
      setSaving(false);
      return;
    }

    const payload = buildSaveShipmentsPayload(
      metadata,
      shipments,
      activeFilename
    );

    try {
      const resData = await saveShipmentsBatch(payload);
      setSaveResult(resData);

      if (resData.success && resData.totalSaved > 0) {
        toast.success(`Successfully saved ${resData.totalSaved} shipment(s) to Excel!`);
        resetShipments();
        resetOcrWorkflow();
        setIsInReviewWorkspace(false);
        setIsManualWorkspace(false);
        setMetadata({
          date: "",
          ourInvoiceNumber: "",
          vehicleNumber: "",
          fromAmtBranch: "",
          toAmtBranch: "",
        });
      } else {
        const errorDetail =
          resData.failedRows?.[0]?.error ||
          "No shipments were saved. Please verify row details and date.";
        toast.error(`Failed to save shipments to Excel: ${errorDetail}`);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving shipments.");
    } finally {
      setSaving(false);
    }
  };

  // Go back to the upload screen
  const handleBackToDashboard = () => {
    if (
      confirm(
        "Are you sure you want to exit the review screen? Unsaved changes will be lost."
      )
    ) {
      resetShipments();
      resetOcrWorkflow();
      setSaveResult(null);
      setIsInReviewWorkspace(false);
      setIsManualWorkspace(false);
      setMetadata({
        date: "",
        ourInvoiceNumber: "",
        vehicleNumber: "",
        fromAmtBranch: "",
        toAmtBranch: "",
      });
    }
  };

  if (isInReviewWorkspace) {
    return (
      <Layout>
        <ReviewWorkspace
          entryMode={entryMode}
          onBack={handleBackToDashboard}
          metadata={metadata}
          onMetadataChange={setMetadata}
          branches={branches}
          isBranchSelectionValid={isBranchSelectionValid}
          uploadFile={uploadFile}
          activeFilename={activeFilename}
          uploading={uploading}
          onFileChange={handleFileChange}
          loading={loading}
          loadingStep={loadingStep}
          errorMsg={errorMsg}
          onErrorDismiss={() => setErrorMsg("")}
          onRunOCR={() => handleRunOCR(undefined, mergeExtractedOcrRows)}
          saving={saving}
          onSaveAll={handleSaveAll}
          scale={scale}
          position={position}
          isDragging={isDragging}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetZoom={resetZoom}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          handleWheel={handleWheel}
          imgRef={imgRef}
          shipments={shipments}
          coordinates={coordinates}
          totalRows={totalRows}
          validRows={validRows}
          invalidRows={invalidRows}
          rowToRemove={rowToRemove}
          onFieldChange={handleFieldChange}
          onAddRow={handleAddRow}
          onInitiateRemove={handleInitiateRemove}
          onCancelRemove={handleCancelRemove}
          onConfirmRemove={handleConfirmRemove}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <EntryWorkspace
        entryMode={entryMode}
        onSelectEntryMode={(mode) => {
          setEntryMode(mode);
          resetOcrWorkflow();
          resetShipments();
        }}
        metadata={metadata}
        onMetadataChange={setMetadata}
        branches={branches}
        isBranchSelectionValid={isBranchSelectionValid}
        uploadFile={uploadFile}
        uploading={uploading}
        onFileChange={handleFileChange}
        loading={loading}
        loadingStep={loadingStep}
        errorMsg={errorMsg}
        onRunOCR={handleProceedToReview}
        onStartManualEntry={() => {
          setIsInReviewWorkspace(true);
          setIsManualWorkspace(true);
          handleAddRow();
        }}
      />
    </Layout>
  );
}
