"use client";

import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import type { Branch } from "@/types/branch";

interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

interface Shipment {
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

// Bounding box interface kept for layout/rendering purposes

export default function Dashboard() {
  // Global States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);

  // Upload States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeFilename, setActiveFilename] = useState<string>("sample.jpg");
  const [uploading, setUploading] = useState(false);

  // Entry Mode States
  const [entryMode, setEntryMode] = useState<"ocr" | "manual">("ocr");
  const [isManualWorkspace, setIsManualWorkspace] = useState(false);

  // Shipment Metadata Form State
  const [metadata, setMetadata] = useState({
    date: "",
    ourInvoiceNumber: "",
    vehicleNumber: "",
    fromAmtBranch: "",
    toAmtBranch: "",
  });

  // Deletion Confirmation Modal State
  const [rowToRemove, setRowToRemove] = useState<string | null>(null);

  // Review Screen Workspace States
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [coordinates, setCoordinates] = useState<Record<string, BoundingBox>>({});
  
  // No active AI state variables

  // Save States
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<any>(null);

  // Interactive Zoom/Pan States
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coordinatesRef = useRef(coordinates);
  useEffect(() => {
    coordinatesRef.current = coordinates;
  }, [coordinates]);

  // Fetch active branches from the database
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches?status=Active");
        if (!res.ok) throw new Error("Failed to fetch branches.");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const activeBranches: Branch[] = json.data;
          setBranches(activeBranches);

          // Validate current selections against new active branch list
          setMetadata((prev) => {
            let updatedFrom = prev.fromAmtBranch;
            let updatedTo = prev.toAmtBranch;
            let fromInvalid = false;
            let toInvalid = false;

            if (prev.fromAmtBranch) {
              const isActive = activeBranches.some((b) => b.branchName === prev.fromAmtBranch);
              if (!isActive) {
                updatedFrom = "";
                fromInvalid = true;
              }
            }

            if (prev.toAmtBranch) {
              const isActive = activeBranches.some((b) => b.branchName === prev.toAmtBranch);
              if (!isActive) {
                updatedTo = "";
                toInvalid = true;
              }
            }

            if (fromInvalid || toInvalid) {
              const invalidFields = [];
              if (fromInvalid) invalidFields.push("From Branch");
              if (toInvalid) invalidFields.push("To Branch");
              setErrorMsg(
                `Selected ${invalidFields.join(" and ")} is no longer active or has been deleted. Please select a valid branch.`
              );
            }

            return {
              ...prev,
              fromAmtBranch: updatedFrom,
              toAmtBranch: updatedTo,
            };
          });
        }
      } catch (err: any) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, []);

  const isBranchSelectionValid =
    metadata.fromAmtBranch.trim() !== "" &&
    metadata.toAmtBranch.trim() !== "" &&
    metadata.fromAmtBranch !== metadata.toAmtBranch;

  // Client-side row validation
  const validateRow = (shipment: Shipment): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!shipment.fromCompany || shipment.fromCompany.trim() === "") {
      errors.push("Missing From Company");
    }
    if (!shipment.customerInvoice || shipment.customerInvoice.trim() === "") {
      errors.push("Missing Customer Invoice");
    }
    if (!shipment.toCompany || shipment.toCompany.trim() === "") {
      errors.push("Missing To Company");
    }
    if (!shipment.packageType || shipment.packageType.trim() === "") {
      errors.push("Missing Package Type");
    }

    if (shipment.quantity === null || shipment.quantity === undefined) {
      errors.push("Invalid Quantity");
    } else {
      const qtyStr = String(shipment.quantity).trim();
      const pattern = /^\d+(?:\s*[xX*×]\s*\d+)*$/;
      if (!pattern.test(qtyStr)) {
        errors.push("Invalid Quantity");
      } else {
        const numbers = qtyStr.match(/\d+/g);
        if (numbers) {
          const hasZeroOrNegative = numbers.some((n) => parseInt(n) <= 0);
          if (hasZeroOrNegative) {
            errors.push("Invalid Quantity");
          }
        } else {
          errors.push("Invalid Quantity");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Handle Drag-and-Drop / Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]);
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setErrorMsg("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "File upload failed.");
      }

      const data = await response.json();
      setActiveFilename(data.filename);
      setUploadFile(file);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  // Run the single OCR Pipeline
  const handleRunOCR = async (filenameParam?: string) => {
    const targetFilename = filenameParam || activeFilename;
    setLoading(true);
    setSaveResult(null);
    setErrorMsg("");
    const steps = [
      "Initializing PaddleOCR Engine...",
      "Scanning register spatial layout...",
      "Grouping horizontal row structures...",
      "Resolving quote repetition propagation...",
      "Analyzing text blocks and lines...",
      "Assembling structured preview schema..."
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setLoadingStep(steps[stepIdx]);
      }
    }, 2500);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: targetFilename }),
      });
      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "OCR extraction failed.");
      }

      const data = await response.json();
      let extractedShipments: Shipment[] = [];
      let coordsMap: Record<string, BoundingBox> = {};

      if (data.shipments && Array.isArray(data.shipments)) {
        extractedShipments = data.shipments.map((s: any, idx: number) => {
          const shipment: Shipment = {
            id: String(s.rowNumber || idx + 1),
            fromCompany: s.fromCompany || "",
            customerInvoice: s.customerInvoice || "",
            toCompany: s.toCompany || "",
            packageType: s.packageType || "",
            quantity: s.quantity !== null && s.quantity !== undefined ? String(s.quantity) : null,
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

      if (data.coordinates) {
        coordsMap = data.coordinates;
      }

      if (extractedShipments.length > 0) {
        setShipments((prev) => {
          const manualRows = prev.filter((s) => s.isManual);
          const merged = [...manualRows, ...extractedShipments];
          const newCoords: Record<string, BoundingBox> = {};

          const updated = merged.map((s, idx) => {
            const newId = String(idx + 1);

            let coord: BoundingBox | undefined = undefined;
            if (prev.includes(s)) {
              coord = coordinatesRef.current[s.id];
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

          setCoordinates(newCoords);
          return updated;
        });
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
  };

  // Handle cell field edits
  const handleFieldChange = (
    shipmentId: string,
    field: keyof Shipment,
    value: string
  ) => {
    const updatedShipments = shipments.map((s) => {
      if (s.id === shipmentId) {
        const shipment = { ...s };

        if (field === "quantity") {
          shipment.quantity = value === "" ? null : value;
        } else {
          (shipment as any)[field] = value === "" ? null : value;
        }

        // Re-evaluate validation state
        const validation = validateRow(shipment);
        shipment.isValid = validation.isValid;
        shipment.validationErrors = validation.errors;

        return shipment;
      }
      return s;
    });

    setShipments(updatedShipments);
  };

  // Initiate row deletion by showing confirmation dialog
  const handleInitiateRemove = (shipmentId: string) => {
    setRowToRemove(shipmentId);
  };

  // Confirm row deletion: filters, renumbers, and re-keys bounding box coordinates
  const handleConfirmRemove = () => {
    if (!rowToRemove) return;
    
    // 1. Filter out the selected row
    const filtered = shipments.filter((s) => s.id !== rowToRemove);
    
    // 2. Re-number remaining rows and re-run validation on them
    const updated = filtered.map((s, idx) => {
      const newId = String(idx + 1);
      const shipment = {
        ...s,
        id: newId,
      };
      const validation = validateRow(shipment);
      shipment.isValid = validation.isValid;
      shipment.validationErrors = validation.errors;
      return shipment;
    });

    // 3. Re-key bounding boxes map coordinates
    const newCoords: Record<string, BoundingBox> = {};
    filtered.forEach((s, idx) => {
      const oldId = s.id;
      const newId = String(idx + 1);
      if (coordinates[oldId]) {
        newCoords[newId] = coordinates[oldId];
      }
    });

    setShipments(updated);
    setCoordinates(newCoords);
    setRowToRemove(null);
  };

  const handleAddRow = () => {
    setShipments((prev) => {
      const newId = String(prev.length + 1);
      const newRow: Shipment = {
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
      return [...prev, newRow];
    });
  };

  // AI helpers completely removed

  // Save approved valid rows to Excel
  const handleSaveAll = async () => {
    if (!isBranchSelectionValid) {
      alert("Origin and Destination branches cannot be the same. Please select different branches.");
      return;
    }
    setSaving(true);
    setSaveResult(null);

    const shipmentsToSave = shipments.map((s) => ({
      ...s,
      date: metadata.date,
      ourInvoiceNumber: metadata.ourInvoiceNumber,
      vehicleNumber: metadata.vehicleNumber,
      fromAmtBranch: metadata.fromAmtBranch,
      toAmtBranch: metadata.toAmtBranch,
    }));

    if (shipmentsToSave.length === 0) {
      alert("No shipments found to save.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: new Date().getFullYear(),
          month: new Date().toLocaleString("default", { month: "long" }),
          shipments: shipmentsToSave,
          imageFileName: activeFilename !== "sample.jpg" ? activeFilename : undefined,
          uploadSessionId: activeFilename !== "sample.jpg"
            ? `US-${activeFilename.split("-")[0]}`
            : `US-MANUAL-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save shipments to Excel.");
      }

      const resData = await response.json();
      setSaveResult(resData);

      if (resData.success) {
        alert(`Successfully saved ${resData.totalSaved} shipments to Excel!`);
        setShipments([]);
        setCoordinates({});
        // AI state cleanups removed
        setUploadFile(null);
        setActiveFilename("sample.jpg");
        setMetadata({
          date: "",
          ourInvoiceNumber: "",
          vehicleNumber: "",
          fromAmtBranch: "",
          toAmtBranch: "",
        });
      }
    } catch (err: any) {
      alert(err.message || "An error occurred while saving shipments.");
    } finally {
      setSaving(false);
    }
  };

  // Go back to the upload screen
  const handleBackToDashboard = () => {
    if (confirm("Are you sure you want to exit the review screen? Unsaved changes will be lost.")) {
      setShipments([]);
      setCoordinates({});
      // AI state cleanups removed
      setUploadFile(null);
      setActiveFilename("sample.jpg");
      setSaveResult(null);
      setErrorMsg("");
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

  // Interactive zoom/pan mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    setScale((prev) => {
      const nextScale = prev + direction * zoomFactor;
      return Math.min(Math.max(nextScale, 0.5), 4);
    });
  };

  // Stats
  const totalRows = shipments.length;
  const validRows = shipments.filter((s) => s.isValid).length;
  const invalidRows = totalRows - validRows;

  // Render a cell input
  const renderCellInput = (s: Shipment, field: keyof Shipment) => {
    const isQty = field === "quantity";
    const val = s[field];
    const stringVal = val === null || val === undefined ? "" : String(val);

    return (
      <td className="py-2.5 px-2 align-top">
        <div className="relative flex flex-col w-full min-w-[125px]">
          <input
            type="text"
            value={stringVal}
            onChange={(e) => handleFieldChange(s.id, field, e.target.value)}
            className="w-full bg-slate-950/80 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 transition-all border-slate-800 focus:border-violet-500 focus:ring-violet-500 text-slate-200"
          />
        </div>
      </td>
    );
  };

  const renderPaymentStatusCell = (s: Shipment) => {
    const val = s.paymentStatus || "Pending";
    const isPaid = val === "Paid";
    const isFree = val === "Free";

    return (
      <td className="py-2.5 px-2 align-top">
        <div className="relative flex items-center min-w-[120px]">
          <select
            value={val}
            onChange={(e) => handleFieldChange(s.id, "paymentStatus", e.target.value)}
            className={`w-full bg-slate-950/80 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 transition-all font-semibold cursor-pointer ${
              isPaid
                ? "border-emerald-800/80 text-emerald-400 bg-emerald-950/40 focus:border-emerald-500 focus:ring-emerald-500"
                : isFree
                ? "border-sky-800/80 text-sky-400 bg-sky-950/40 focus:border-sky-500 focus:ring-sky-500"
                : "border-amber-800/80 text-amber-400 bg-amber-950/40 focus:border-amber-500 focus:ring-amber-500"
            }`}
          >
            <option value="Paid" className="bg-slate-950 text-emerald-400">🟢 Paid</option>
            <option value="Pending" className="bg-slate-950 text-amber-400">🟡 Pending</option>
            <option value="Free" className="bg-slate-950 text-sky-400">🔵 Free</option>
          </select>
        </div>
      </td>
    );
  };

  // ========================================================
  // RENDER WORKSPACE: SPLIT SCREEN REVIEW WORKSPACE OR MANUAL TABLE
  // ========================================================
  if (uploadFile !== null || isManualWorkspace) {
    return (
      <AdminLayout>
        <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#070b13]">
        {/* Workspace Header Toolbar */}
        <header className="flex flex-col md:flex-row justify-between items-stretch md:items-center px-6 py-4 bg-slate-900/70 border-b border-slate-800 gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToDashboard}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <h1 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span>OCR Review Screen</span>
                <span className="text-[10px] font-mono font-normal text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 max-w-[150px] truncate">
                  {activeFilename}
                </span>
                {loading && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/25 px-2 py-0.5 rounded-full animate-pulse font-normal">
                    <svg className="animate-spin h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{loadingStep || "Processing OCR..."}</span>
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-full">
              Total Rows: {totalRows}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
              Valid: {validRows}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
              Invalid: {invalidRows}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleRunOCR()}
              disabled={loading || saving || !isBranchSelectionValid}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-355 hover:text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                  </svg>
                  <span>Run OCR</span>
                </>
              )}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || !isBranchSelectionValid}
              className="px-4.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save to Excel</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Secondary Header: Shipment Metadata Form */}
        <section className="bg-slate-900/40 border-b border-slate-800/80 px-6 py-2.5 backdrop-blur-md flex flex-wrap gap-4 items-center select-none">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shipment Info</div>
          
          {/* Date */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Date</span>
            <input 
              type="date"
              value={metadata.date}
              onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
              className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
            />
          </div>

          {/* Invoice Number */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Invoice No</span>
            <input 
              type="text"
              placeholder="e.g. TX-49502"
              value={metadata.ourInvoiceNumber}
              onChange={(e) => setMetadata({ ...metadata, ourInvoiceNumber: e.target.value })}
              className="w-28 bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 placeholder:text-slate-650 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
            />
          </div>

          {/* Vehicle Number */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Vehicle No</span>
            <input 
              type="text"
              placeholder="e.g. TN23 L4495"
              value={metadata.vehicleNumber}
              onChange={(e) => setMetadata({ ...metadata, vehicleNumber: e.target.value })}
              className="w-28 bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 placeholder:text-slate-650 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
            />
          </div>

          {/* From Branch */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">From</span>
            <select
              value={metadata.fromAmtBranch}
              onChange={(e) => setMetadata({ ...metadata, fromAmtBranch: e.target.value })}
              className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer animate-none"
            >
              <option value="" className="text-slate-650">Select Origin</option>
              {branches.map((b) => (
                <option key={b.branchId} value={b.branchName} disabled={b.branchName === metadata.toAmtBranch}>
                  {b.branchName} {b.branchName === metadata.toAmtBranch ? "(Selected in To)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* To Branch */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">To</span>
            <select
              value={metadata.toAmtBranch}
              onChange={(e) => setMetadata({ ...metadata, toAmtBranch: e.target.value })}
              className="bg-slate-955/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
            >
              <option value="" className="text-slate-655">Select Destination</option>
              {branches.map((b) => (
                <option key={b.branchId} value={b.branchName} disabled={b.branchName === metadata.fromAmtBranch}>
                  {b.branchName} {b.branchName === metadata.fromAmtBranch ? "(Selected in From)" : ""}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Same-branch Validation Warning */}
        {metadata.fromAmtBranch && metadata.toAmtBranch && metadata.fromAmtBranch === metadata.toAmtBranch && (
          <div className="mx-6 mt-4 p-3 bg-red-955/20 border border-red-900/50 rounded-xl text-red-400 text-xs flex items-center gap-2 animate-pulse">
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold">Validation Error: Origin and Destination branches cannot be the same.</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="font-bold">OCR Pipeline Error: </span>
                <span className="font-mono text-[11px]">{errorMsg}</span>
              </div>
            </div>
            <button 
              onClick={() => setErrorMsg("")}
              className="text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer px-2 py-1 hover:bg-slate-800 rounded-md"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Split Screen Workspace Area */}
        <div className={`flex-1 grid grid-cols-1 ${entryMode === "ocr" ? "lg:grid-cols-2" : "lg:grid-cols-1"} overflow-hidden`}>
          {/* Left Panel: Dynamic Register Image Viewport (OCR Mode Only) */}
          {entryMode === "ocr" && (
            <section className="flex flex-col border-r border-slate-800/80 bg-[#080d16] h-full overflow-hidden">
            <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/50 flex justify-between items-center text-xs font-semibold text-slate-400 select-none">
              <span>Register Image Viewport</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-normal">
                <span>Drag to pan | Scroll to zoom</span>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center">
              {/* Zoom buttons overlay */}
              <div className="absolute bottom-4 right-4 z-10 flex gap-1.5 shadow-2xl bg-slate-900/90 border border-slate-800/85 p-1 rounded-xl backdrop-blur-md select-none">
                <button
                  onClick={zoomIn}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={zoomOut}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={resetZoom}
                  className="px-2 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white text-2xs font-bold rounded-lg transition-colors cursor-pointer border-l border-slate-800"
                  title="Reset Zoom"
                >
                  100%
                </button>
              </div>

              {/* Pan Viewport */}
              <div
                className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative flex items-center justify-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <img
                  src={`/api/image?filename=${activeFilename}`}
                  alt="Current Session Register"
                  draggable={false}
                  className="max-w-full max-h-full object-contain pointer-events-none select-none"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? "none" : "transform 0.15s ease-out",
                    transformOrigin: "center center",
                  }}
                />
              </div>
            </div>
          </section>
          )}

          {/* Right Panel: Editable Shipment Table */}
          <section className="flex flex-col bg-[#0b101c] h-full overflow-hidden">
            <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/50 flex justify-between items-center text-xs font-semibold text-slate-400 select-none">
              <div className="flex items-center gap-2">
                <span>Editable Shipment Table</span>
                <span className="text-[10px] text-slate-500 font-normal">Edit cells and review values</span>
              </div>
              <button
                onClick={handleAddRow}
                className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold rounded-lg shadow flex items-center gap-1 cursor-pointer transition-all"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Row</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/30 sticky top-0 z-20 backdrop-blur-sm select-none">
                    <th className="py-2.5 px-3 w-16">Row ID</th>
                    <th className="py-2.5 px-2.5">From Company</th>
                    <th className="py-2.5 px-2.5">Customer Invoice</th>
                    <th className="py-2.5 px-2.5">To Company</th>
                    <th className="py-2.5 px-2.5">Package Type</th>
                    <th className="py-2.5 px-2.5 w-24">Quantity</th>
                    <th className="py-2.5 px-2.5 w-32">Payment Status</th>
                    <th className="py-2.5 px-2.5 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {shipments.map((s) => {
                    return (
                      <React.Fragment key={s.id}>
                        <tr
                          className={`transition-colors hover:bg-slate-855/30 group ${
                            !s.isValid ? "bg-red-955/5 border-l-2 border-red-500" : ""
                          }`}
                        >
                          {/* Row ID label */}
                          <td className="py-3 px-3 font-mono text-[10px] text-slate-500 align-middle select-none">
                            Row {s.id}
                          </td>

                          {/* Render cells */}
                          {renderCellInput(s, "fromCompany")}
                          {renderCellInput(s, "customerInvoice")}
                          {renderCellInput(s, "toCompany")}
                          {renderCellInput(s, "packageType")}
                          {renderCellInput(s, "quantity")}
                          {renderPaymentStatusCell(s)}
                          
                          {/* Actions: Remove row button */}
                          <td className="py-2.5 px-2.5 align-middle text-center">
                            <button
                              onClick={() => handleInitiateRemove(s.id)}
                              className="p-1.5 bg-red-950/40 border border-red-900/50 hover:bg-red-900/20 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                              title="Remove Row"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {/* Review Required Row */}
                        {!s.isValid && (
                          <tr className="bg-red-500/5 border-l-2 border-red-500/60 select-none">
                            <td colSpan={8} className="py-1.5 px-4">
                              <div className="flex items-center gap-2 text-[10px] text-red-400 font-medium">
                                <svg className="h-3.5 w-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Review Required: {s.validationErrors.join(", ")}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Deletion Confirmation Modal Overlay */}
        {rowToRemove && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-lg font-bold text-slate-200 mb-2">Remove this shipment?</h3>
              <p className="text-xs text-slate-400 mb-6">This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRowToRemove(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  className="px-4 py-2 bg-red-650 hover:bg-red-650 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </AdminLayout>
    );
  }

  // ========================================================
  // RENDER HOME: DASHBOARD OCR SCAN TRIGGER & FILE UPLOAD
  // ========================================================
  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto select-none">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row justify-between items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            TMS transOS
          </h1> 
          <p className="text-slate-400 mt-1 font-medium">Shipment Entry Console</p>
        </div>
        
        {/* Entry Mode Toggle */}
        <div className="flex bg-slate-900/60 border border-slate-800 rounded-xl p-1 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setEntryMode("ocr")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              entryMode === "ocr" ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📷</span> OCR Upload
          </button>
          <button
            onClick={() => setEntryMode("manual")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              entryMode === "manual" ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>✍️</span> Manual Entry
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Engine Online
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Step 1: Shipment Information Card */}
        <section className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md border border-slate-850 p-6 rounded-2xl flex flex-col justify-between shadow-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-200 mb-2 flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-violet-500/10 text-violet-400 text-xs font-bold border border-violet-500/25">1</span>
              <span>Shipment Information</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">Enter details that apply to the entire register sheet.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Register Date */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Register Date</label>
                <input 
                  type="date"
                  value={metadata.date}
                  onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
                />
              </div>

              {/* Transport Invoice Number */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Transport Invoice Number</label>
                <input 
                  type="text"
                  placeholder="e.g. TX-49502"
                  value={metadata.ourInvoiceNumber}
                  onChange={(e) => setMetadata({ ...metadata, ourInvoiceNumber: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-650 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
                />
              </div>

              {/* Vehicle Number */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle Number</label>
                <input 
                  type="text"
                  placeholder="e.g. TN23 L4495"
                  value={metadata.vehicleNumber}
                  onChange={(e) => setMetadata({ ...metadata, vehicleNumber: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-650 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
                />
              </div>

              {/* Empty space */}
              <div></div>

              {/* From Branch */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">From Branch</label>
                <select
                  value={metadata.fromAmtBranch}
                  onChange={(e) => setMetadata({ ...metadata, fromAmtBranch: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
                >
                  <option value="" className="text-slate-650">Select Origin Branch</option>
                  {branches.map((b) => (
                    <option key={b.branchId} value={b.branchName} disabled={b.branchName === metadata.toAmtBranch}>
                      {b.branchName} {b.branchName === metadata.toAmtBranch ? "(Selected in To)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Branch */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">To Branch</label>
                <select
                  value={metadata.toAmtBranch}
                  onChange={(e) => setMetadata({ ...metadata, toAmtBranch: e.target.value })}
                  className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
                >
                  <option value="" className="text-slate-655">Select Destination Branch</option>
                  {branches.map((b) => (
                    <option key={b.branchId} value={b.branchName} disabled={b.branchName === metadata.fromAmtBranch}>
                      {b.branchName} {b.branchName === metadata.fromAmtBranch ? "(Selected in From)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Same-branch Validation Warning */}
              {metadata.fromAmtBranch && metadata.toAmtBranch && metadata.fromAmtBranch === metadata.toAmtBranch && (
                <p className="col-span-2 text-xs text-red-400 font-semibold mt-2 flex items-center gap-1.5 animate-pulse">
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Origin and Destination branches cannot be the same.</span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-850/60 text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
            <span>All shipment-level information fields are required.</span>
          </div>
        </section>

        {/* Step 2 & 3 Card */}
        {entryMode === "ocr" ? (
          <section className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md border border-slate-850 p-6 rounded-2xl flex flex-col justify-between shadow-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-200 mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-violet-500/10 text-violet-400 text-xs font-bold border border-violet-500/25">2</span>
                <span>Upload Image & Run OCR</span>
              </h2>
              <p className="text-xs text-slate-400 mb-6">Select register sheet and extract data entries.</p>
                    {/* Upload panel */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-5 mb-5 text-center cursor-pointer transition-all hover:bg-slate-850/50 flex flex-col items-center justify-center border-slate-800 hover:border-slate-700 bg-slate-950/40"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden" 
                />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-6 w-6 text-violet-400 mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-xs text-slate-400 font-semibold">Uploading image...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg className="h-6 w-6 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-xs text-slate-300 font-semibold">Upload Register Image</p>
                    <span className="text-[10px] text-slate-500 mt-1">Select PNG, JPG, or JPEG</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              {/* Step 3 Trigger */}
              <button
                onClick={() => handleRunOCR()}
                disabled={loading || uploading || !uploadFile || !(metadata.date.trim() !== "" && metadata.ourInvoiceNumber.trim() !== "" && metadata.vehicleNumber.trim() !== "" && isBranchSelectionValid)}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing OCR...</span>
                  </>
                ) : (
                  <span>Run OCR Pipeline</span>
                )}
              </button>

              {/* Validation warning */}
              {(!uploadFile || !(metadata.date.trim() !== "" && metadata.ourInvoiceNumber.trim() !== "" && metadata.vehicleNumber.trim() !== "" && metadata.fromAmtBranch.trim() !== "" && metadata.toAmtBranch.trim() !== "")) && (
                <p className="text-[10px] text-slate-500 mt-3 text-center leading-normal">
                  {!uploadFile && !(metadata.date.trim() !== "" && metadata.ourInvoiceNumber.trim() !== "" && metadata.vehicleNumber.trim() !== "" && metadata.fromAmtBranch.trim() !== "" && metadata.toAmtBranch.trim() !== "")
                    ? "Please complete all fields (Step 1) and upload an image (Step 2)."
                    : !uploadFile
                    ? "Please upload a register sheet image (Step 2)."
                    : "Please fill in all Shipment Information fields (Step 1)."}
                </p>
              )}

              {loading && (
                <div className="mt-5 p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 text-center animate-pulse">
                  <p className="text-[11px] text-violet-400 font-mono">{loadingStep}</p>
                </div>
              )}

              {errorMsg && (
                <div className="mt-5 p-3.5 bg-red-950/40 rounded-lg border border-red-900/50 text-red-400 text-xs">
                  <p className="font-semibold">Pipeline Error:</p>
                  <p className="text-[10px] font-mono mt-1 leading-relaxed">{errorMsg}</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md border border-slate-850 p-6 rounded-2xl flex flex-col justify-between shadow-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-200 mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-violet-500/10 text-violet-400 text-xs font-bold border border-violet-500/25">2</span>
                <span>Start Manual Entry</span>
              </h2>
              <p className="text-xs text-slate-400 mb-6">Create empty rows and enter shipments manually.</p>
            </div>
            
            <div>
              <button
                onClick={() => {
                  setIsManualWorkspace(true);
                  handleAddRow();
                }}
                disabled={!(metadata.date.trim() !== "" && metadata.ourInvoiceNumber.trim() !== "" && metadata.vehicleNumber.trim() !== "" && isBranchSelectionValid)}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Add Shipment Row</span>
              </button>

              {!(metadata.date.trim() !== "" && metadata.ourInvoiceNumber.trim() !== "" && metadata.vehicleNumber.trim() !== "" && metadata.fromAmtBranch.trim() !== "" && metadata.toAmtBranch.trim() !== "") && (
                <p className="text-[10px] text-slate-500 mt-3 text-center leading-normal">
                  Please fill in all Shipment Information fields (Step 1) before adding a row.
                </p>
              )}
            </div>
          </section>
        )}
      </main>
      </div>
    </AdminLayout>
  );
}