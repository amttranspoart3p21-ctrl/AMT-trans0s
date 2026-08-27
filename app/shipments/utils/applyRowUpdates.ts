import type { ShipmentRecord } from "@/types/shipment";
import { resolveCompanyDetails } from "@/utils/shipment-shared";
import { getFilteredPackageOptions } from "@/utils/package-filter";
import { calculateQuantity } from "./calculateQuantity";
import { calculatePricingLocally, type MasterDataContext } from "./calculatePricingLocally";

export interface ApplyRowUpdatesResult {
  updatedShipment: ShipmentRecord;
  autoFills: Partial<ShipmentRecord>;
  focusField?: "pickupCharge" | "deliveryCharge" | null;
}

export function applyRowUpdates(
  originalShipment: ShipmentRecord,
  updatedFields: Partial<ShipmentRecord>,
  overrides: Set<string>,
  masterData: MasterDataContext
): ApplyRowUpdatesResult {
  const { branches, companies, packages, companyRouteRates, globalRouteRates } = masterData;
  const currentRecord = { ...originalShipment, ...updatedFields };
  const autoFills: Partial<ShipmentRecord> = {};
  let focusField: "pickupCharge" | "deliveryCharge" | null = null;

  // 1. paymentReceivingBranch logic
  if ("paymentReceivingBranch" in updatedFields) {
    overrides.delete("paymentCompany");
  }

  const isPaymentCompanyManual = overrides.has("paymentCompany") && !("paymentReceivingBranch" in updatedFields);
  
  if (
    "paymentReceivingBranch" in updatedFields ||
    "fromCompany" in updatedFields ||
    "toCompany" in updatedFields
  ) {
    if (!isPaymentCompanyManual) {
      if (currentRecord.paymentReceivingBranch === "From Company" && currentRecord.fromCompany) {
        const resolved = resolveCompanyDetails(currentRecord.fromCompany, currentRecord.fromAmtBranch, companies);
        autoFills.paymentCompany = resolved.companyName;
        currentRecord.paymentCompany = resolved.companyName;
      } else if (currentRecord.paymentReceivingBranch === "To Company" && currentRecord.toCompany) {
        const resolved = resolveCompanyDetails(currentRecord.toCompany, currentRecord.toAmtBranch, companies);
        autoFills.paymentCompany = resolved.companyName;
        currentRecord.paymentCompany = resolved.companyName;
      }
    }
  }

  // 3. Dynamic package validation logic
  if (
    "fromAmtBranch" in updatedFields ||
    "toAmtBranch" in updatedFields ||
    "paymentCompany" in updatedFields ||
    "paymentReceivingBranch" in updatedFields ||
    ("paymentCompany" in autoFills)
  ) {
    const currentPkg = currentRecord.packageType?.trim();
    if (currentPkg && currentPkg.includes("(")) {
      const validOptions = getFilteredPackageOptions(
        currentRecord.fromAmtBranch,
        currentRecord.toAmtBranch,
        currentRecord.paymentCompany,
        companyRouteRates,
        globalRouteRates,
        companies,
        branches,
        currentRecord.paymentReceivingBranch
      );
      const validValues = validOptions.map((opt) => opt.value.toLowerCase().trim());
      if (!validValues.includes(currentPkg.toLowerCase()) && !("packageType" in updatedFields)) {
        autoFills.packageType = "";
        currentRecord.packageType = "";
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

  const isMasterDependencyChanged = masterRateDependencies.some(
    (dep) => dep in updatedFields || dep in autoFills
  );

  if ("packageType" in updatedFields) {
    autoFills.pickupService = "Branch";
    autoFills.deliveryService = "Branch";
    autoFills.pickupCharge = 0;
    autoFills.deliveryCharge = 0;
    currentRecord.pickupService = "Branch";
    currentRecord.deliveryService = "Branch";
    currentRecord.pickupCharge = 0;
    currentRecord.deliveryCharge = 0;
  }

  console.log(`[applyRowUpdates] shipmentId=${originalShipment.shipmentId} updatedFields=${JSON.stringify(Object.keys(updatedFields))} isMasterDependencyChanged=${isMasterDependencyChanged}`);
  console.log(`[applyRowUpdates] currentRecord.transportRate=${currentRecord.transportRate} pickupCharge=${currentRecord.pickupCharge} deliveryCharge=${currentRecord.deliveryCharge} pricePerPiece=${currentRecord.pricePerPiece}`);

  if (isMasterDependencyChanged) {
    const calc = calculatePricingLocally(currentRecord, { branches, companies, packages, companyRouteRates, globalRouteRates });
    autoFills.transportRate = calc.transportRate;
    currentRecord.transportRate = calc.transportRate;

    autoFills.pickupCharge = calc.pickupCharge;
    currentRecord.pickupCharge = calc.pickupCharge;

    autoFills.deliveryCharge = calc.deliveryCharge;
    currentRecord.deliveryCharge = calc.deliveryCharge;

    autoFills.pricePerPiece = calc.pricePerPiece;
    currentRecord.pricePerPiece = calc.pricePerPiece;
  } else {
    if ("pickupService" in updatedFields) {
      const svc = currentRecord.pickupService;
      if (svc === "Branch" || svc === "Free Home" || !svc) {
        autoFills.pickupCharge = 0;
        currentRecord.pickupCharge = 0;
      } else if (svc === "Home") {
        const calc = calculatePricingLocally(currentRecord, { branches, companies, packages, companyRouteRates, globalRouteRates });
        autoFills.pickupCharge = calc.pickupCharge;
        currentRecord.pickupCharge = calc.pickupCharge;

        if (calc.pickupCharge === 0) {
          focusField = "pickupCharge";
        }
      }
    }

    if ("deliveryService" in updatedFields) {
      const svc = currentRecord.deliveryService;
      if (svc === "Branch" || svc === "Free Home" || !svc) {
        autoFills.deliveryCharge = 0;
        currentRecord.deliveryCharge = 0;
      } else if (svc === "Home") {
        const calc = calculatePricingLocally(currentRecord, { branches, companies, packages, companyRouteRates, globalRouteRates });
        autoFills.deliveryCharge = calc.deliveryCharge;
        currentRecord.deliveryCharge = calc.deliveryCharge;

        if (calc.deliveryCharge === 0) {
          focusField = "deliveryCharge";
        }
      }
    }

    if (
      "transportRate" in updatedFields ||
      "pickupCharge" in updatedFields ||
      "deliveryCharge" in updatedFields ||
      "pickupService" in updatedFields ||
      "deliveryService" in updatedFields
    ) {
      const tRate = (currentRecord.transportRate !== null && currentRecord.transportRate !== undefined && !isNaN(Number(currentRecord.transportRate))) ? Number(currentRecord.transportRate) : 0;
      const pCharge = (currentRecord.pickupCharge !== null && currentRecord.pickupCharge !== undefined && !isNaN(Number(currentRecord.pickupCharge))) ? Number(currentRecord.pickupCharge) : 0;
      const dCharge = (currentRecord.deliveryCharge !== null && currentRecord.deliveryCharge !== undefined && !isNaN(Number(currentRecord.deliveryCharge))) ? Number(currentRecord.deliveryCharge) : 0;
      const ppp = tRate + pCharge + dCharge;
      console.log(`[applyRowUpdates PPP CALC] tRate=${tRate} (raw=${currentRecord.transportRate}) + pCharge=${pCharge} (raw=${currentRecord.pickupCharge}) + dCharge=${dCharge} (raw=${currentRecord.deliveryCharge}) = ppp=${ppp}`);
      autoFills.pricePerPiece = ppp;
      currentRecord.pricePerPiece = ppp;
    }
  }

  const pricePerPieceVal = (currentRecord.pricePerPiece !== null && currentRecord.pricePerPiece !== undefined && !isNaN(Number(currentRecord.pricePerPiece))) ? Number(currentRecord.pricePerPiece) : 0;
  const qty = calculateQuantity(currentRecord.quantity);
  autoFills.totalAmount = qty * pricePerPieceVal;
  currentRecord.totalAmount = autoFills.totalAmount;

  return {
    updatedShipment: currentRecord,
    autoFills,
    focusField,
  };
}
