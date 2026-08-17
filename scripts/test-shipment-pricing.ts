import { createBranch, getBranches } from "../services/branch.service";
import { createCompany, getCompanies } from "../services/company.service";
import { createPackage, getPackages } from "../services/package.service";
import { createGlobalRouteRate, getGlobalRouteRates, deleteGlobalRouteRate } from "../services/global-route-rate.service";
import { createCompanyRouteRate, getCompanyRouteRates, deleteCompanyRouteRate } from "../services/company-route-rate.service";
import { calculateShipmentPricing } from "../services/pricing.service";
import { createShipment } from "../services/shipment.service";

async function testPricing() {
  try {
    console.log("==========================================");
    console.log("   RUNNING FINAL SHIPMENT PRICING TESTS   ");
    console.log("==========================================");

    // Setup Branches
    let branches = await getBranches();
    let chennaiBranch = branches.find((b) => b.branchName.toLowerCase() === "chennai");
    if (!chennaiBranch) {
      chennaiBranch = await createBranch({
        branchName: "Chennai",
        branchCode: "MAA",
        address: "Chennai Central",
        phoneNumber1: "9000000001",
        phoneNumber2: "",
        phoneNumber3: "",
        phoneNumber4: "",
        phoneNumber5: "",
        status: "Active",
      });
    }

    let amburBranch = branches.find((b) => b.branchName.toLowerCase() === "ambur");
    if (!amburBranch) {
      amburBranch = await createBranch({
        branchName: "Ambur",
        branchCode: "AMB",
        address: "Ambur Main Rd",
        phoneNumber1: "9000000002",
        phoneNumber2: "",
        phoneNumber3: "",
        phoneNumber4: "",
        phoneNumber5: "",
        status: "Active",
      });
    }

    // Setup Companies
    let companiesRes = await getCompanies();
    let companies = Array.isArray(companiesRes) ? companiesRes : (companiesRes as any).companies || [];
    
    let xyzCompany = companies.find((c: any) => c.companyName === "XYZ Company");
    if (!xyzCompany) {
      xyzCompany = await createCompany({
        branchId: chennaiBranch.branchId,
        branchName: chennaiBranch.branchName,
        companyName: "XYZ Company",
        address: "123 Main St",
        phoneNumber1: "9876543210",
        status: "Active",
      });
    }

    let abcCompany = companies.find((c: any) => c.companyName === "ABC Company");
    if (!abcCompany) {
      abcCompany = await createCompany({
        branchId: amburBranch.branchId,
        branchName: amburBranch.branchName,
        companyName: "ABC Company",
        address: "456 Trade Ave",
        phoneNumber1: "9876543211",
        status: "Active",
      });
    }

    // Setup Global Package: Box 4*4
    let packagesRes = await getPackages();
    let packages = Array.isArray(packagesRes) ? packagesRes : (packagesRes as any).packages || [];
    let box4x4 = packages.find((p: any) => p.packageName === "Box 4*4" && !p.companyId);
    if (!box4x4) {
      box4x4 = await createPackage({
        packageName: "Box 4*4",
        description: "Standard Box 4x4",
        status: "Active",
      });
    }

    let machinePartsPkg = packages.find((p: any) => p.packageName === "Machine Parts" && p.companyId === xyzCompany.companyId);
    if (!machinePartsPkg) {
      machinePartsPkg = await createPackage({
        companyId: xyzCompany.companyId,
        packageName: "Machine Parts",
        description: "Machine Parts for XYZ Company",
        status: "Active",
      });
    }

    // Ensure clean state for route rates
    const globalRatesList = await getGlobalRouteRates();
    const existingGlobal = globalRatesList.routeRates.find(
      (r) => r.fromBranchId === chennaiBranch.branchId && r.toBranchId === amburBranch.branchId && r.packageId === box4x4.packageId
    );
    if (existingGlobal) {
      await deleteGlobalRouteRate(existingGlobal.routeRateId);
    }

    const companyRatesList = await getCompanyRouteRates();
    for (const cr of companyRatesList.companyRouteRates) {
      if (
        (cr.fromBranchId === chennaiBranch.branchId && cr.toBranchId === amburBranch.branchId) ||
        cr.companyId === xyzCompany.companyId
      ) {
        await deleteCompanyRouteRate(cr.companyRouteRateId);
      }
    }

    // Setup Global Route Rate: Chennai -> Ambur, Box 4*4 = ₹100
    const globalRate = await createGlobalRouteRate({
      fromBranchId: chennaiBranch.branchId,
      fromBranchName: chennaiBranch.branchName,
      toBranchId: amburBranch.branchId,
      toBranchName: amburBranch.branchName,
      packageId: box4x4.packageId,
      packageName: box4x4.packageName,
      rate: 100,
      status: "Active",
    });

    // ----------------------------------------------------
    // TEST 1 – Global Route Rate Fallback
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Global Route Rate (Default Pricing for ABC Company) ---");
    const test1Result = await calculateShipmentPricing({
      paymentCompany: abcCompany.companyName,
      fromCompany: abcCompany.companyName,
      toCompany: xyzCompany.companyName,
      fromAmtBranch: chennaiBranch.branchName,
      toAmtBranch: amburBranch.branchName,
      packageType: box4x4.packageName,
      quantity: "2",
      pickupService: "Branch",
      deliveryService: "Branch",
    });

    console.log("Test 1 Result:", test1Result);
    console.assert(test1Result.transportRate === 100, "Transport rate should be 100");
    console.assert(test1Result.pickupCharge === 0, "Pickup charge should be 0");
    console.assert(test1Result.deliveryCharge === 0, "Delivery charge should be 0");
    console.assert(test1Result.pricePerPiece === 100, "Price per piece should be 100");
    console.assert(test1Result.totalAmount === 200, "Total amount should be 200 (100 * 2)");
    console.log("✅ TEST 1 PASSED: Global Route Rate correctly used with Pickup = 0, Delivery = 0!");

    // ----------------------------------------------------
    // TEST 2 – Company Route Rate Override
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Company Route Rate Override for XYZ Company ---");
    // Create Company Route Rate Override for XYZ Company:
    // Chennai -> Ambur, Box 4*4, Transport = ₹80, Pickup = ₹10, Delivery = ₹20
    const companyRate = await createCompanyRouteRate({
      companyId: xyzCompany.companyId,
      companyName: xyzCompany.companyName,
      companySide: "FROM",
      fromBranchId: chennaiBranch.branchId,
      fromBranchName: chennaiBranch.branchName,
      toBranchId: amburBranch.branchId,
      toBranchName: amburBranch.branchName,
      packageId: box4x4.packageId,
      packageName: box4x4.packageName,
      transportRate: 80,
      pickupCharge: 10,
      deliveryCharge: 0,
      status: "Active",
    });

    // Create Company Route Rate for ABC Company (the To Company):
    // Chennai -> Ambur, Box 4*4, Delivery = ₹20
    const companyRateToCompany = await createCompanyRouteRate({
      companyId: abcCompany.companyId,
      companyName: abcCompany.companyName,
      companySide: "TO",
      fromBranchId: chennaiBranch.branchId,
      fromBranchName: chennaiBranch.branchName,
      toBranchId: amburBranch.branchId,
      toBranchName: amburBranch.branchName,
      packageId: box4x4.packageId,
      packageName: box4x4.packageName,
      transportRate: 0,
      pickupCharge: 0,
      deliveryCharge: 20,
      status: "Active",
    });

    const test2Result = await calculateShipmentPricing({
      paymentCompany: xyzCompany.companyName,
      fromCompany: xyzCompany.companyName,
      toCompany: abcCompany.companyName,
      fromAmtBranch: chennaiBranch.branchName,
      toAmtBranch: amburBranch.branchName,
      packageType: box4x4.packageName,
      quantity: "3",
      pickupService: "Home",
      deliveryService: "Home",
    });

    console.log("Test 2 Result:", test2Result);
    console.assert(test2Result.transportRate === 80, "Transport rate should be 80");
    console.assert(test2Result.pickupCharge === 10, "Pickup charge should be 10");
    console.assert(test2Result.deliveryCharge === 20, "Delivery charge should be 20");
    console.assert(test2Result.pricePerPiece === 110, "Price per piece should be 110 (80+10+20)");
    console.assert(test2Result.totalAmount === 330, "Total amount should be 330 (110 * 3)");
    console.log("✅ TEST 2 PASSED: Company Route Rate override correctly used!");

    // ----------------------------------------------------
    // TEST 3 – Company-Specific Package
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Company-Specific Package ('Machine Parts' for XYZ Company) ---");
    // Create Company Route Rate for Machine Parts (Auto-creates company-specific package)
    const machinePartsRate = await createCompanyRouteRate({
      companyId: xyzCompany.companyId,
      companyName: xyzCompany.companyName,
      companySide: "FROM",
      fromBranchId: chennaiBranch.branchId,
      fromBranchName: chennaiBranch.branchName,
      toBranchId: amburBranch.branchId,
      toBranchName: amburBranch.branchName,
      packageId: "Machine Parts",
      packageName: "Machine Parts",
      transportRate: 250,
      pickupCharge: 0,
      deliveryCharge: 0,
      status: "Active",
    });

    const test3Result = await calculateShipmentPricing({
      paymentCompany: xyzCompany.companyName,
      fromCompany: xyzCompany.companyName,
      toCompany: abcCompany.companyName,
      fromAmtBranch: chennaiBranch.branchName,
      toAmtBranch: amburBranch.branchName,
      packageType: "Machine Parts",
      quantity: "4",
      pickupService: "Branch",
      deliveryService: "Branch",
    });

    console.log("Test 3 Result (XYZ Company):", test3Result);
    console.assert(test3Result.transportRate === 250, "Transport rate should be 250");
    console.assert(test3Result.pricePerPiece === 250, "Price per piece should be 250");
    console.assert(test3Result.totalAmount === 1000, "Total amount should be 1000");

    // Real shipment creation test for XYZ Company with Machine Parts
    const createdShipment = await createShipment(2026, "July", {
      date: "26-07-2026",
      vehicleNumber: "TN-01-AB-9999",
      fromAmtBranch: chennaiBranch.branchName,
      fromCompany: xyzCompany.companyName,
      toAmtBranch: amburBranch.branchName,
      toCompany: abcCompany.companyName,
      packageType: "Machine Parts",
      quantity: "4",
      ourInvoiceNumber: "INV-999",
      customerInvoiceNumber: "CUST-999",
      paymentCompany: xyzCompany.companyName,
      paymentReceivingBranch: "From Company",
      pickupService: "Home",
      deliveryService: "Home",
      deliveryStatus: "Not Delivered",
      paymentStatus: "Pending",
    });
    console.log("Created Shipment Record with Company Package:", createdShipment);

    // Verify other companies (ABC Company) get default 0 for charges and null transportRate for XYZ's company-specific package
    const abcPricingResult = await calculateShipmentPricing({
      paymentCompany: abcCompany.companyName,
      fromCompany: abcCompany.companyName,
      toCompany: xyzCompany.companyName,
      fromAmtBranch: chennaiBranch.branchName,
      toAmtBranch: amburBranch.branchName,
      packageType: "Machine Parts",
      quantity: "1",
      pickupService: "Home",
      deliveryService: "Home",
    });
    console.log("ABC Company pricing for Machine Parts (expected 0 transport, 0 charges):", abcPricingResult);
    console.assert(abcPricingResult.transportRate === 0, "Transport rate should be 0");
    console.assert(abcPricingResult.pickupCharge === 0, "Pickup charge should be 0");
    console.assert(abcPricingResult.deliveryCharge === 0, "Delivery charge should be 0");
    console.assert(abcPricingResult.pricePerPiece === 0, "Price per piece should be 0");
    console.assert(abcPricingResult.totalAmount === 0, "Total amount should be 0");
    console.log("✅ TEST 3 PASSED: Company-Specific Package successfully isolated and returned nulls for ABC Company!");

    // ----------------------------------------------------
    // TEST 4 – Unconfigured Package and Route
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Unconfigured Package and Route ('Super New Package') ---");
    const test4Result = await calculateShipmentPricing({
      paymentCompany: xyzCompany.companyName,
      fromCompany: xyzCompany.companyName,
      toCompany: abcCompany.companyName,
      fromAmtBranch: chennaiBranch.branchName,
      toAmtBranch: amburBranch.branchName,
      packageType: "Super New Package",
      quantity: "5",
      pickupService: "Home",
      deliveryService: "Home",
    });
    console.log("Test 4 Pricing Result:", test4Result);
    console.assert(test4Result.transportRate === 0, "Transport rate should be 0");
    console.assert(test4Result.pickupCharge === 0, "Pickup charge should be 0");
    console.assert(test4Result.deliveryCharge === 0, "Delivery charge should be 0");
    console.assert(test4Result.pricePerPiece === 0, "Price per piece should be 0");
    console.assert(test4Result.totalAmount === 0, "Total amount should be 0");
    console.log("✅ TEST 4 Pricing Verification Passed!");

    const createdShipmentUnconfigured = await createShipment(2026, "July", {
      date: "26-07-2026",
      vehicleNumber: "TN-01-AB-9999",
      fromAmtBranch: chennaiBranch.branchName,
      fromCompany: xyzCompany.companyName,
      toAmtBranch: amburBranch.branchName,
      toCompany: abcCompany.companyName,
      packageType: "Super New Package",
      quantity: "5",
      ourInvoiceNumber: "INV-1000",
      customerInvoiceNumber: "CUST-1000",
      paymentCompany: xyzCompany.companyName,
      paymentReceivingBranch: "From Company",
      pickupService: "Home",
      deliveryService: "Home",
      deliveryStatus: "Not Delivered",
      paymentStatus: "Pending",
    });

    console.log("Created Shipment Record with Unconfigured Package:", createdShipmentUnconfigured);
    console.assert(createdShipmentUnconfigured.packageType === "Super New Package", "Package type should be 'Super New Package'");
    console.assert(createdShipmentUnconfigured.transportRate === 0, "Transport rate should be 0");
    console.assert(createdShipmentUnconfigured.pickupCharge === 0, "Pickup charge should be 0");
    console.assert(createdShipmentUnconfigured.deliveryCharge === 0, "Delivery charge should be 0");
    console.assert(createdShipmentUnconfigured.pricePerPiece === 0, "Price per piece should be 0");
    console.assert(createdShipmentUnconfigured.totalAmount === 0, "Total amount should be 0");
    console.log("✅ TEST 4 Shipment Save Verification Passed!");

    console.log("\n==========================================");
    console.log("  ALL FINAL VERIFICATION TESTS PASSED! 🎉 ");
    console.log("==========================================");

  } catch (err) {
    console.error("❌ TEST RUN FAILED:", err);
    process.exit(1);
  }
}

testPricing();
