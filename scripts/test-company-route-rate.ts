import { createBranch, getBranches } from "@/services/branch.service";
import { createCompany, getCompanies } from "@/services/company.service";
import { createPackage, getPackages } from "@/services/package.service";
import {
  createCompanyRouteRate,
  getCompanyRouteRates,
  getCompanyRouteRateById,
  updateCompanyRouteRate,
  deleteCompanyRouteRate,
} from "@/services/company-route-rate.service";

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

    let companiesRes = await getCompanies();
    let companies = Array.isArray(companiesRes) ? companiesRes : (companiesRes as any).companies || [];
    let company = companies[0];
    if (!company) {
      company = await createCompany({
        branchId: branches[0].branchId,
        branchName: branches[0].branchName,
        companyName: "ABC Logistics",
        address: "123 Main St",
        phoneNumber1: "9876543210",
        status: "Active",
      });
    }

    let packagesRes = await getPackages();
    let packages = Array.isArray(packagesRes) ? packagesRes : (packagesRes as any).packages || [];
    let pkg = packages.find((p: any) => !p.companyId);
    if (!pkg) {
      pkg = await createPackage({
        packageName: "Global Box 4*4",
        description: "Small Box",
        status: "Active",
      });
    }

    const companyId = company.companyId;
    const fromBranchId = branches[0].branchId;
    const toBranchId = branches[1].branchId;

    const existing = await getCompanyRouteRates();
    const prev = existing.companyRouteRates.find(
      (c) => c.companyId === companyId && c.fromBranchId === fromBranchId && c.toBranchId === toBranchId && c.packageId === pkg.packageId
    );
    if (prev) {
      await deleteCompanyRouteRate(prev.companyRouteRateId);
    }

    console.log("========== CREATE COMPANY ROUTE RATE (ROUTE-BASED OVERRIDE) ==========");
    const rate = await createCompanyRouteRate({
      companyId,
      companyName: company.companyName,
      companySide: "FROM",
      fromBranchId,
      fromBranchName: branches[0].branchName,
      toBranchId,
      toBranchName: branches[1].branchName,
      packageId: pkg.packageId,
      packageName: pkg.packageName,
      transportRate: 80,
      pickupCharge: 10,
      deliveryCharge: 15,
      status: "Active",
    });
    console.log(rate);

    console.log("\n========== GET ALL COMPANY ROUTE RATES ==========");
    console.log(await getCompanyRouteRates());

    console.log("\n========== GET BY ID ==========");
    console.log(await getCompanyRouteRateById(rate.companyRouteRateId));

    console.log("\n========== UPDATE COMPANY ROUTE RATE ==========");
    const updated = await updateCompanyRouteRate(rate.companyRouteRateId, {
      companyId,
      companyName: company.companyName,
      companySide: "FROM",
      fromBranchId,
      fromBranchName: branches[0].branchName,
      toBranchId,
      toBranchName: branches[1].branchName,
      packageId: pkg.packageId,
      packageName: pkg.packageName,
      transportRate: 85,
      pickupCharge: 12,
      deliveryCharge: 18,
      status: "Active",
    });
    console.log(updated);

    console.log("\n========== DELETE COMPANY ROUTE RATE ==========");
    await deleteCompanyRouteRate(rate.companyRouteRateId);
    console.log("Company route rate deleted successfully.");

    console.log("\n========== FINAL LIST ==========");
    console.log(await getCompanyRouteRates());
  } catch (error) {
    console.error(error);
  }
}

test();
