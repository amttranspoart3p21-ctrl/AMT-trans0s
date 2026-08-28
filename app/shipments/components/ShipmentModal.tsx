import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import Modal from "@/components/ui/Modal";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import { useShipmentModalForm } from "../hooks/useShipmentModalForm";
import ShipmentModalGeneralFields from "./modal/ShipmentModalGeneralFields";
import { ShipmentModalOriginFields, ShipmentModalDestinationFields } from "./modal/ShipmentModalRouteFields";
import { ShipmentModalLogisticsFields, ShipmentModalFinancialFields } from "./modal/ShipmentModalPricingFields";
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
      title={isEdit ? "Edit Shipment" : "SHIPMENT DETAILS"}
      size="xl"
      footer={
        <div className="flex gap-2.5">
          {isEdit && (
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#005a9c] hover:bg-[#004a82] dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
        {/* Card 1: GENERAL INFORMATION */}
        <div className="bg-[#f8fafc] dark:bg-[#1f2021] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
          <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            GENERAL INFORMATION
          </h4>
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
        </div>

        {/* Card 2: DESTINATION */}
        <div className="bg-[#f8fafc] dark:bg-[#1f2021] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
          <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            DESTINATION
          </h4>
          <ShipmentModalDestinationFields
            formData={formData}
            isEdit={isEdit}
            handleFieldChange={handleFieldChange}
            branches={branches}
            companies={companies}
          />
        </div>

        {/* Card 3: FINANCIALS */}
        <div className="bg-[#f8fafc] dark:bg-[#1f2021] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
          <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            FINANCIALS
          </h4>
          <ShipmentModalFinancialFields
            formData={formData}
            isEdit={isEdit}
            handleFieldChange={handleFieldChange}
          />
        </div>

        {/* Card 4: ORIGIN */}
        <div className="bg-[#f8fafc] dark:bg-[#1f2021] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
          <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            ORIGIN
          </h4>
          <ShipmentModalOriginFields
            formData={formData}
            isEdit={isEdit}
            handleFieldChange={handleFieldChange}
            branches={branches}
            companies={companies}
          />
        </div>

        {/* Card 5: LOGISTICS */}
        <div className="bg-[#f8fafc] dark:bg-[#1f2021] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
          <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            LOGISTICS
          </h4>
          <ShipmentModalLogisticsFields
            formData={formData}
            isEdit={isEdit}
            handleFieldChange={handleFieldChange}
          />
        </div>

        {/* Card 6: STATUS & REFERENCE */}
        <div className="bg-[#f8fafc] dark:bg-[#1f2021] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
          <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            STATUS & REFERENCE
          </h4>
          <ShipmentModalPaymentInvoiceFields
            formData={formData}
            isEdit={isEdit}
            handleFieldChange={handleFieldChange}
            branches={branches}
            companies={companies}
          />
        </div>
      </div>
    </Modal>
  );
}
