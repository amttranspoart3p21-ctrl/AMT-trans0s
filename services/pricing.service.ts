import { readGlobalRouteRates } from "@/lib/global-route-rate";
import { readCompanyRouteRates } from "@/lib/company-route-rate";
import { readPackages } from "@/lib/package";
import type { Shipment } from "@/types/shipment";
import { resolveCompanyDetails, resolveCompanyNamesInShipment, calculateQuantity } from "@/utils/shipment";
import { readCompanies } from "@/lib/company";
import { readBranches } from "@/lib/branch";

export interface PricingCalculationResult {
  transportRate: number | null;
  pickupCharge: number | null;
  deliveryCharge: number | null;
  pricePerPiece: number | null;
  totalAmount: number | null;
}

export async function calculateShipmentPricing(
  shipment: Pick<
    Shipment,
    | "fromAmtBranch"
    | "fromCompany"
    | "toAmtBranch"
    | "toCompany"
    | "packageType"
    | "quantity"
    | "pickupService"
    | "deliveryService"
  > & { paymentCompany?: string; paymentReceivingBranch?: "From Company" | "To Company" | "" }
): Promise<PricingCalculationResult> {
  const companies = await readCompanies();
  const resolvedShipment = await resolveCompanyNamesInShipment(shipment);

  // 1. Resolve paymentCompany
  const paymentCompanyVal = shipment.paymentCompany || "";
  if (!paymentCompanyVal) {
    return {
      transportRate: null,
      pickupCharge: null,
      deliveryCharge: null,
      pricePerPiece: null,
      totalAmount: null,
    };
  }
  let paymentBranchVal = "";
  if (shipment.paymentReceivingBranch === "From Company") {
    paymentBranchVal = shipment.fromAmtBranch || "";
  } else if (shipment.paymentReceivingBranch === "To Company") {
    paymentBranchVal = shipment.toAmtBranch || "";
  }
  const paymentDetails = resolveCompanyDetails(paymentCompanyVal, paymentBranchVal, companies);
  const paymentCompanyId = paymentDetails.companyId;
  const paymentCompanyResolved = paymentDetails.companyName;

  // 2. Resolve fromCompany
  const fromDetails = resolveCompanyDetails(shipment.fromCompany, shipment.fromAmtBranch, companies);
  const fromCompanyId = fromDetails.companyId;
  const fromCompanyResolved = fromDetails.companyName;

  // 3. Resolve toCompany
  const toDetails = resolveCompanyDetails(shipment.toCompany, shipment.toAmtBranch, companies);
  const toCompanyId = toDetails.companyId;
  const toCompanyResolved = toDetails.companyName;

  const fromBranchKey = (resolvedShipment.fromAmtBranch || "").trim().toLowerCase();
  const toBranchKey = (resolvedShipment.toAmtBranch || "").trim().toLowerCase();
  const getBasePackageName = (val: string): string => {
    const idx = val.indexOf("(");
    if (idx !== -1) return val.substring(0, idx).trim();
    return val.trim();
  };
  const packageKey = getBasePackageName(resolvedShipment.packageType || "").trim().toLowerCase();

  // Check if package exists in the Package Master (active packages only)
  const packages = await readPackages();
  const packageObj = packages.find(
    (p) =>
      p.status === "Active" &&
      (p.packageName.trim().toLowerCase() === packageKey ||
        p.packageId.trim().toLowerCase() === packageKey)
  );
  const packageExists = !!packageObj;

  if (!packageExists) {
    return {
      transportRate: null,
      pickupCharge: null,
      deliveryCharge: null,
      pricePerPiece: null,
      totalAmount: null,
    };
  }

  const packageId = packageObj.packageId;

  // Resolve branch IDs
  const branches = await readBranches();
  const fromBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === fromBranchKey
  );
  const fromBranchId = fromBranchObj?.branchId || "";

  const toBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === toBranchKey
  );
  const toBranchId = toBranchObj?.branchId || "";

  let transportRate: number | null = null;
  let pickupCharge = 0;
  let deliveryCharge = 0;
  let isGlobalPackage = false;

  // 1. Resolve Transport Rate
  const companyRates = await readCompanyRouteRates();
  const matchedCompanyRate = companyRates.find(
    (c) =>
      c.status === "Active" &&
      c.companyId.toLowerCase() === paymentCompanyId.toLowerCase() &&
      (fromBranchId ? (c.fromBranchId === fromBranchId || c.fromBranchName.toLowerCase() === fromBranchKey) : c.fromBranchName.toLowerCase() === fromBranchKey) &&
      (toBranchId ? (c.toBranchId === toBranchId || c.toBranchName.toLowerCase() === toBranchKey) : c.toBranchName.toLowerCase() === toBranchKey) &&
      (packageId ? (c.packageId === packageId || c.packageName.toLowerCase() === packageKey) : c.packageName.toLowerCase() === packageKey)
  );

  if (matchedCompanyRate) {
    transportRate = matchedCompanyRate.transportRate;
  } else {
    // STEP 2: Search Global Route Rate (From Branch + To Branch + Package)
    const globalRates = await readGlobalRouteRates();
    const matchedGlobalRate = globalRates.find(
      (g) =>
        g.status === "Active" &&
        (fromBranchId ? (g.fromBranchId === fromBranchId || g.fromBranchName.toLowerCase() === fromBranchKey) : g.fromBranchName.toLowerCase() === fromBranchKey) &&
        (toBranchId ? (g.toBranchId === toBranchId || g.toBranchName.toLowerCase() === toBranchKey) : g.toBranchName.toLowerCase() === toBranchKey) &&
        (packageId ? (g.packageId === packageId || g.packageName.toLowerCase() === packageKey) : g.packageName.toLowerCase() === packageKey)
    );

    if (matchedGlobalRate) {
      transportRate = matchedGlobalRate.rate;
      isGlobalPackage = true;
    }
  }

  if (isGlobalPackage) {
    pickupCharge = 0;
    deliveryCharge = 0;
  } else {
    // 2. Resolve Pickup Charge (always belongs to Sender Company package)
    if (resolvedShipment.pickupService === "Branch" || resolvedShipment.pickupService === "Free Home") {
      pickupCharge = 0;
    } else if (resolvedShipment.pickupService === "Home") {
      const matchedFromCompanyRate = companyRates.find(
        (c) =>
          c.status === "Active" &&
          c.companyId.toLowerCase() === fromCompanyId.toLowerCase() &&
          (fromBranchId ? (c.fromBranchId === fromBranchId || c.fromBranchName.toLowerCase() === fromBranchKey) : c.fromBranchName.toLowerCase() === fromBranchKey) &&
          (toBranchId ? (c.toBranchId === toBranchId || c.toBranchName.toLowerCase() === toBranchKey) : c.toBranchName.toLowerCase() === toBranchKey) &&
          (packageId ? (c.packageId === packageId || c.packageName.toLowerCase() === packageKey) : c.packageName.toLowerCase() === packageKey)
      );

      if (matchedFromCompanyRate && typeof matchedFromCompanyRate.pickupCharge === "number" && !isNaN(matchedFromCompanyRate.pickupCharge)) {
        pickupCharge = matchedFromCompanyRate.pickupCharge;
      } else {
        pickupCharge = 0;
      }
    }

    // 3. Resolve Delivery Charge (always belongs to Receiver Company package)
    if (resolvedShipment.deliveryService === "Branch" || resolvedShipment.deliveryService === "Free Home") {
      deliveryCharge = 0;
    } else if (resolvedShipment.deliveryService === "Home") {
      const matchedToCompanyRate = companyRates.find(
        (c) =>
          c.status === "Active" &&
          c.companyId.toLowerCase() === toCompanyId.toLowerCase() &&
          (fromBranchId ? (c.fromBranchId === fromBranchId || c.fromBranchName.toLowerCase() === fromBranchKey) : c.fromBranchName.toLowerCase() === fromBranchKey) &&
          (toBranchId ? (c.toBranchId === toBranchId || c.toBranchName.toLowerCase() === toBranchKey) : c.toBranchName.toLowerCase() === toBranchKey) &&
          (packageId ? (c.packageId === packageId || c.packageName.toLowerCase() === packageKey) : c.packageName.toLowerCase() === packageKey)
      );

      if (matchedToCompanyRate && typeof matchedToCompanyRate.deliveryCharge === "number" && !isNaN(matchedToCompanyRate.deliveryCharge)) {
        deliveryCharge = matchedToCompanyRate.deliveryCharge;
      } else {
        deliveryCharge = 0;
      }
    }
  }

  // 4. Price Calculation
  let pricePerPiece: number | null = null;
  let totalAmount: number | null = null;

  if (transportRate !== null) {
    pricePerPiece = transportRate + pickupCharge + deliveryCharge;
    const quantityNum = calculateQuantity(resolvedShipment.quantity);
    totalAmount = pricePerPiece * quantityNum;
  }

  return {
    transportRate,
    pickupCharge,
    deliveryCharge,
    pricePerPiece,
    totalAmount,
  };
}
