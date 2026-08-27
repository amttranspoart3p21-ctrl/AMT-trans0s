import { useState, useEffect, useRef } from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { MasterDataContext } from "../utils/calculatePricingLocally";
import { applyRowUpdates } from "../utils/applyRowUpdates";
import { logPricingDebug } from "../utils/pricingDebug";

const DRAFT_STORAGE_KEY = "tms_shipments_spreadsheet_draft";

export interface SpreadsheetDraft {
  version: 1;
  mode: "spreadsheet";
  editedRows: Record<string, { original: ShipmentRecord; current: ShipmentRecord }>;
  manualOverrides: Record<string, string[]>;
  timestamp: number;
}

export interface EditSnapshot {
  shipments: ShipmentRecord[];
  editedRows: Record<string, { original: ShipmentRecord; current: ShipmentRecord }>;
  manualOverrides: Record<string, Set<string>>;
}

export interface UseSpreadsheetEditingParams {
  shipments: ShipmentRecord[];
  setShipments: React.Dispatch<React.SetStateAction<ShipmentRecord[]>>;
  masterData: MasterDataContext;
  onRefreshData: () => Promise<void>;
  onToast: (msg: string) => void;
}

export interface UseSpreadsheetEditingReturn {
  mode: "read-only" | "spreadsheet";
  setMode: React.Dispatch<React.SetStateAction<"read-only" | "spreadsheet">>;
  editedRows: Record<string, { original: ShipmentRecord; current: ShipmentRecord }>;
  setEditedRows: React.Dispatch<React.SetStateAction<Record<string, { original: ShipmentRecord; current: ShipmentRecord }>>>;
  manualOverrides: Record<string, Set<string>>;
  highlightedCells: Record<string, Set<string>>;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasChanges: boolean;
  modifiedCount: number;
  handleCellChange: (shipmentId: string, field: keyof ShipmentRecord, value: any) => void;
  handleBatchCellChanges: (rowUpdates: Record<string, Partial<ShipmentRecord>>) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleDiscardChanges: () => void;
  handleSaveAllChanges: () => Promise<void>;
}

export function useSpreadsheetEditing({
  shipments,
  setShipments,
  masterData,
  onRefreshData,
  onToast,
}: UseSpreadsheetEditingParams): UseSpreadsheetEditingReturn {
  // Spreadsheet Mode state
  const [mode, setMode] = useState<"read-only" | "spreadsheet">("read-only");

  // Selection & Dirty States
  const [editedRows, setEditedRows] = useState<Record<string, { original: ShipmentRecord; current: ShipmentRecord }>>({});
  const [saving, setSaving] = useState<boolean>(false);

  const [manualOverrides, setManualOverrides] = useState<Record<string, Set<string>>>({});
  const [highlightedCells, setHighlightedCells] = useState<Record<string, Set<string>>>({});

  const draftRestoredRef = useRef<boolean>(false);

  // Restore unsaved spreadsheet draft from localStorage on initial client mount
  useEffect(() => {
    if (draftRestoredRef.current) return;
    draftRestoredRef.current = true;

    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.version === 1 &&
        parsed.mode === "spreadsheet" &&
        parsed.editedRows &&
        typeof parsed.editedRows === "object" &&
        Object.keys(parsed.editedRows).length > 0
      ) {
        const validEdits: Record<string, { original: ShipmentRecord; current: ShipmentRecord }> = {};
        for (const [id, val] of Object.entries(parsed.editedRows)) {
          const item = val as any;
          if (
            item &&
            item.original &&
            item.current &&
            typeof item.original === "object" &&
            typeof item.current === "object" &&
            item.original.shipmentId &&
            item.current.shipmentId
          ) {
            validEdits[id] = {
              original: item.original,
              current: item.current,
            };
          }
        }

        if (Object.keys(validEdits).length > 0) {
          setMode("spreadsheet");
          setEditedRows(validEdits);

          // Restore manual overrides
          if (parsed.manualOverrides && typeof parsed.manualOverrides === "object") {
            const restoredOverrides: Record<string, Set<string>> = {};
            for (const [id, arr] of Object.entries(parsed.manualOverrides)) {
              if (Array.isArray(arr)) {
                restoredOverrides[id] = new Set(arr as string[]);
              }
            }
            setManualOverrides(restoredOverrides);
          }

          // Apply restored edits to current shipments state if already loaded
          setShipments((prev) =>
            prev.map((s) => {
              const editState = validEdits[s.shipmentId];
              return editState ? { ...editState.current } : s;
            })
          );
        } else {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch (err) {
      console.error("Error restoring spreadsheet draft from localStorage:", err);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (_) {}
    }
  }, [setShipments]);

  // Sync active spreadsheet draft to localStorage whenever editedRows, manualOverrides, or mode changes
  useEffect(() => {
    if (!draftRestoredRef.current) return;
    if (typeof window === "undefined") return;

    try {
      if (Object.keys(editedRows).length > 0) {
        const serializableOverrides: Record<string, string[]> = {};
        Object.entries(manualOverrides).forEach(([id, set]) => {
          if (set && set.size > 0) {
            serializableOverrides[id] = Array.from(set);
          }
        });

        const draft: SpreadsheetDraft = {
          version: 1,
          mode: "spreadsheet",
          editedRows,
          manualOverrides: serializableOverrides,
          timestamp: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch (err) {
      console.error("Error persisting spreadsheet draft to localStorage:", err);
    }
  }, [editedRows, manualOverrides, mode]);

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<EditSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditSnapshot[]>([]);

  const pushToUndo = (
    currentShipments: ShipmentRecord[],
    currentEditedRows: Record<string, { original: ShipmentRecord; current: ShipmentRecord }>,
    currentOverrides: Record<string, Set<string>>
  ) => {
    const clonedOverrides: Record<string, Set<string>> = {};
    Object.entries(currentOverrides).forEach(([id, s]) => {
      clonedOverrides[id] = new Set(s);
    });

    setUndoStack((prev) => [
      ...prev,
      {
        shipments: JSON.parse(JSON.stringify(currentShipments)),
        editedRows: JSON.parse(JSON.stringify(currentEditedRows)),
        manualOverrides: clonedOverrides,
      },
    ]);
    setRedoStack([]); // Clear redo stack on new action
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    const clonedOverrides: Record<string, Set<string>> = {};
    Object.entries(manualOverrides).forEach(([id, s]) => {
      clonedOverrides[id] = new Set(s);
    });
    setRedoStack((prev) => [
      ...prev,
      {
        shipments: JSON.parse(JSON.stringify(shipments)),
        editedRows: JSON.parse(JSON.stringify(editedRows)),
        manualOverrides: clonedOverrides,
      },
    ]);

    setShipments(previous.shipments);
    setEditedRows(previous.editedRows);
    setManualOverrides(previous.manualOverrides);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    const clonedOverrides: Record<string, Set<string>> = {};
    Object.entries(manualOverrides).forEach(([id, s]) => {
      clonedOverrides[id] = new Set(s);
    });
    setUndoStack((prev) => [
      ...prev,
      {
        shipments: JSON.parse(JSON.stringify(shipments)),
        editedRows: JSON.parse(JSON.stringify(editedRows)),
        manualOverrides: clonedOverrides,
      },
    ]);

    setShipments(next.shipments);
    setEditedRows(next.editedRows);
    setManualOverrides(next.manualOverrides);
  };

  // Triggers visual flash highlight
  const triggerHighlight = (shipmentId: string, fields: string[]) => {
    setHighlightedCells((prev) => {
      const existing = prev[shipmentId] ? new Set(prev[shipmentId]) : new Set<string>();
      fields.forEach((f) => existing.add(f));
      return { ...prev, [shipmentId]: existing };
    });

    setTimeout(() => {
      setHighlightedCells((prev) => {
        const existing = prev[shipmentId] ? new Set(prev[shipmentId]) : new Set<string>();
        fields.forEach((f) => existing.delete(f));
        const next = { ...prev };
        if (existing.size === 0) {
          delete next[shipmentId];
        } else {
          next[shipmentId] = existing;
        }
        return next;
      });
    }, 1000);
  };

  const handleBatchCellChanges = (rowUpdates: Record<string, Partial<ShipmentRecord>>) => {
    const dirtyIds = Object.keys(rowUpdates);
    if (dirtyIds.length === 0) return;

    pushToUndo(shipments, editedRows, manualOverrides);

    const highlightsToTrigger: Record<string, string[]> = {};
    const nextManualOverridesMap: Record<string, Set<string>> = {};
    const updatedRecordsMap: Record<string, ShipmentRecord> = {};
    const originalRecordsMap: Record<string, ShipmentRecord> = {};

    // 1. Pre-calculate updates using functional parameters
    dirtyIds.forEach((shipmentId) => {
      const currentShipment = shipments.find((s) => s.shipmentId === shipmentId);
      if (!currentShipment) return;

      const existing = manualOverrides[shipmentId] ? new Set(manualOverrides[shipmentId]) : new Set<string>();
      Object.keys(rowUpdates[shipmentId]).forEach((field) => {
        existing.add(field);
      });
      nextManualOverridesMap[shipmentId] = existing;

      const originalRecord = editedRows[shipmentId]?.original || currentShipment;
      originalRecordsMap[shipmentId] = originalRecord;

      const { updatedShipment, autoFills, focusField } = applyRowUpdates(
        currentShipment,
        rowUpdates[shipmentId],
        existing,
        masterData
      );
      updatedRecordsMap[shipmentId] = updatedShipment;

      if (focusField) {
        setTimeout(() => {
          const el = document.getElementById(`cell-${shipmentId}-${focusField}`);
          if (el) {
            el.focus();
            if (el instanceof HTMLInputElement) el.select();
          }
        }, 50);
      }

      const filledKeys = Object.keys(autoFills).filter(
        (k) => autoFills[k as keyof ShipmentRecord] !== currentShipment[k as keyof ShipmentRecord]
      );
      if (filledKeys.length > 0) {
        highlightsToTrigger[shipmentId] = filledKeys;
      }
    });

    // 2. Perform batched atomic state updates
    setManualOverrides((prev) => {
      const next = { ...prev };
      Object.assign(next, nextManualOverridesMap);
      return next;
    });

    setShipments((prev) =>
      prev.map((s) => {
        if (updatedRecordsMap[s.shipmentId]) {
          return updatedRecordsMap[s.shipmentId];
        }
        return s;
      })
    );

    setEditedRows((prev) => {
      const next = { ...prev };
      dirtyIds.forEach((shipmentId) => {
        if (updatedRecordsMap[shipmentId]) {
          next[shipmentId] = {
            original: originalRecordsMap[shipmentId],
            current: updatedRecordsMap[shipmentId],
          };
        }
      });
      return next;
    });

    // 3. Trigger highlights
    Object.entries(highlightsToTrigger).forEach(([shipmentId, fields]) => {
      triggerHighlight(shipmentId, fields);
    });
  };

  // Cell Change Handler (Runs Smart Auto-Fill & Business Rules locally)
  const handleCellChange = (shipmentId: string, field: keyof ShipmentRecord, value: any) => {
    pushToUndo(shipments, editedRows, manualOverrides);
    setManualOverrides((prev) => {
      const existing = prev[shipmentId] ? new Set(prev[shipmentId]) : new Set<string>();
      existing.add(field);
      return { ...prev, [shipmentId]: existing };
    });

    const originalRecord = shipments.find((s) => s.shipmentId === shipmentId)!;
    logPricingDebug(`Cell Change Start (Field: ${String(field)} = ${value})`, originalRecord);

    const existingOverrides = manualOverrides[shipmentId] ? new Set(manualOverrides[shipmentId]) : new Set<string>();
    existingOverrides.add(field);

    const { updatedShipment, autoFills, focusField } = applyRowUpdates(
      originalRecord,
      { [field]: value },
      existingOverrides,
      masterData
    );
    logPricingDebug(`After applyRowUpdates (Field: ${String(field)})`, updatedShipment);

    if (focusField) {
      setTimeout(() => {
        const el = document.getElementById(`cell-${shipmentId}-${focusField}`);
        if (el) {
          el.focus();
          if (el instanceof HTMLInputElement) el.select();
        }
      }, 50);
    }

    const filledKeys = Object.keys(autoFills).filter(
      (k) => autoFills[k as keyof ShipmentRecord] !== originalRecord[k as keyof ShipmentRecord]
    );
    if (filledKeys.length > 0) {
      triggerHighlight(shipmentId, filledKeys);
    }

    setShipments((prev) =>
      prev.map((s) => (s.shipmentId === shipmentId ? updatedShipment : s))
    );

    setEditedRows((prev) => {
      const existing = prev[shipmentId];
      const original = existing ? existing.original : { ...originalRecord };
      return {
        ...prev,
        [shipmentId]: {
          original,
          current: updatedShipment,
        },
      };
    });
    logPricingDebug(`After setState (Field: ${String(field)})`, updatedShipment);
  };

  // Discard spreadsheet changes
  const handleDiscardChanges = () => {
    if (Object.keys(editedRows).length === 0) return;
    if (confirm("Are you sure you want to discard all unsaved edits?")) {
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch (_) {}
      setUndoStack([]);
      setRedoStack([]);
      setEditedRows({});
      setManualOverrides({});
      setShipments((prev) =>
        prev.map((s) => {
          const editState = editedRows[s.shipmentId];
          return editState ? { ...editState.original } : s;
        })
      );
      onToast("Unsaved changes discarded.");
    }
  };

  // Save all modified rows
  const handleSaveAllChanges = async () => {
    const dirtyIds = Object.keys(editedRows);
    if (dirtyIds.length === 0) return;

    setSaving(true);
    try {
      const rowsPayload = dirtyIds.map((id) => {
        const editState = editedRows[id];
        const current = editState.current;
        const original = editState.original;

        const updates: any = {};
        Object.keys(current).forEach((key) => {
          const k = key as keyof ShipmentRecord;
          if (current[k] !== original[k]) {
            updates[k] = current[k];
          }
        });
        return { shipmentId: id, updates };
      }).filter((item) => Object.keys(item.updates).length > 0);

      console.log("========== [PRICING DEBUG: Before Save Payload] ==========");
      console.log("Payload:", JSON.stringify(rowsPayload, null, 2));
      console.log("==========================================================");

      if (rowsPayload.length > 0) {
        const res = await fetch("/api/shipments/bulk", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: rowsPayload }),
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.message || "Failed to update shipments.");
        }

        const resData = await res.json();
        console.log("========== [PRICING DEBUG: After Backend Response] ==========");
        console.log("Response Data:", JSON.stringify(resData, null, 2));
        console.log("=============================================================");
      }

      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch (_) {}
      onToast(`Successfully saved updates to ${dirtyIds.length} shipments.`);
      setUndoStack([]);
      setRedoStack([]);
      setEditedRows({});
      setManualOverrides({});
      await onRefreshData();
    } catch (err: any) {
      console.error("Error saving bulk changes:", err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return {
    mode,
    setMode,
    editedRows,
    setEditedRows,
    manualOverrides,
    highlightedCells,
    saving,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    hasChanges: Object.keys(editedRows).length > 0,
    modifiedCount: Object.keys(editedRows).length,
    handleCellChange,
    handleBatchCellChanges,
    handleUndo,
    handleRedo,
    handleDiscardChanges,
    handleSaveAllChanges,
  };
}
