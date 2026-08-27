import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import { useShipmentModalForm } from "../hooks/useShipmentModalForm";
import ShipmentModalGeneralFields from "./modal/ShipmentModalGeneralFields";
import ShipmentModalRouteFields from "./modal/ShipmentModalRouteFields";
import ShipmentModalPricingFields from "./modal/ShipmentModalPricingFields";
import ShipmentModalPaymentInvoiceFields from "./modal/ShipmentModalPaymentInvoiceFields";

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: ShipmentRecord | null;
  mode: "preview" | "edit";
  branches: Branch[];
  companies: Company[];
  packages: Package[];
  companyRouteRates: CompanyRouteRate[];
  globalRouteRates: GlobalRouteRate[];
  onSave: (updated: ShipmentRecord) => Promise<void>;
  calculatePricingLocally: (record: ShipmentRecord) => {
    transportRate: number | null;
    pickupCharge: number | null;
    deliveryCharge: number | null;
    pricePerPiece: number | null;
  };
}

export default function ShipmentModal({
  isOpen,
  onClose,
  shipment,
  mode,
  branches,
  companies,
  packages,
  companyRouteRates = [],
  globalRouteRates = [],
  onSave,
  calculatePricingLocally,
}: ShipmentModalProps) {
  const {
    formData,
    saving,
    handleFieldChange,
    handleSaveClick,
  } = useShipmentModalForm({
    shipment,
    isOpen,
    onClose,
    branches,
    companies,
    packages,
    companyRouteRates,
    globalRouteRates,
    onSave,
    calculatePricingLocally,
  });

  if (!isOpen || !formData) return null;

  const isEdit = mode === "edit";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Shipment" : "Shipment Details"}
      size="xl"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          {isEdit && (
            <Button variant="primary" size="sm" onClick={handleSaveClick} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-slate-350">
        {/* General Metadata Fields: Date, Vehicle, Package */}
        <ShipmentModalGeneralFields
          formData={formData}
          isEdit={isEdit}
          handleFieldChange={handleFieldChange}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
        />

        {/* Route & Entity Fields: From/To Branch & Company, Pickup/Delivery Services */}
        <ShipmentModalRouteFields
          formData={formData}
          isEdit={isEdit}
          handleFieldChange={handleFieldChange}
          branches={branches}
          companies={companies}
        />

        {/* Pricing & Rates Fields: Quantity, Transport Rate, Charges, Price/Piece, Total */}
        <ShipmentModalPricingFields
          formData={formData}
          isEdit={isEdit}
          handleFieldChange={handleFieldChange}
        />

        {/* Payment & Invoice Fields: Pay Branch, Pay Company, Statuses, Invoices */}
        <ShipmentModalPaymentInvoiceFields
          formData={formData}
          isEdit={isEdit}
          handleFieldChange={handleFieldChange}
          branches={branches}
          companies={companies}
        />
      </div>
    </Modal>
  );
}
