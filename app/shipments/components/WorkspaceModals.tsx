import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import ShipmentModal from "./ShipmentModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ImageViewerModal from "./ImageViewerModal";

interface WorkspaceModalsProps {
  isShipmentModalOpen: boolean;
  onCloseShipmentModal: () => void;
  modalShipment: ShipmentRecord | null;
  modalMode: "preview" | "edit";
  branches: Branch[];
  companies: Company[];
  packages: Package[];
  companyRouteRates: CompanyRouteRate[];
  globalRouteRates: GlobalRouteRate[];
  onSaveShipmentModal: (updated: ShipmentRecord) => Promise<void>;
  calculatePricingLocally: (shipment: ShipmentRecord) => any;
  deleteShipmentId: string | null;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
  activeImageDetails: { imageId: string; fileName: string } | null;
  onCloseImageViewer: () => void;
}

export default function WorkspaceModals({
  isShipmentModalOpen,
  onCloseShipmentModal,
  modalShipment,
  modalMode,
  branches,
  companies,
  packages,
  companyRouteRates,
  globalRouteRates,
  onSaveShipmentModal,
  calculatePricingLocally,
  deleteShipmentId,
  onCancelDelete,
  onConfirmDelete,
  isDeleting,
  activeImageDetails,
  onCloseImageViewer,
}: WorkspaceModalsProps) {
  return (
    <>
      {/* Dynamic Edit / Preview Modal */}
      <ShipmentModal
        isOpen={isShipmentModalOpen}
        onClose={onCloseShipmentModal}
        shipment={modalShipment}
        mode={modalMode}
        branches={branches}
        companies={companies}
        packages={packages}
        companyRouteRates={companyRouteRates}
        globalRouteRates={globalRouteRates}
        onSave={onSaveShipmentModal}
        calculatePricingLocally={calculatePricingLocally}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteShipmentId !== null}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Register verification image viewer */}
      {activeImageDetails && (
        <ImageViewerModal
          imageId={activeImageDetails.imageId}
          imageFileName={activeImageDetails.fileName}
          onClose={onCloseImageViewer}
        />
      )}
    </>
  );
}
