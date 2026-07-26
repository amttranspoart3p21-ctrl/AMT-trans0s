import { createBranch, getBranches } from "@/services/branch.service";
import { createPackage, getPackages } from "@/services/package.service";
import {
  createGlobalRouteRate,
  getGlobalRouteRates,
  getGlobalRouteRateById,
  updateGlobalRouteRate,
  deleteGlobalRouteRate,
} from "@/services/global-route-rate.service";

async function test() {
  try {
    let branches = await getBranches();
    if (branches.length < 2) {
      const b1 = await createBranch({
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
      const b2 = await createBranch({
        branchName: "Bangalore",
        branchCode: "BLR",
        address: "Majestic",
        phoneNumber1: "9000000002",
        phoneNumber2: "",
        phoneNumber3: "",
        phoneNumber4: "",
        phoneNumber5: "",
        status: "Active",
      });
      branches = [b1, b2];
    }

    let packagesRes = await getPackages();
    let packages = Array.isArray(packagesRes) ? packagesRes : (packagesRes as any).packages || [];
    let pkg = packages[0];
    if (!pkg) {
      pkg = await createPackage({
        packageName: "Standard Box",
        description: "Standard packaging box",
        status: "Active",
      });
    }

    const fromBranchId = branches[0].branchId;
    const toBranchId = branches[1].branchId;

    // Remove existing if any to test clean creation
    const existing = await getGlobalRouteRates();
    const prev = existing.routeRates.find(
      (r) => r.fromBranchId === fromBranchId && r.toBranchId === toBranchId && r.packageId === pkg.packageId
    );
    if (prev) {
      await deleteGlobalRouteRate(prev.routeRateId);
    }

    console.log("========== CREATE GLOBAL ROUTE RATE (TRANSPORT RATE) ==========");
    const rate = await createGlobalRouteRate({
      fromBranchId,
      fromBranchName: branches[0].branchName,
      toBranchId,
      toBranchName: branches[1].branchName,
      packageId: pkg.packageId,
      packageName: pkg.packageName,
      rate: 100,
      status: "Active",
    });
    console.log(rate);

    console.log("\n========== GET ALL ROUTE RATES ==========");
    console.log(await getGlobalRouteRates());

    console.log("\n========== GET BY ID ==========");
    console.log(await getGlobalRouteRateById(rate.routeRateId));

    console.log("\n========== UPDATE ROUTE RATE ==========");
    const updated = await updateGlobalRouteRate(rate.routeRateId, {
      fromBranchId,
      fromBranchName: branches[0].branchName,
      toBranchId,
      toBranchName: branches[1].branchName,
      packageId: pkg.packageId,
      packageName: pkg.packageName,
      rate: 120,
      status: "Active",
    });
    console.log(updated);

    console.log("\n========== DELETE ROUTE RATE ==========");
    await deleteGlobalRouteRate(rate.routeRateId);
    console.log("Route rate deleted successfully.");

    console.log("\n========== FINAL LIST ==========");
    console.log(await getGlobalRouteRates());
  } catch (error) {
    console.error(error);
  }
}

test();
