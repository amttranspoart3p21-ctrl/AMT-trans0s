import { readGlobalRouteRates } from "@/lib/global-route-rate";
import { readCompanyRouteRates } from "@/lib/company-route-rate";
import { readPackages } from "@/lib/package";
import type { Shipment } from "@/types/shipment";
import { resolveCompanyDetails, resolveCompanyNamesInShipment } from "@/utils/shipment";
import { readCompanies } from "@/lib/company";

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
  > & { paymentCompany?: string; paymentReceivingBranch?: "From Company" | "To Company" }
): Promise<PricingCalculationResult> {
  const companies = await readCompanies();
  const resolvedShipment = await resolveCompanyNamesInShipment(shipment);

  // 1. Resolve paymentCompany
  const paymentCompanyVal = shipment.paymentCompany || shipment.fromCompany || "";
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
  const packageKey = (resolvedShipment.packageType || "").trim().toLowerCase();

  // Check if package exists in the Package Master (active packages only) and is accessible to this company
  const packages = await readPackages();
  const packageExists = packages.some(
    (p) =>
      p.status === "Active" &&
      (p.packageName.trim().toLowerCase() === packageKey ||
        p.packageId.trim().toLowerCase() === packageKey) &&
      (!p.companyId ||
        (paymentCompanyId
          ? p.companyId.toLowerCase() === paymentCompanyId.toLowerCase()
          : p.companyName?.toLowerCase() === paymentCompanyResolved.toLowerCase()))
  );

  if (!packageExists) {
    return {
      transportRate: null,
      pickupCharge: null,
      deliveryCharge: null,
      pricePerPiece: null,
      totalAmount: null,
    };
  }

  let transportRate: number | null = null;
  let pickupCharge: number | null = null;
  let deliveryCharge: number | null = null;

  // 1. Resolve Transport Rate
  // STEP 1: Search Company Route Rate (Company + From Branch + To Branch + Package)
  const companyRates = await readCompanyRouteRates();
  const matchedCompanyRate = companyRates.find(
    (c) =>
      c.status === "Active" &&
      (paymentCompanyId
        ? c.companyId.toLowerCase() === paymentCompanyId.toLowerCase()
        : c.companyName.toLowerCase() === paymentCompanyResolved.toLowerCase()) &&
      (c.fromBranchId.toLowerCase() === fromBranchKey || c.fromBranchName.toLowerCase() === fromBranchKey) &&
      (c.toBranchId.toLowerCase() === toBranchKey || c.toBranchName.toLowerCase() === toBranchKey) &&
      (c.packageId.toLowerCase() === packageKey || c.packageName.toLowerCase() === packageKey)
  );

  if (matchedCompanyRate) {
    transportRate = matchedCompanyRate.transportRate;
  } else {
    // STEP 2: Search Global Route Rate (From Branch + To Branch + Package)
    const globalRates = await readGlobalRouteRates();
    const matchedGlobalRate = globalRates.find(
      (g) =>
        g.status === "Active" &&
        (g.fromBranchId.toLowerCase() === fromBranchKey || g.fromBranchName.toLowerCase() === fromBranchKey) &&
        (g.toBranchId.toLowerCase() === toBranchKey || g.toBranchName.toLowerCase() === toBranchKey) &&
        (g.packageId.toLowerCase() === packageKey || g.packageName.toLowerCase() === packageKey)
    );

    if (matchedGlobalRate) {
      transportRate = matchedGlobalRate.rate;
    }
  }

  // 2. Resolve Pickup Charge (depends on From Company)
  if (resolvedShipment.pickupService === "Branch" || resolvedShipment.pickupService === "Free Home") {
    pickupCharge = 0;
  } else {
    const matchedFromCompanyRate = companyRates.find(
      (c) =>
        c.status === "Active" &&
        (fromCompanyId
          ? c.companyId.toLowerCase() === fromCompanyId.toLowerCase()
          : c.companyName.toLowerCase() === fromCompanyResolved.toLowerCase()) &&
        (c.fromBranchId.toLowerCase() === fromBranchKey || c.fromBranchName.toLowerCase() === fromBranchKey) &&
        (c.toBranchId.toLowerCase() === toBranchKey || c.toBranchName.toLowerCase() === toBranchKey) &&
        (c.packageId.toLowerCase() === packageKey || c.packageName.toLowerCase() === packageKey)
    );

    if (matchedFromCompanyRate && typeof matchedFromCompanyRate.pickupCharge === "number" && !isNaN(matchedFromCompanyRate.pickupCharge)) {
      pickupCharge = matchedFromCompanyRate.pickupCharge;
    } else if (resolvedShipment.pickupService === undefined) {
      // Fallback for cases like tests where pickupService is omitted:
      // If no company-specific rate is configured, default to 0 (old behavior fallback)
      pickupCharge = 0;
    }
  }

  // 3. Resolve Delivery Charge (depends on To Company)
  if (resolvedShipment.deliveryService === "Branch" || resolvedShipment.deliveryService === "Free Home") {
    deliveryCharge = 0;
  } else {
    const matchedToCompanyRate = companyRates.find(
      (c) =>
        c.status === "Active" &&
        (toCompanyId
          ? c.companyId.toLowerCase() === toCompanyId.toLowerCase()
          : c.companyName.toLowerCase() === toCompanyResolved.toLowerCase()) &&
        (c.fromBranchId.toLowerCase() === fromBranchKey || c.fromBranchName.toLowerCase() === fromBranchKey) &&
        (c.toBranchId.toLowerCase() === toBranchKey || c.toBranchName.toLowerCase() === toBranchKey) &&
        (c.packageId.toLowerCase() === packageKey || c.packageName.toLowerCase() === packageKey)
    );

    if (matchedToCompanyRate && typeof matchedToCompanyRate.deliveryCharge === "number" && !isNaN(matchedToCompanyRate.deliveryCharge)) {
      deliveryCharge = matchedToCompanyRate.deliveryCharge;
    } else if (resolvedShipment.deliveryService === undefined) {
      // Fallback for cases like tests where deliveryService is omitted:
      // If no company-specific rate is configured, default to 0 (old behavior fallback)
      deliveryCharge = 0;
    }
  }

  // 4. Price Calculation
  let pricePerPiece: number | null = null;
  let totalAmount: number | null = null;

  if (transportRate !== null && pickupCharge !== null && deliveryCharge !== null) {
    pricePerPiece = transportRate + pickupCharge + deliveryCharge;
    const quantity = resolvedShipment.quantity || 1;
    totalAmount = pricePerPiece * quantity;
  }

  return {
    transportRate,
    pickupCharge,
    deliveryCharge,
    pricePerPiece,
    totalAmount,
  };
}
