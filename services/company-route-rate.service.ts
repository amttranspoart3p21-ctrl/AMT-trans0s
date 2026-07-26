import type { CompanyRouteRate } from "@/types/company-route-rate";
import {
  readCompanyRouteRates,
  writeCompanyRouteRates,
} from "@/lib/company-route-rate";
import { readCompanies } from "@/lib/company";
import { readBranches } from "@/lib/branch";
import { readPackages } from "@/lib/package";
import { createPackage } from "@/services/package.service";
import { validateCompanyRouteRate } from "@/validators/company-route-rate.validator";
import { generateCompanyRouteRateId } from "@/utils/generateCompanyRouteRateId";

// export async function createCompanyRouteRate(
//   rateData: Omit<CompanyRouteRate, "companyRouteRateId" | "createdAt" | "updatedAt">
// ): Promise<CompanyRouteRate> {
//   const companies = await readCompanies();
//   const company = companies.find(
//     (c) =>
//       c.companyId === rateData.companyId ||
//       c.companyName.trim().toLowerCase() === rateData.companyId?.trim().toLowerCase() ||
//       (rateData.companyName && c.companyName.trim().toLowerCase() === rateData.companyName.trim().toLowerCase())
//   );
//   if (!company) {
//     throw new Error("Company does not exist.");
//   }

//   const branches = await readBranches();
//   const fromBranch = branches.find(
//     (b) =>
//       b.branchId === rateData.fromBranchId ||
//       b.branchName.trim().toLowerCase() === rateData.fromBranchId?.trim().toLowerCase() ||
//       (rateData.fromBranchName && b.branchName.trim().toLowerCase() === rateData.fromBranchName.trim().toLowerCase())
//   );
//   if (!fromBranch) {
//     throw new Error("From Branch does not exist.");
//   }

//   const toBranch = branches.find(
//     (b) =>
//       b.branchId === rateData.toBranchId ||
//       b.branchName.trim().toLowerCase() === rateData.toBranchId?.trim().toLowerCase() ||
//       (rateData.toBranchName && b.branchName.trim().toLowerCase() === rateData.toBranchName.trim().toLowerCase())
//   );
//   if (!toBranch) {
//     throw new Error("To Branch does not exist.");
//   }

//   if (fromBranch.branchId === toBranch.branchId) {
//     throw new Error("From Branch and To Branch cannot be the same.");
//   }

//   // Package Lookup / Creation (Company-specific package support)
//   const packages = await readPackages();
//   let pkg = packages.find(
//     (p) =>
//       p.packageId === rateData.packageId ||
//       p.packageName.trim().toLowerCase() === rateData.packageId?.trim().toLowerCase() ||
//       (rateData.packageName && p.packageName.trim().toLowerCase() === rateData.packageName.trim().toLowerCase())
//   );

//   let packageId: string;
//   let packageName: string;

//   if (pkg) {
//     // If package exists, verify it belongs to this company or is global
//     if (pkg.companyId && pkg.companyId !== company.companyId) {
//       throw new Error(`Package '${pkg.packageName}' belongs to another company and cannot be used.`);
//     }
//     packageId = pkg.packageId;
//     packageName = pkg.packageName;
//   } else {
//     // Auto-create company-specific package if it doesn't exist in global packages
//     const pkgName = rateData.packageName || rateData.packageId;
//     const createdPkg = await createPackage({
//       packageName: pkgName,
//       companyId: company.companyId,
//       companyName: company.companyName,
//       status: "Active",
//       description: `Company-specific package for ${company.companyName}`,
//     });
//     packageId = createdPkg.packageId;
//     packageName = createdPkg.packageName;
//   }

//   const fullRateData = {
//     ...rateData,
//     companyId: company.companyId,
//     companyName: company.companyName,
//     fromBranchId: fromBranch.branchId,
//     fromBranchName: fromBranch.branchName,
//     toBranchId: toBranch.branchId,
//     toBranchName: toBranch.branchName,
//     packageId,
//     packageName,
//   };

//   validateCompanyRouteRate(fullRateData);

//   const rates = await readCompanyRouteRates();

//   const routeRateExists = rates.some(
//     (item) =>
//       item.companyId === fullRateData.companyId &&
//       item.fromBranchId === fullRateData.fromBranchId &&
//       item.toBranchId === fullRateData.toBranchId &&
//       item.packageId === fullRateData.packageId
//   );

//   if (routeRateExists) {
//     throw new Error("Company route rate already exists.");
//   }

//   const newRate: CompanyRouteRate = {
//     ...fullRateData,
//     companyRouteRateId: generateCompanyRouteRateId(rates),
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//   };

//   rates.push(newRate);
//   await writeCompanyRouteRates(rates);

//   return newRate;
// }

export async function createCompanyRouteRate(
  rateData: Omit<
    CompanyRouteRate,
    "companyRouteRateId" | "createdAt" | "updatedAt"
  >
): Promise<CompanyRouteRate> {
  // Validate Company
  const companies = await readCompanies();

  const company = companies.find(
    (c) =>
      c.companyId === rateData.companyId ||
      c.companyName.trim().toLowerCase() ===
        rateData.companyId?.trim().toLowerCase() ||
      (rateData.companyName &&
        c.companyName.trim().toLowerCase() ===
          rateData.companyName.trim().toLowerCase())
  );

  if (!company) {
    throw new Error("Company does not exist.");
  }

  // Validate From Branch
  const branches = await readBranches();

  const fromBranch = branches.find(
    (b) =>
      b.branchId === rateData.fromBranchId ||
      b.branchName.trim().toLowerCase() ===
        rateData.fromBranchId?.trim().toLowerCase() ||
      (rateData.fromBranchName &&
        b.branchName.trim().toLowerCase() ===
          rateData.fromBranchName.trim().toLowerCase())
  );

  if (!fromBranch) {
    throw new Error("From Branch does not exist.");
  }

  // Validate To Branch
  const toBranch = branches.find(
    (b) =>
      b.branchId === rateData.toBranchId ||
      b.branchName.trim().toLowerCase() ===
        rateData.toBranchId?.trim().toLowerCase() ||
      (rateData.toBranchName &&
        b.branchName.trim().toLowerCase() ===
          rateData.toBranchName.trim().toLowerCase())
  );

  if (!toBranch) {
    throw new Error("To Branch does not exist.");
  }

  if (fromBranch.branchId === toBranch.branchId) {
    throw new Error("From Branch and To Branch cannot be the same.");
  }

  // Validate Package
  const packages = await readPackages();

  const pkg = packages.find(
    (p) =>
      p.packageId === rateData.packageId ||
      (rateData.packageName &&
        p.packageName.trim().toLowerCase() ===
          rateData.packageName.trim().toLowerCase())
  );

  if (!pkg) {
    throw new Error("Package not found.");
  }

  const packageId = pkg.packageId;
  const packageName = pkg.packageName;

  const fullRateData = {
    ...rateData,
    companyId: company.companyId,
    companyName: company.companyName,
    fromBranchId: fromBranch.branchId,
    fromBranchName: fromBranch.branchName,
    toBranchId: toBranch.branchId,
    toBranchName: toBranch.branchName,
    packageId,
    packageName,
  };

  validateCompanyRouteRate(fullRateData);

  const rates = await readCompanyRouteRates();

  const routeRateExists = rates.some(
    (item) =>
      item.companyId === fullRateData.companyId &&
      item.fromBranchId === fullRateData.fromBranchId &&
      item.toBranchId === fullRateData.toBranchId &&
      item.packageId === fullRateData.packageId
  );

  if (routeRateExists) {
    throw new Error("Company route rate already exists.");
  }

  const newRate: CompanyRouteRate = {
    ...fullRateData,
    companyRouteRateId: generateCompanyRouteRateId(rates),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  rates.push(newRate);

  await writeCompanyRouteRates(rates);

  return newRate;
}

export async function getCompanyRouteRates(
  page?: number,
  limit?: number,
  search?: string,
  companyId?: string,
  fromBranchId?: string,
  toBranchId?: string,
  packageId?: string,
  status?: CompanyRouteRate["status"]
): Promise<{
  companyRouteRates: CompanyRouteRate[];
  totalCompanyRouteRates: number;
  currentPage: number;
  totalPages: number;
}> {
  let rates = await readCompanyRouteRates();

  if (search) {
    const keyword = search.trim().toLowerCase();
    rates = rates.filter(
      (r) =>
        r.companyName.toLowerCase().includes(keyword) ||
        r.fromBranchName.toLowerCase().includes(keyword) ||
        r.toBranchName.toLowerCase().includes(keyword) ||
        r.packageName.toLowerCase().includes(keyword)
    );
  }

  if (companyId) {
    rates = rates.filter((r) => r.companyId === companyId);
  }

  if (fromBranchId) {
    rates = rates.filter((r) => r.fromBranchId === fromBranchId);
  }

  if (toBranchId) {
    rates = rates.filter((r) => r.toBranchId === toBranchId);
  }

  if (packageId) {
    rates = rates.filter((r) => r.packageId === packageId);
  }

  if (status) {
    rates = rates.filter((r) => r.status === status);
  }

  const totalCompanyRouteRates = rates.length;

  if (!page || !limit) {
    return {
      companyRouteRates: rates,
      totalCompanyRouteRates,
      currentPage: 1,
      totalPages: 1,
    };
  }

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    companyRouteRates: rates.slice(start, end),
    totalCompanyRouteRates,
    currentPage: page,
    totalPages: Math.ceil(totalCompanyRouteRates / limit),
  };
}

export async function getCompanyRouteRateById(
  companyRouteRateId: string
): Promise<CompanyRouteRate> {
  const rates = await readCompanyRouteRates();
  const rate = rates.find((r) => r.companyRouteRateId === companyRouteRateId);

  if (!rate) {
    throw new Error("Company route rate not found.");
  }

  return rate;
}

export async function updateCompanyRouteRate(
  companyRouteRateId: string,
  rateData: Omit<CompanyRouteRate, "companyRouteRateId" | "createdAt" | "updatedAt">
): Promise<CompanyRouteRate> {
  const companies = await readCompanies();
  const company = companies.find((c) => c.companyId === rateData.companyId);
  if (!company) {
    throw new Error("Company does not exist.");
  }

  const branches = await readBranches();
  const fromBranch = branches.find((b) => b.branchId === rateData.fromBranchId);
  if (!fromBranch) {
    throw new Error("From Branch does not exist.");
  }

  const toBranch = branches.find((b) => b.branchId === rateData.toBranchId);
  if (!toBranch) {
    throw new Error("To Branch does not exist.");
  }

  if (fromBranch.branchId === toBranch.branchId) {
    throw new Error("From Branch and To Branch cannot be the same.");
  }

  const packages = await readPackages();
  const pkg = packages.find((p) => p.packageId === rateData.packageId);
  if (!pkg) {
    throw new Error("Package does not exist.");
  }

  const fullRateData = {
    ...rateData,
    companyName: company.companyName,
    fromBranchName: fromBranch.branchName,
    toBranchName: toBranch.branchName,
    packageName: pkg.packageName,
  };

  validateCompanyRouteRate(fullRateData);

  const rates = await readCompanyRouteRates();

  const rateIndex = rates.findIndex((r) => r.companyRouteRateId === companyRouteRateId);
  if (rateIndex === -1) {
    throw new Error("Company route rate not found.");
  }

  const routeRateExists = rates.some(
    (item) =>
      item.companyRouteRateId !== companyRouteRateId &&
      item.companyId === fullRateData.companyId &&
      item.fromBranchId === fullRateData.fromBranchId &&
      item.toBranchId === fullRateData.toBranchId &&
      item.packageId === fullRateData.packageId
  );

  if (routeRateExists) {
    throw new Error("Company route rate already exists.");
  }

  rates[rateIndex] = {
    ...rates[rateIndex],
    ...fullRateData,
    updatedAt: new Date().toISOString(),
  };

  await writeCompanyRouteRates(rates);

  return rates[rateIndex];
}

export async function deleteCompanyRouteRate(
  companyRouteRateId: string
): Promise<void> {
  const rates = await readCompanyRouteRates();
  const rateExists = rates.some((r) => r.companyRouteRateId === companyRouteRateId);

  if (!rateExists) {
    throw new Error("Company route rate not found.");
  }

  const updatedRates = rates.filter((r) => r.companyRouteRateId !== companyRouteRateId);

  await writeCompanyRouteRates(updatedRates);
}
