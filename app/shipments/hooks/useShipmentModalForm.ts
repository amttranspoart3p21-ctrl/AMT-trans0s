import { useState, useEffect, useCallback } from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import { getFilteredPackageOptions } from "@/utils/package-filter";
import { resolveCompanyDetails } from "@/utils/shipment-shared";
import { calculateQuantity } from "../utils/calculateQuantity";

export interface UseShipmentModalFormParams {
  shipment: ShipmentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  companies: Company[];
  packages: Package[];
  companyRouteRates?: CompanyRouteRate[];
  globalRouteRates?: GlobalRouteRate[];
  onSave: (updated: ShipmentRecord) => Promise<void>;
  calculatePricingLocally: (record: ShipmentRecord) => {
    transportRate: number | null;
    pickupCharge: number | null;
    deliveryCharge: number | null;
    pricePerPiece: number | null;
  };
}

export interface UseShipmentModalFormReturn {
  formData: ShipmentRecord | null;
  setFormData: React.Dispatch<React.SetStateAction<ShipmentRecord | null>>;
  modalOverrides: Set<string>;
  setModalOverrides: React.Dispatch<React.SetStateAction<Set<string>>>;
  saving: boolean;
  handleFieldChange: (field: keyof ShipmentRecord, value: any) => void;
  handleSaveClick: () => Promise<void>;
}

export function useShipmentModalForm({
  shipment,
  isOpen,
  onClose,
  branches,
  companies,
  packages,
  companyRouteRates = [],
  globalRouteRates = [],
  onSave,
  calculatePricingLocally,
}: UseShipmentModalFormParams): UseShipmentModalFormReturn {
  const [formData, setFormData] = useState<ShipmentRecord | null>(null);
  const [modalOverrides, setModalOverrides] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shipment) {
      setFormData(JSON.parse(JSON.stringify(shipment)));
      setModalOverrides(new Set());
    } else {
      setFormData(null);
    }
  }, [shipment, isOpen]);

  const handleFieldChange = useCallback(
    (field: keyof ShipmentRecord, value: any) => {
      if (!formData) return;

      let updated = { ...formData, [field]: value };
      const nextOverrides = new Set(modalOverrides);

      // Track manual overrides
      const overrideFields = ["transportRate", "pickupCharge", "deliveryCharge", "pricePerPiece"];
      if (overrideFields.includes(String(field))) {
        nextOverrides.add(String(field));
        setModalOverrides(nextOverrides);
      }

      // Business rules & Smart Auto-Fill
      const autoFills: Partial<ShipmentRecord> = {};

      if (field === "paymentReceivingBranch") {
        nextOverrides.delete("paymentCompany");
        setModalOverrides(nextOverrides);

        if (value === "From Company" && updated.fromCompany) {
          const resolved = resolveCompanyDetails(updated.fromCompany, updated.fromAmtBranch, companies);
          autoFills.paymentCompany = resolved.companyName;
        } else if (value === "To Company" && updated.toCompany) {
          const resolved = resolveCompanyDetails(updated.toCompany, updated.toAmtBranch, companies);
          autoFills.paymentCompany = resolved.companyName;
        }
      }

      if (field === "fromCompany" && updated.paymentReceivingBranch === "From Company") {
        if (!nextOverrides.has("paymentCompany")) {
          const resolved = resolveCompanyDetails(value, updated.fromAmtBranch, companies);
          autoFills.paymentCompany = resolved.companyName;
        }
      }

      if (field === "toCompany" && updated.paymentReceivingBranch === "To Company") {
        if (!nextOverrides.has("paymentCompany")) {
          const resolved = resolveCompanyDetails(value, updated.toAmtBranch, companies);
          autoFills.paymentCompany = resolved.companyName;
        }
      }

      updated = { ...updated, ...autoFills };

      // Validate package list and clear if no longer valid
      if (
        field === "fromAmtBranch" ||
        field === "toAmtBranch" ||
        field === "paymentCompany" ||
        field === "paymentReceivingBranch" ||
        "paymentCompany" in autoFills
      ) {
        const currentPkg = updated.packageType?.trim();
        if (currentPkg && currentPkg.includes("(")) {
          const validOptions = getFilteredPackageOptions(
            updated.fromAmtBranch,
            updated.toAmtBranch,
            updated.paymentCompany,
            companyRouteRates,
            globalRouteRates,
            companies,
            branches,
            updated.paymentReceivingBranch
          );
          const validValues = validOptions.map((opt) => opt.value.toLowerCase().trim());
          if (!validValues.includes(currentPkg.toLowerCase()) && field !== "packageType") {
            updated.packageType = "";
          }
        }
      }

      // Check pricing dependency changes:
      const masterRateDependencies = [
        "packageType",
        "fromAmtBranch",
        "toAmtBranch",
        "paymentCompany",
        "paymentReceivingBranch",
      ];

      const isMasterDependencyChanged =
        masterRateDependencies.includes(String(field)) ||
        Object.keys(autoFills).some((k) => masterRateDependencies.includes(k));

      if (field === "packageType") {
        updated.pickupService = "Branch";
        updated.deliveryService = "Branch";
        updated.pickupCharge = 0;
        updated.deliveryCharge = 0;
      }

      if (isMasterDependencyChanged) {
        const calc = calculatePricingLocally(updated);
        updated.transportRate = calc.transportRate;
        updated.pickupCharge = calc.pickupCharge;
        updated.deliveryCharge = calc.deliveryCharge;
        updated.pricePerPiece = calc.pricePerPiece;
      } else {
        if (field === "pickupService") {
          const svc = updated.pickupService;
          if (svc === "Branch" || svc === "Free Home" || !svc) {
            updated.pickupCharge = 0;
          } else if (svc === "Home") {
            const calc = calculatePricingLocally(updated);
            updated.pickupCharge = calc.pickupCharge;

            if (calc.pickupCharge === 0) {
              setTimeout(() => {
                const el = document.getElementById("modal-pickupCharge");
                if (el) {
                  el.focus();
                  if (el instanceof HTMLInputElement) el.select();
                }
              }, 50);
            }
          }
        }

        if (field === "deliveryService") {
          const svc = updated.deliveryService;
          if (svc === "Branch" || svc === "Free Home" || !svc) {
            updated.deliveryCharge = 0;
          } else if (svc === "Home") {
            const calc = calculatePricingLocally(updated);
            updated.deliveryCharge = calc.deliveryCharge;

            if (calc.deliveryCharge === 0) {
              setTimeout(() => {
                const el = document.getElementById("modal-deliveryCharge");
                if (el) {
                  el.focus();
                  if (el instanceof HTMLInputElement) el.select();
                }
              }, 50);
            }
          }
        }

        if (
          field === "transportRate" ||
          field === "pickupCharge" ||
          field === "deliveryCharge" ||
          field === "pickupService" ||
          field === "deliveryService"
        ) {
          const tRate =
            updated.transportRate !== null &&
            updated.transportRate !== undefined &&
            !isNaN(Number(updated.transportRate))
              ? Number(updated.transportRate)
              : 0;
          const pCharge =
            updated.pickupCharge !== null &&
            updated.pickupCharge !== undefined &&
            !isNaN(Number(updated.pickupCharge))
              ? Number(updated.pickupCharge)
              : 0;
          const dCharge =
            updated.deliveryCharge !== null &&
            updated.deliveryCharge !== undefined &&
            !isNaN(Number(updated.deliveryCharge))
              ? Number(updated.deliveryCharge)
              : 0;
          updated.pricePerPiece = tRate + pCharge + dCharge;
        }
      }

      const pricePerPieceVal =
        updated.pricePerPiece !== null &&
        updated.pricePerPiece !== undefined &&
        !isNaN(Number(updated.pricePerPiece))
          ? Number(updated.pricePerPiece)
          : 0;
      const qty = calculateQuantity(updated.quantity);
      updated.totalAmount = qty * pricePerPieceVal;

      setFormData(updated);
    },
    [formData, modalOverrides, companies, branches, companyRouteRates, globalRouteRates, calculatePricingLocally]
  );

  const handleSaveClick = useCallback(async () => {
    if (!formData) return;
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [formData, onSave, onClose]);

  return {
    formData,
    setFormData,
    modalOverrides,
    setModalOverrides,
    saving,
    handleFieldChange,
    handleSaveClick,
  };
}
