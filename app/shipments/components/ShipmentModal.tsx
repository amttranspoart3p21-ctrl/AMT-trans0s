import React, { useState, useEffect } from "react";
import { PAYMENT_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS } from "@/types/shipment";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import Modal from "@/components/ui/Modal";
import SearchableSelect, { SearchableSelectOption } from "@/components/ui/SearchableSelect";
import Button from "@/components/ui/Button";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import { getFilteredPackageOptions, buildPackageOptionsList, getPackageBadgeStatus, isGlobalRoutePackage } from "@/utils/package-filter";
import { resolveCompanyDetails, calculateQuantity } from "@/utils/shipment-shared";

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

  if (!isOpen || !formData) return null;

  const handleFieldChange = (field: keyof ShipmentRecord, value: any) => {
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

    if (field === "fromAmtBranch") {
      const validFromCompanies = companies.filter((c) => c.branchName === value).map((c) => c.companyName);
      if (updated.fromCompany && !validFromCompanies.includes(updated.fromCompany)) {
        autoFills.fromCompany = "";
      }
    }

    if (field === "toAmtBranch") {
      const validToCompanies = companies.filter((c) => c.branchName === value).map((c) => c.companyName);
      if (updated.toCompany && !validToCompanies.includes(updated.toCompany)) {
        autoFills.toCompany = "";
      }
    }

    updated = { ...updated, ...autoFills };

    // Validate package list and clear if no longer valid
    if (
      field === "fromAmtBranch" ||
      field === "toAmtBranch" ||
      field === "paymentCompany" ||
      field === "paymentReceivingBranch" ||
      ("paymentCompany" in autoFills)
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
        const validValues = validOptions.map(opt => opt.value.toLowerCase().trim());
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

    const isMasterDependencyChanged = masterRateDependencies.includes(String(field)) || Object.keys(autoFills).some(k => masterRateDependencies.includes(k));

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
        const tRate = (updated.transportRate !== null && updated.transportRate !== undefined && !isNaN(Number(updated.transportRate))) ? Number(updated.transportRate) : 0;
        const pCharge = (updated.pickupCharge !== null && updated.pickupCharge !== undefined && !isNaN(Number(updated.pickupCharge))) ? Number(updated.pickupCharge) : 0;
        const dCharge = (updated.deliveryCharge !== null && updated.deliveryCharge !== undefined && !isNaN(Number(updated.deliveryCharge))) ? Number(updated.deliveryCharge) : 0;
        updated.pricePerPiece = tRate + pCharge + dCharge;
      }
    }

    const pricePerPieceVal = (updated.pricePerPiece !== null && updated.pricePerPiece !== undefined && !isNaN(Number(updated.pricePerPiece))) ? Number(updated.pricePerPiece) : 0;
    const qty = calculateQuantity(updated.quantity);
    updated.totalAmount = qty * pricePerPieceVal;

    setFormData(updated);
  };



  const handleSaveClick = async () => {
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
  };

  const isEdit = mode === "edit";

  // Filter companies based on active branch selection
  const fromBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === formData?.fromAmtBranch?.trim().toLowerCase()
  );
  const fromAmtCompanies = companies.filter(
    (c) => fromBranchObj && c.branchId === fromBranchObj.branchId
  );

  const toBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === formData?.toAmtBranch?.trim().toLowerCase()
  );
  const toAmtCompanies = companies.filter(
    (c) => toBranchObj && c.branchId === toBranchObj.branchId
  );

  const isGlobal = isGlobalRoutePackage(
    formData?.packageType,
    formData?.fromAmtBranch,
    formData?.toAmtBranch,
    formData?.paymentCompany,
    companyRouteRates,
    globalRouteRates,
    companies,
    branches,
    formData?.paymentReceivingBranch
  );

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
        {/* Date */}
        <div>
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">Date</label>
          {isEdit ? (
            <input
              type="date"
              value={formData.date || ""}
              onChange={(e) => handleFieldChange("date", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.date}</div>
          )}
        </div>

        {/* Vehicle */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Vehicle Number</label>
          {isEdit ? (
            <input
              type="text"
              value={formData.vehicleNumber || ""}
              onChange={(e) => handleFieldChange("vehicleNumber", e.target.value)}
              placeholder="e.g. MH-12-AB-1234"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.vehicleNumber}</div>
          )}
        </div>

        {/* Package */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Package Type</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.packageType || ""}
              onChange={(val) => handleFieldChange("packageType", val)}
              options={buildPackageOptionsList(
                formData.packageType,
                formData.fromAmtBranch,
                formData.toAmtBranch,
                formData.paymentCompany,
                companyRouteRates,
                globalRouteRates,
                companies,
                branches,
                packages,
                formData.paymentReceivingBranch
              )}
              noResultsText="No packages configured for this route."
              placeholder="Select package type"
              allowManualEntry={true}
              manualEntryLabel="Package Type"
              manualEntryPlaceholder="Enter manual package type..."
              manualEntryButtonText="Enter Package Manually"
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold flex items-center justify-between gap-1.5">
              <span>{formData.packageType}</span>
              {(() => {
                const badgeStatus = getPackageBadgeStatus(
                  formData.packageType,
                  formData.fromAmtBranch,
                  formData.toAmtBranch,
                  formData.paymentCompany,
                  companyRouteRates,
                  globalRouteRates,
                  companies,
                  branches,
                  packages,
                  formData.paymentReceivingBranch
                );
                if (badgeStatus === "unregistered") {
                  return (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                      ⚠️ Unregistered
                    </span>
                  );
                }
                if (badgeStatus === "no-rate") {
                  return (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                      ⚠️ No Rate
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>

        {/* From Branch */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">From Branch</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.fromAmtBranch || ""}
              onChange={(val) => handleFieldChange("fromAmtBranch", val)}
              options={branches.map((b) => ({
                value: b.branchName,
                label: b.branchName,
                disabled: b.branchName === formData.toAmtBranch,
                disabledReason: "(Selected in To)",
              }))}
              placeholder="Select origin branch"
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.fromAmtBranch}</div>
          )}
        </div>

        {/* From Company */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">From Company</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.fromCompany || ""}
              onChange={(val) => handleFieldChange("fromCompany", val)}
              options={(() => {
                const selectOptions: SearchableSelectOption[] = fromAmtCompanies.map((c) => ({
                  value: c.companyName,
                  label: c.displayName || c.companyName,
                }));
                const isFromCompanyUnregistered = formData.fromCompany && !fromAmtCompanies.some((c) => c.companyName === formData.fromCompany);
                if (isFromCompanyUnregistered) {
                  selectOptions.push({
                    value: formData.fromCompany,
                    label: formData.fromCompany,
                    badge: "Unregistered",
                    badgeType: "shipment" as any,
                  });
                }
                return selectOptions;
              })()}
              placeholder="Select sender company"
              allowManualEntry={true}
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold flex items-center justify-between gap-1.5">
              <span>{formData.fromCompany}</span>
              {formData.fromCompany && !fromAmtCompanies.some((c) => c.companyName === formData.fromCompany) && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                  ⚠️ Unregistered
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pickup Service */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Pickup Service</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.pickupService || "Branch"}
              onChange={(val) => handleFieldChange("pickupService", val)}
              options={[
                { value: "Branch", label: "Branch" },
                { value: "Home", label: "Home Pickup" },
                { value: "Free Home", label: "Free Pickup" },
              ]}
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.pickupService || "Branch"}</div>
          )}
        </div>

        {/* To Branch */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">To Branch</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.toAmtBranch || ""}
              onChange={(val) => handleFieldChange("toAmtBranch", val)}
              options={branches.map((b) => ({
                value: b.branchName,
                label: b.branchName,
                disabled: b.branchName === formData.fromAmtBranch,
                disabledReason: "(Selected in From)",
              }))}
              placeholder="Select destination branch"
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.toAmtBranch}</div>
          )}
        </div>

        {/* To Company */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">To Company</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.toCompany || ""}
              onChange={(val) => handleFieldChange("toCompany", val)}
              options={(() => {
                const selectOptions: SearchableSelectOption[] = toAmtCompanies.map((c) => ({
                  value: c.companyName,
                  label: c.displayName || c.companyName,
                }));
                const isToCompanyUnregistered = formData.toCompany && !toAmtCompanies.some((c) => c.companyName === formData.toCompany);
                if (isToCompanyUnregistered) {
                  selectOptions.push({
                    value: formData.toCompany,
                    label: formData.toCompany,
                    badge: "Unregistered",
                    badgeType: "shipment" as any,
                  });
                }
                return selectOptions;
              })()}
              placeholder="Select receiver company"
              allowManualEntry={true}
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold flex items-center justify-between gap-1.5">
              <span>{formData.toCompany}</span>
              {formData.toCompany && !toAmtCompanies.some((c) => c.companyName === formData.toCompany) && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                  ⚠️ Unregistered
                </span>
              )}
            </div>
          )}
        </div>

        {/* Delivery Service */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Delivery Service</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.deliveryService || "Branch"}
              onChange={(val) => handleFieldChange("deliveryService", val)}
              options={[
                { value: "Branch", label: "Branch" },
                { value: "Home", label: "Home Delivery" },
                { value: "Free Home", label: "Free Delivery" },
              ]}
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.deliveryService || "Branch"}</div>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Quantity</label>
          {isEdit ? (
            <input
              type="number"
              value={formData.quantity || ""}
              onChange={(e) => handleFieldChange("quantity", e.target.value)}
              placeholder="0"
              className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
            />
          ) : (
            <div className="bg-slate-955/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.quantity}</div>
          )}
        </div>

        {/* Transport Rate */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Transport Rate</label>
          {isEdit ? (
            <input
              type="number"
              step="any"
              value={formData.transportRate === null ? "" : formData.transportRate}
              onChange={(e) => handleFieldChange("transportRate", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="Auto-calculated"
              className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
            />
          ) : (
            <div className="bg-slate-955/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.transportRate === null ? "Auto" : formData.transportRate}</div>
          )}
        </div>

        {/* Price per Piece */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Price Per Piece</label>
          {isEdit ? (
            <input
              type="number"
              step="any"
              value={formData.pricePerPiece === null ? "" : formData.pricePerPiece}
              onChange={(e) => handleFieldChange("pricePerPiece", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="Auto-calculated"
              className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
            />
          ) : (
            <div className="bg-slate-955/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.pricePerPiece === null ? "Auto" : formData.pricePerPiece}</div>
          )}
        </div>

        {/* Pickup Charge */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Pickup Charge</label>
          {isEdit ? (
            <input
              id="modal-pickupCharge"
              type="number"
              value={formData.pickupCharge === null || formData.pickupCharge === undefined ? "" : formData.pickupCharge}
              disabled={formData.pickupService !== "Home"}
              onChange={(e) => handleFieldChange("pickupCharge", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="0"
              className={`w-full border rounded-xl px-3 py-2 text-xs outline-none font-semibold text-right font-mono transition-colors ${
                formData.pickupService !== "Home"
                  ? "opacity-50 bg-slate-900/80 cursor-not-allowed text-slate-500 border-slate-850"
                  : "bg-slate-950 border-slate-800 text-slate-200 focus:border-violet-500"
              }`}
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold text-right font-mono">{formData.pickupCharge ?? 0}</div>
          )}
        </div>

        {/* Delivery Charge */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Delivery Charge</label>
          {isEdit ? (
            <input
              id="modal-deliveryCharge"
              type="number"
              value={formData.deliveryCharge === null || formData.deliveryCharge === undefined ? "" : formData.deliveryCharge}
              disabled={formData.deliveryService !== "Home"}
              onChange={(e) => handleFieldChange("deliveryCharge", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="0"
              className={`w-full border rounded-xl px-3 py-2 text-xs outline-none font-semibold text-right font-mono transition-colors ${
                formData.deliveryService !== "Home"
                  ? "opacity-50 bg-slate-900/80 cursor-not-allowed text-slate-500 border-slate-850"
                  : "bg-slate-950 border-slate-800 text-slate-200 focus:border-violet-500"
              }`}
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.deliveryCharge ?? 0}</div>
          )}
        </div>

        {/* Total Amount */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Total Amount</label>
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-100 font-bold text-sm bg-violet-955/20 border-violet-850">{formData.totalAmount ?? 0}</div>
        </div>

        {/* Payment Branch */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Payment Branch Type</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.paymentReceivingBranch || ""}
              onChange={(val) => handleFieldChange("paymentReceivingBranch", val)}
              options={[
                { value: "From Company", label: "From Branch" },
                { value: "To Company", label: "To Branch" },
              ]}
              placeholder="Select..."
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">
              {formData.paymentReceivingBranch === "From Company"
                ? "From Branch"
                : formData.paymentReceivingBranch === "To Company"
                ? "To Branch"
                : "-"}
            </div>
          )}
        </div>

        {/* Payment Company */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Payment Company</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.paymentCompany || ""}
              onChange={(val) => handleFieldChange("paymentCompany", val)}
              options={(() => {
                // Find selected Pay Branch
                const payBranchName = formData.paymentReceivingBranch === "From Company" ? formData.fromAmtBranch : formData.paymentReceivingBranch === "To Company" ? formData.toAmtBranch : "";
                const payBranchObj = branches.find(b => b.branchName?.trim().toLowerCase() === payBranchName?.trim().toLowerCase());
                const payBranchId = payBranchObj?.branchId || "";
                const payBranchCode = payBranchObj?.branchCode || "";

                const payCompanyOptions: SearchableSelectOption[] = [];

                // 1. Current shipment company
                const curCompanyName = formData.paymentReceivingBranch === "From Company" ? formData.fromCompany : formData.paymentReceivingBranch === "To Company" ? formData.toCompany : "";
                if (curCompanyName) {
                  let curCompanyLabel = curCompanyName;
                  const curCompanyObj = companies.find(c => c.companyName === curCompanyName && c.branchId === payBranchId);
                  if (curCompanyObj?.displayName) {
                    curCompanyLabel = curCompanyObj.displayName;
                  } else if (payBranchCode) {
                    curCompanyLabel = `${curCompanyName} - ${payBranchCode}`;
                  }
                  payCompanyOptions.push({
                    value: curCompanyName,
                    label: curCompanyLabel,
                  });
                }

                // 2. All registered companies for the selected Pay Branch (excluding the current shipment company)
                const registeredCompanies = companies.filter(c => c.branchId === payBranchId);
                const otherCompanies = registeredCompanies.filter(c => c.companyName !== curCompanyName);

                if (curCompanyName && otherCompanies.length > 0) {
                  payCompanyOptions.push({
                    value: "divider-current",
                    label: "",
                    isDivider: true,
                  });
                }

                otherCompanies.forEach(c => {
                  payCompanyOptions.push({
                    value: c.companyName,
                    label: c.displayName || c.companyName,
                  });
                });

                // 3. Current selected value if unregistered/manual
                const isCurrentMatch = curCompanyName && formData.paymentCompany === curCompanyName;
                const isInRegistered = registeredCompanies.some(c => c.companyName === formData.paymentCompany);
                if (formData.paymentCompany && !isCurrentMatch && !isInRegistered) {
                  payCompanyOptions.push({
                    value: formData.paymentCompany,
                    label: formData.paymentCompany,
                    badge: "Unregistered",
                    badgeType: "shipment" as any,
                  });
                }

                return payCompanyOptions;
              })()}
              placeholder="Select payment company"
              allowManualEntry={true}
              manualEntryPosition="top"
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">
              {(() => {
                if (!formData.paymentCompany) return "-";
                const payBranchName = formData.paymentReceivingBranch === "From Company" ? formData.fromAmtBranch : formData.paymentReceivingBranch === "To Company" ? formData.toAmtBranch : "";
                const payBranchObj = branches.find(b => b.branchName?.trim().toLowerCase() === payBranchName?.trim().toLowerCase());
                const payBranchId = payBranchObj?.branchId || "";
                const payBranchCode = payBranchObj?.branchCode || "";
                const compObj = companies.find(c => c.companyName === formData.paymentCompany && c.branchId === payBranchId);
                return compObj?.displayName || (payBranchCode ? `${formData.paymentCompany} - ${payBranchCode}` : formData.paymentCompany);
              })()}
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Payment Status</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.paymentStatus || "Pending"}
              onChange={(val) => handleFieldChange("paymentStatus", val)}
              options={PAYMENT_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              hideClearOption
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.paymentStatus}</div>
          )}
        </div>

        {/* Delivery Status */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Delivery Status</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.deliveryStatus || "Not Delivered"}
              onChange={(val) => handleFieldChange("deliveryStatus", val)}
              options={DELIVERY_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              hideClearOption
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.deliveryStatus}</div>
          )}
        </div>

        {/* Our Invoice Number */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Our Invoice Number</label>
          {isEdit ? (
            <input
              type="text"
              value={formData.ourInvoiceNumber || ""}
              onChange={(e) => handleFieldChange("ourInvoiceNumber", e.target.value)}
              placeholder="e.g. INV-001"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.ourInvoiceNumber || "—"}</div>
          )}
        </div>

        {/* Customer Invoice Number */}
        <div>
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Customer Invoice Number</label>
          {isEdit ? (
            <input
              type="text"
              value={formData.customerInvoiceNumber || ""}
              onChange={(e) => handleFieldChange("customerInvoiceNumber", e.target.value)}
              placeholder="e.g. CUST-INV-100"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
            />
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.customerInvoiceNumber || "—"}</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
