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

function performCompanyRouteRateLookupAndLog(
  label: string,
  companyRates: any[],
  expectedCompanyId: string,
  expectedCompanyName: string,
  expectedCompanySide: "FROM" | "TO" | undefined,
  expectedFromBranchId: string,
  expectedFromBranchName: string,
  expectedToBranchId: string,
  expectedToBranchName: string,
  expectedPackageId: string,
  expectedPackageName: string
) {
  const fromBranchKey = expectedFromBranchName.trim().toLowerCase();
  const toBranchKey = expectedToBranchName.trim().toLowerCase();
  const packageKey = expectedPackageName.trim().toLowerCase();

  console.log(`\n========================================`);
  console.log(`${label} LOOKUP`);
  console.log(`========================================`);
  console.log(`Expected keys:`);
  console.log(`- Company Name   : ${expectedCompanyName}`);
  console.log(`- Company ID     : ${expectedCompanyId}`);
  console.log(`- Company Side   : ${expectedCompanySide || "ANY"}`);
  console.log(`- From Branch ID : ${expectedFromBranchId} (${expectedFromBranchName})`);
  console.log(`- To Branch ID   : ${expectedToBranchId} (${expectedToBranchName})`);
  console.log(`- Package ID     : ${expectedPackageId} (${expectedPackageName})`);

  let matchedRate = null;
  const candidates: any[] = [];

  for (const c of companyRates) {
    if (c.status !== "Active") continue;

    // Check if company matches (case-insensitive)
    const isCompanyMatch = c.companyId.toLowerCase() === expectedCompanyId.toLowerCase();
    if (!isCompanyMatch) continue;

    // Company matched, this is a candidate!
    const sideMatch = !c.companySide || !expectedCompanySide || c.companySide === expectedCompanySide;
    const fromBranchMatch = expectedFromBranchId ? (c.fromBranchId === expectedFromBranchId || c.fromBranchName.toLowerCase() === fromBranchKey) : c.fromBranchName.toLowerCase() === fromBranchKey;
    const toBranchMatch = expectedToBranchId ? (c.toBranchId === expectedToBranchId || c.toBranchName.toLowerCase() === toBranchKey) : c.toBranchName.toLowerCase() === toBranchKey;
    const packageMatch = expectedPackageId ? (c.packageId === expectedPackageId || c.packageName.toLowerCase() === packageKey) : c.packageName.toLowerCase() === packageKey;

    const isMatch = sideMatch && fromBranchMatch && toBranchMatch && packageMatch;

    candidates.push({
      rate: c,
      checks: {
        companyId: true,
        companySide: sideMatch,
        fromBranch: fromBranchMatch,
        toBranch: toBranchMatch,
        package: packageMatch
      }
    });

    if (isMatch) {
      matchedRate = c;
    }
  }

  // Print near-matches / candidates
  if (candidates.length > 0) {
    console.log(`\nCandidates (Company matched):`);
    candidates.forEach((cand, idx) => {
      const c = cand.rate;
      const ch = cand.checks;
      console.log(`Candidate #${idx + 1}:`);
      console.log(`  Row Details: CompanyId=${c.companyId}, Side=${c.companySide}, FromBranchId=${c.fromBranchId} (${c.fromBranchName}), ToBranchId=${c.toBranchId} (${c.toBranchName}), PackageId=${c.packageId} (${c.packageName})`);
      console.log(`  Checks:`);
      console.log(`    Company ID   : ✅`);
      console.log(`    Company Side : ${ch.companySide ? "✅" : "❌ (Expected: " + expectedCompanySide + ", Found: " + c.companySide + ")"}`);
      console.log(`    From Branch  : ${ch.fromBranch ? "✅" : "❌ (Expected: " + (expectedFromBranchId || "none") + "/" + expectedFromBranchName + ", Found: " + c.fromBranchId + "/" + c.fromBranchName + ")"}`);
      console.log(`    To Branch    : ${ch.toBranch ? "✅" : "❌ (Expected: " + (expectedToBranchId || "none") + "/" + expectedToBranchName + ", Found: " + c.toBranchId + "/" + c.toBranchName + ")"}`);
      console.log(`    Package      : ${ch.package ? "✅" : "❌ (Expected: " + (expectedPackageId || "none") + "/" + expectedPackageName + ", Found: " + c.packageId + "/" + c.packageName + ")"}`);
    });
  } else {
    console.log(`\nNo candidates found for Company ID ${expectedCompanyId} in active rates.`);
  }

  if (matchedRate) {
    console.log(`\n✅ MATCH FOUND`);
    console.log(`Rate Row:`, matchedRate);
  } else {
    console.log(`\n❌ NO MATCH`);
  }
  console.log(`========================================\n`);

  return matchedRate;
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
  > & {
    paymentCompany?: string;
    paymentReceivingBranch?: "From Company" | "To Company" | "";
    transportRate?: number | null;
    pickupCharge?: number | null;
    deliveryCharge?: number | null;
  }
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

  // Derive expected companySide for payment company from paymentReceivingBranch
  let expectedPaymentCompanySide: "FROM" | "TO" = "FROM";
  if (shipment.paymentReceivingBranch === "To Company") {
    expectedPaymentCompanySide = "TO";
  } else if (shipment.paymentReceivingBranch === "From Company") {
    expectedPaymentCompanySide = "FROM";
  } else {
    const prbClean = (shipment.paymentReceivingBranch || "").trim().toLowerCase();
    const toBranchClean = (resolvedShipment.toAmtBranch || "").trim().toLowerCase();
    if (prbClean && toBranchClean && prbClean === toBranchClean) {
      expectedPaymentCompanySide = "TO";
    } else if (paymentCompanyId && toCompanyId && paymentCompanyId === toCompanyId) {
      expectedPaymentCompanySide = "TO";
    } else {
      expectedPaymentCompanySide = "FROM";
    }
  }

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

  const packageId = packageObj?.packageId || "";

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

  let transportRate: number = 0;
  let pickupCharge = 0;
  let deliveryCharge = 0;

  const companyRates = await readCompanyRouteRates();

  let matchedCompanyRate = null;
  let matchedFromCompanyRate = null;
  let matchedToCompanyRate = null;

  if (packageExists) {
    // 1. Resolve Transport Rate
    matchedCompanyRate = performCompanyRouteRateLookupAndLog(
      "TRANSPORT",
      companyRates,
      paymentCompanyId,
      paymentCompanyResolved,
      expectedPaymentCompanySide,
      fromBranchId,
      resolvedShipment.fromAmtBranch || "",
      toBranchId,
      resolvedShipment.toAmtBranch || "",
      packageId,
      packageKey
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
      }
    }

    // 2. Resolve default database pickupCharge
    if (resolvedShipment.pickupService === "Home") {
      matchedFromCompanyRate = performCompanyRouteRateLookupAndLog(
        "PICKUP",
        companyRates,
        fromCompanyId,
        fromCompanyResolved,
        "FROM",
        fromBranchId,
        resolvedShipment.fromAmtBranch || "",
        toBranchId,
        resolvedShipment.toAmtBranch || "",
        packageId,
        packageKey
      );
    }

    // 3. Resolve default database deliveryCharge
    if (resolvedShipment.deliveryService === "Home") {
      matchedToCompanyRate = performCompanyRouteRateLookupAndLog(
        "DELIVERY",
        companyRates,
        toCompanyId,
        toCompanyResolved,
        "TO",
        fromBranchId,
        resolvedShipment.fromAmtBranch || "",
        toBranchId,
        resolvedShipment.toAmtBranch || "",
        packageId,
        packageKey
      );
    }
  }

  // If client provided a valid transportRate, respect it
  if (typeof shipment.transportRate === "number" && !isNaN(shipment.transportRate) && shipment.transportRate >= 0) {
    transportRate = shipment.transportRate;
  }

  // Resolve final pickup charge
  let dbPickupCharge = 0;
  if (matchedFromCompanyRate && typeof matchedFromCompanyRate.pickupCharge === "number" && !isNaN(matchedFromCompanyRate.pickupCharge)) {
    dbPickupCharge = matchedFromCompanyRate.pickupCharge;
  }

  if (typeof shipment.pickupCharge === "number" && !isNaN(shipment.pickupCharge) && shipment.pickupCharge >= 0) {
    pickupCharge = shipment.pickupCharge;
  } else {
    pickupCharge = dbPickupCharge;
  }

  // Resolve final delivery charge
  let dbDeliveryCharge = 0;
  if (matchedToCompanyRate && typeof matchedToCompanyRate.deliveryCharge === "number" && !isNaN(matchedToCompanyRate.deliveryCharge)) {
    dbDeliveryCharge = matchedToCompanyRate.deliveryCharge;
  }

  if (typeof shipment.deliveryCharge === "number" && !isNaN(shipment.deliveryCharge) && shipment.deliveryCharge >= 0) {
    deliveryCharge = shipment.deliveryCharge;
  } else {
    deliveryCharge = dbDeliveryCharge;
  }

  // 4. Price Calculation
  const tRate = (transportRate !== null && transportRate !== undefined && !isNaN(Number(transportRate))) ? Number(transportRate) : 0;
  const pCharge = (pickupCharge !== null && pickupCharge !== undefined && !isNaN(Number(pickupCharge))) ? Number(pickupCharge) : 0;
  const dCharge = (deliveryCharge !== null && deliveryCharge !== undefined && !isNaN(Number(deliveryCharge))) ? Number(deliveryCharge) : 0;

  const pricePerPiece = tRate + pCharge + dCharge;
  const quantityNum = calculateQuantity(resolvedShipment.quantity);
  const totalAmount = pricePerPiece * quantityNum;

  return {
    transportRate,
    pickupCharge,
    deliveryCharge,
    pricePerPiece,
    totalAmount,
  };
}
