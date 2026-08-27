import { useState } from "react";
import type { ShipmentRecord } from "@/types/shipment";

export interface UseShipmentModalsParams {
  shipments: ShipmentRecord[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  editedRows: Record<string, { original: ShipmentRecord; current: ShipmentRecord }>;
  setEditedRows: React.Dispatch<React.SetStateAction<Record<string, { original: ShipmentRecord; current: ShipmentRecord }>>>;
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onRefreshShipments: () => Promise<void>;
  onRefreshDashboard: () => Promise<void>;
  onToast: (msg: string) => void;
}

export interface UseShipmentModalsReturn {
  // Preview / Edit modal
  modalShipment: ShipmentRecord | null;
  setModalShipment: React.Dispatch<React.SetStateAction<ShipmentRecord | null>>;
  modalMode: "preview" | "edit";
  setModalMode: React.Dispatch<React.SetStateAction<"preview" | "edit">>;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handlePreviewShipment: (shipment: ShipmentRecord) => void;
  handleEditShipment: (shipment: ShipmentRecord) => void;
  handleModalSave: (updated: ShipmentRecord) => Promise<void>;

  // Delete modal
  deleteShipmentId: string | null;
  setDeleteShipmentId: React.Dispatch<React.SetStateAction<string | null>>;
  isDeleting: boolean;
  handleDeleteConfirm: () => Promise<void>;

  // Image viewer modal
  activeImageDetails: { imageId: string; fileName: string } | null;
  setActiveImageDetails: React.Dispatch<React.SetStateAction<{ imageId: string; fileName: string } | null>>;
}

export function useShipmentModals({
  shipments,
  page,
  setPage,
  editedRows,
  setEditedRows,
  setSelectedIds,
  onRefreshShipments,
  onRefreshDashboard,
  onToast,
}: UseShipmentModalsParams): UseShipmentModalsReturn {
  // Single Shipment Preview / Edit modal states
  const [modalShipment, setModalShipment] = useState<ShipmentRecord | null>(null);
  const [modalMode, setModalMode] = useState<"preview" | "edit">("preview");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Delete Modal States
  const [deleteShipmentId, setDeleteShipmentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Image Viewer Modal State
  const [activeImageDetails, setActiveImageDetails] = useState<{ imageId: string; fileName: string } | null>(null);

  const handlePreviewShipment = (shipment: ShipmentRecord) => {
    setModalShipment(shipment);
    setModalMode("preview");
    setIsModalOpen(true);
  };

  const handleEditShipment = (shipment: ShipmentRecord) => {
    setModalShipment(shipment);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleModalSave = async (updated: ShipmentRecord) => {
    try {
      const res = await fetch(`/api/shipments/${updated.shipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to update shipment.");
      }
      onToast("Shipment updated successfully.");
      await onRefreshShipments();
      await onRefreshDashboard();
    } catch (err: any) {
      console.error("Error saving modal changes:", err);
      throw err;
    }
  };

  // Delete Action Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteShipmentId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/shipments/${deleteShipmentId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        onToast(`Shipment ${deleteShipmentId} deleted successfully.`);
        if (editedRows[deleteShipmentId]) {
          const updatedEdits = { ...editedRows };
          delete updatedEdits[deleteShipmentId];
          setEditedRows(updatedEdits);
        }
        setSelectedIds((prev) => prev.filter((id) => id !== deleteShipmentId));
        const isLastItemOnPage = shipments.length === 1;
        if (isLastItemOnPage && page > 1) {
          setPage(page - 1);
        } else {
          await onRefreshShipments();
        }
        await onRefreshDashboard();
      } else {
        throw new Error(json.message || "Could not delete shipment.");
      }
    } catch (err: any) {
      console.error("Error deleting shipment:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteShipmentId(null);
    }
  };

  return {
    modalShipment,
    setModalShipment,
    modalMode,
    setModalMode,
    isModalOpen,
    setIsModalOpen,
    handlePreviewShipment,
    handleEditShipment,
    handleModalSave,
    deleteShipmentId,
    setDeleteShipmentId,
    isDeleting,
    handleDeleteConfirm,
    activeImageDetails,
    setActiveImageDetails,
  };
}
