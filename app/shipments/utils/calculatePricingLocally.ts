import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import { resolveCompanyDetails } from "@/utils/shipment-shared";
import { performCompanyRouteRateLookupAndLog } from "./companyRouteRateLookup";

export interface MasterDataContext {
  branches: Branch[];
  companies: Company[];
  packages: Package[];
  companyRouteRates: CompanyRouteRate[];
  globalRouteRates: GlobalRouteRate[];
}

export function calculatePricingLocally(
  shipment: ShipmentRecord,
  masterData: MasterDataContext
): {
  transportRate: number | null;
  pickupCharge: number | null;
  deliveryCharge: number | null;
  pricePerPiece: number | null;
} {
  const { branches, companies, packages, companyRouteRates, globalRouteRates } = masterData;

  const fromBranchKey = (shipment.fromAmtBranch || "").trim().toLowerCase();
  const toBranchKey = (shipment.toAmtBranch || "").trim().toLowerCase();
  
  // Extract base package name to match route rates correctly (ignoring suffix)
  const getBasePackageName = (val: string): string => {
    const idx = val.indexOf("(");
    if (idx !== -1) return val.substring(0, idx).trim();
    return val.trim();
  };
  const packageKey = getBasePackageName(shipment.packageType || "").trim().toLowerCase();

  const paymentCompanyVal = shipment.paymentCompany || "";
  if (!paymentCompanyVal) {
    return { transportRate: null, pickupCharge: null, deliveryCharge: null, pricePerPiece: null };
  }

  const payBranchName = shipment.paymentReceivingBranch === "From Company" ? shipment.fromAmtBranch : shipment.paymentReceivingBranch === "To Company" ? shipment.toAmtBranch : "";
  const paymentCompanyDetails = resolveCompanyDetails(paymentCompanyVal, payBranchName, companies);
  const paymentCompanyId = paymentCompanyDetails.companyId;

  const fromCompanyDetails = resolveCompanyDetails(shipment.fromCompany, shipment.fromAmtBranch, companies);
  const fromCompanyId = fromCompanyDetails.companyId;

  const toCompanyDetails = resolveCompanyDetails(shipment.toCompany, shipment.toAmtBranch, companies);
  const toCompanyId = toCompanyDetails.companyId;

  const packageObj = packages.find(
    (p) => p.packageName.trim().toLowerCase() === packageKey
  );
  const packageId = packageObj?.packageId || "";
  const packageExists = !!packageObj && packageObj.status === "Active";

  const paymentCompanyResolved = paymentCompanyDetails.companyName;
  const fromCompanyResolved = fromCompanyDetails.companyName;
  const toCompanyResolved = toCompanyDetails.companyName;

  const fromBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === fromBranchKey
  );
  const fromBranchId = fromBranchObj?.branchId || "";

  const toBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === toBranchKey
  );
  const toBranchId = toBranchObj?.branchId || "";

  let transportRate: number = 0;
  let pickupCharge = 0;
  let deliveryCharge = 0;

  let matchedCompanyRate = null;
  let matchedFromCompanyRate = null;
  let matchedToCompanyRate = null;

  if (packageExists) {
    // 1. Resolve Transport Rate & Scope
    matchedCompanyRate = performCompanyRouteRateLookupAndLog(
      "TRANSPORT",
      companyRouteRates,
      paymentCompanyId,
      paymentCompanyResolved,
      fromBranchId,
      shipment.fromAmtBranch || "",
      toBranchId,
      shipment.toAmtBranch || "",
      packageId,
      packageKey
    );

    if (matchedCompanyRate) {
      transportRate = matchedCompanyRate.transportRate;
    } else {
      const matchedGlobalRate = globalRouteRates.find(
        (g) =>
          g.status === "Active" &&
          (fromBranchId ? (g.fromBranchId === fromBranchId || g.fromBranchName.trim().toLowerCase() === fromBranchKey) : g.fromBranchName.trim().toLowerCase() === fromBranchKey) &&
          (toBranchId ? (g.toBranchId === toBranchId || g.toBranchName.trim().toLowerCase() === toBranchKey) : g.toBranchName.trim().toLowerCase() === toBranchKey) &&
          (packageId ? (g.packageId === packageId || g.packageName.trim().toLowerCase() === packageKey) : g.packageName.trim().toLowerCase() === packageKey)
      );

      if (matchedGlobalRate) {
        transportRate = matchedGlobalRate.rate;
      }
    }

    // 2. Resolve default database pickupCharge
    if (shipment.pickupService === "Home") {
      matchedFromCompanyRate = performCompanyRouteRateLookupAndLog(
        "PICKUP",
        companyRouteRates,
        fromCompanyId,
        fromCompanyResolved,
        fromBranchId,
        shipment.fromAmtBranch || "",
        toBranchId,
        shipment.toAmtBranch || "",
        packageId,
        packageKey
      );
    }

    // 3. Resolve default database deliveryCharge
    if (shipment.deliveryService === "Home") {
      matchedToCompanyRate = performCompanyRouteRateLookupAndLog(
        "DELIVERY",
        companyRouteRates,
        toCompanyId,
        toCompanyResolved,
        fromBranchId,
        shipment.fromAmtBranch || "",
        toBranchId,
        shipment.toAmtBranch || "",
        packageId,
        packageKey
      );
    }
  }

  if (matchedFromCompanyRate && typeof matchedFromCompanyRate.pickupCharge === "number" && !isNaN(matchedFromCompanyRate.pickupCharge)) {
    pickupCharge = matchedFromCompanyRate.pickupCharge;
  }

  if (matchedToCompanyRate && typeof matchedToCompanyRate.deliveryCharge === "number" && !isNaN(matchedToCompanyRate.deliveryCharge)) {
    deliveryCharge = matchedToCompanyRate.deliveryCharge;
  }

  const tRate = (transportRate !== null && transportRate !== undefined && !isNaN(Number(transportRate))) ? Number(transportRate) : 0;
  const pCharge = (pickupCharge !== null && pickupCharge !== undefined && !isNaN(Number(pickupCharge))) ? Number(pickupCharge) : 0;
  const dCharge = (deliveryCharge !== null && deliveryCharge !== undefined && !isNaN(Number(deliveryCharge))) ? Number(deliveryCharge) : 0;
  const pricePerPiece = tRate + pCharge + dCharge;

  return {
    transportRate,
    pickupCharge,
    deliveryCharge,
    pricePerPiece,
  };
}
