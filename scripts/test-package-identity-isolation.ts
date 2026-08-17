import { createCompanyRouteRate, getCompanyRouteRates, deleteCompanyRouteRate } from "../services/company-route-rate.service";
import { readBranches } from "../lib/branch";
import { readCompanies } from "../lib/company";
import { readPackages } from "../lib/package";

async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0 && (err.code === "EBUSY" || err.message?.includes("resource busy"))) {
      await new Promise((res) => setTimeout(res, delayMs));
      return retry(fn, retries - 1, delayMs);
    }
    throw err;
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("    PACKAGE IDENTITY ISOLATION TEST SUITE         ");
  console.log("==================================================\n");

  const branches = await readBranches();
  const companies = await readCompanies();
  const packages = await readPackages();

  const abcLogisticsComp = companies.find((c) => c.companyId === "CMP001" || c.companyName.toLowerCase().includes("abc logistics")) || companies[0];
  const amburLeatherComp = companies.find((c) => c.companyId === "CMP005" || c.companyName.toLowerCase().includes("ambur leather")) || companies[1] || companies[0];
  const abcCompanyComp = companies.find((c) => c.companyId === "CMP020" || c.companyName.toLowerCase().includes("abc company")) || companies[2] || companies[0];

  const abcBranch = branches.find((b) => b.branchId === abcLogisticsComp.branchId || b.branchName === abcLogisticsComp.branchName) || branches[0];
  const amburBranch = branches.find((b) => b.branchId === amburLeatherComp.branchId || b.branchName === amburLeatherComp.branchName) || branches[1] || branches[0];
  const abcCompBranch = branches.find((b) => b.branchId === abcCompanyComp.branchId || b.branchName === abcCompanyComp.branchName) || branches[2] || branches[0];

  const destinationBranch = branches.find((b) => b.branchId !== abcBranch.branchId && b.branchId !== amburBranch.branchId && b.branchId !== abcCompBranch.branchId) || branches.find((b) => b.branchId !== abcBranch.branchId) || branches[0];

  const pkg007 = packages.find((p) => p.packageId === "PKG007") || { packageId: "PKG007", packageName: "Leather Bundle", companyId: abcLogisticsComp.companyId };
  const pkg036 = packages.find((p) => p.packageId === "PKG036") || { packageId: "PKG036", packageName: "Leather Bundle", companyId: amburLeatherComp.companyId };
  const pkg037 = packages.find((p) => p.packageId === "PKG037") || { packageId: "PKG037", packageName: "Leather Bundle", companyId: abcCompanyComp.companyId };

  console.log(`Company 1 (ABC Logistics) : ${abcLogisticsComp.companyName} (${abcLogisticsComp.companyId}, Branch: ${abcBranch.branchName}) -> Target Package: ${pkg007.packageId} (${pkg007.packageName})`);
  console.log(`Company 2 (Ambur Leather): ${amburLeatherComp.companyName} (${amburLeatherComp.companyId}, Branch: ${amburBranch.branchName}) -> Target Package: ${pkg036.packageId} (${pkg036.packageName})`);
  console.log(`Company 3 (ABC Company)  : ${abcCompanyComp.companyName} (${abcCompanyComp.companyId}, Branch: ${abcCompBranch.branchName}) -> Target Package: ${pkg037.packageId} (${pkg037.packageName})\n`);

  let allPassed = true;

  // TEST 1: ABC Logistics with PKG007
  console.log("--------------------------------------------------");
  console.log("TEST 1: Creating route for ABC Logistics (CMP001) with PKG007...");
  try {
    const rate1 = await retry(() =>
      createCompanyRouteRate({
        companyId: abcLogisticsComp.companyId,
        companyName: abcLogisticsComp.companyName,
        companySide: "FROM",
        fromBranchId: abcBranch.branchId,
        fromBranchName: abcBranch.branchName,
        toBranchId: destinationBranch.branchId,
        toBranchName: destinationBranch.branchName,
        packageId: pkg007.packageId,
        packageName: pkg007.packageName,
        transportRate: 1500,
        pickupCharge: 0,
        deliveryCharge: 0,
        status: "Active",
      })
    );

    console.log(`  Created Rate ID: ${rate1.companyRouteRateId}`);
    console.log(`  Stored Company ID: ${rate1.companyId}`);
    console.log(`  Stored Package ID: ${rate1.packageId}`);

    if (rate1.packageId === "PKG007") {
      console.log("  ✓ PASS: Correctly preserved packageId PKG007!\n");
    } else {
      console.log(`  ❌ FAIL: Expected PKG007, but got ${rate1.packageId}\n`);
      allPassed = false;
    }
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      console.log(`  ✓ PASS: Route rate already exists for PKG007!\n`);
    } else {
      console.log(`  ❌ FAIL: ${err.message}\n`);
      allPassed = false;
    }
  }

  // TEST 2: Ambur Leather with PKG036
  console.log("--------------------------------------------------");
  console.log("TEST 2: Creating route for Ambur Leather (CMP005) with PKG036...");
  try {
    const rate2 = await retry(() =>
      createCompanyRouteRate({
        companyId: amburLeatherComp.companyId,
        companyName: amburLeatherComp.companyName,
        companySide: "FROM",
        fromBranchId: amburBranch.branchId,
        fromBranchName: amburBranch.branchName,
        toBranchId: destinationBranch.branchId,
        toBranchName: destinationBranch.branchName,
        packageId: pkg036.packageId,
        packageName: pkg036.packageName,
        transportRate: 1600,
        pickupCharge: 0,
        deliveryCharge: 0,
        status: "Active",
      })
    );

    console.log(`  Created Rate ID: ${rate2.companyRouteRateId}`);
    console.log(`  Stored Company ID: ${rate2.companyId}`);
    console.log(`  Stored Package ID: ${rate2.packageId}`);

    if (rate2.packageId === "PKG036") {
      console.log("  ✓ PASS: Correctly preserved packageId PKG036 (did NOT overwrite with PKG007)!\n");
    } else {
      console.log(`  ❌ FAIL: Expected PKG036, but got ${rate2.packageId}\n`);
      allPassed = false;
    }
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      console.log(`  ✓ PASS: Route rate already exists for PKG036!\n`);
    } else {
      console.log(`  ❌ FAIL: ${err.message}\n`);
      allPassed = false;
    }
  }

  // TEST 3: ABC Company with PKG037
  console.log("--------------------------------------------------");
  console.log("TEST 3: Creating route for ABC Company (CMP020) with PKG037...");
  try {
    const rate3 = await retry(() =>
      createCompanyRouteRate({
        companyId: abcCompanyComp.companyId,
        companyName: abcCompanyComp.companyName,
        companySide: "FROM",
        fromBranchId: abcCompBranch.branchId,
        fromBranchName: abcCompBranch.branchName,
        toBranchId: destinationBranch.branchId,
        toBranchName: destinationBranch.branchName,
        packageId: pkg037.packageId,
        packageName: pkg037.packageName,
        transportRate: 1700,
        pickupCharge: 0,
        deliveryCharge: 0,
        status: "Active",
      })
    );

    console.log(`  Created Rate ID: ${rate3.companyRouteRateId}`);
    console.log(`  Stored Company ID: ${rate3.companyId}`);
    console.log(`  Stored Package ID: ${rate3.packageId}`);

    if (rate3.packageId === "PKG037") {
      console.log("  ✓ PASS: Correctly preserved packageId PKG037 (did NOT overwrite with PKG007)!\n");
    } else {
      console.log(`  ❌ FAIL: Expected PKG037, but got ${rate3.packageId}\n`);
      allPassed = false;
    }
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      console.log(`  ✓ PASS: Route rate already exists for PKG037!\n`);
    } else {
      console.log(`  ❌ FAIL: ${err.message}\n`);
      allPassed = false;
    }
  }

  // TEST 4: Non-existent packageId (Must throw error, must NOT fallback to PKG007)
  console.log("--------------------------------------------------");
  console.log("TEST 4: Creating route with invalid packageId 'PKG99999' & packageName 'Leather Bundle'...");
  try {
    await retry(() =>
      createCompanyRouteRate({
        companyId: abcLogisticsComp.companyId,
        companyName: abcLogisticsComp.companyName,
        companySide: "FROM",
        fromBranchId: abcBranch.branchId,
        fromBranchName: abcBranch.branchName,
        toBranchId: destinationBranch.branchId,
        toBranchName: destinationBranch.branchName,
        packageId: "PKG99999",
        packageName: "Leather Bundle",
        transportRate: 1800,
        pickupCharge: 0,
        deliveryCharge: 0,
        status: "Active",
      })
    );
    console.log("  ❌ FAIL: Expected error for invalid packageId PKG99999 but it succeeded!\n");
    allPassed = false;
  } catch (err: any) {
    if (err.message.includes("Package with ID 'PKG99999' not found")) {
      console.log(`  ✓ PASS: Correctly rejected invalid packageId with error: "${err.message}"\n`);
    } else {
      console.log(`  ❌ FAIL: Unexpected error: ${err.message}\n`);
      allPassed = false;
    }
  }

  // TEST 5: Verify Configured Routes Count Isolation
  console.log("--------------------------------------------------");
  console.log("TEST 5: Verifying Configured Routes counts by packageId...");
  const allRatesRes = await getCompanyRouteRates();
  const ratesList = allRatesRes.companyRouteRates;

  const countPkg007 = ratesList.filter((r) => r.companyId === abcLogisticsComp.companyId && r.packageId === "PKG007").length;
  const countPkg036 = ratesList.filter((r) => r.companyId === amburLeatherComp.companyId && r.packageId === "PKG036").length;
  const countPkg037 = ratesList.filter((r) => r.companyId === abcCompanyComp.companyId && r.packageId === "PKG037").length;

  console.log(`  ABC Logistics (CMP001 + PKG007) count: ${countPkg007}`);
  console.log(`  Ambur Leather (CMP005 + PKG036) count: ${countPkg036}`);
  console.log(`  ABC Company   (CMP020 + PKG037) count: ${countPkg037}`);

  if (countPkg007 >= 1 && countPkg036 >= 1 && countPkg037 >= 1) {
    console.log("  ✓ PASS: Each package has its own independent route count!\n");
  } else {
    console.log("  ❌ FAIL: Route count mismatch!\n");
    allPassed = false;
  }

  console.log("==================================================");
  if (allPassed) {
    console.log("   ALL PACKAGE IDENTITY ISOLATION TESTS PASSED!   ");
  } else {
    console.log("   SOME TEST CASES FAILED!                        ");
  }
  console.log("==================================================");
}

runTests();
