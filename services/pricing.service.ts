import { readGlobalRouteRates } from "@/lib/global-route-rate";
import { readCompanyRouteRates } from "@/lib/company-route-rate";
import type { Shipment } from "@/types/shipment";

export interface PricingCalculationResult {
  transportRate: number;
  pickupCharge: number;
  deliveryCharge: number;
  pricePerPiece: number;
  totalAmount: number;
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
  > & { paymentCompany?: string }
): Promise<PricingCalculationResult> {
  const companyKey = (shipment.paymentCompany || shipment.fromCompany || "").trim().toLowerCase();
  const fromBranchKey = (shipment.fromAmtBranch || "").trim().toLowerCase();
  const toBranchKey = (shipment.toAmtBranch || "").trim().toLowerCase();
  const packageKey = (shipment.packageType || "").trim().toLowerCase();

  // STEP 1: Search Company Route Rate (Company + From Branch + To Branch + Package)
  const companyRates = await readCompanyRouteRates();
  const matchedCompanyRate = companyRates.find(
    (c) =>
      c.status === "Active" &&
      (c.companyId.toLowerCase() === companyKey || c.companyName.toLowerCase() === companyKey) &&
      (c.fromBranchId.toLowerCase() === fromBranchKey || c.fromBranchName.toLowerCase() === fromBranchKey) &&
      (c.toBranchId.toLowerCase() === toBranchKey || c.toBranchName.toLowerCase() === toBranchKey) &&
      (c.packageId.toLowerCase() === packageKey || c.packageName.toLowerCase() === packageKey)
  );

  let transportRate = 0;
  let pickupCharge = 0;
  let deliveryCharge = 0;

  if (matchedCompanyRate) {
    // Step 1 Match: Company Override
    transportRate = matchedCompanyRate.transportRate;
    pickupCharge = matchedCompanyRate.pickupCharge;
    deliveryCharge = matchedCompanyRate.deliveryCharge;
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
      // Step 2 Match: Global Default Rate
      transportRate = matchedGlobalRate.rate;
      pickupCharge = 0;
      deliveryCharge = 0;
    } else {
      // STEP 3: Neither exists -> Validation error
      throw new Error("No transport rate configured for this package.");
    }
  }

  // STEP 4: Price Calculation
  const pricePerPiece = transportRate + pickupCharge + deliveryCharge;
  const quantity = shipment.quantity || 1;
  const totalAmount = pricePerPiece * quantity;

  return {
    transportRate,
    pickupCharge,
    deliveryCharge,
    pricePerPiece,
    totalAmount,
  };
}
