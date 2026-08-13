import type { Package } from "@/types/packageType";

import {
  readPackages,
  writePackages,
} from "@/lib/package";

import { validatePackage } from "@/validators/package.validator";

import { generatePackageId } from "@/utils/generatePackageId";

import { readCompanies } from "@/lib/company";
import { readCompanyRouteRates, writeCompanyRouteRates } from "@/lib/company-route-rate";
import { readGlobalRouteRates, writeGlobalRouteRates } from "@/lib/global-route-rate";

export interface PackageCascadeCounts {
  packages?: number;
  globalPackages?: number;
  companyRouteRates?: number;
  globalRouteRates?: number;
}


// export async function createPackage(
//   packageData: Omit<Package, "packageId" | "createdAt" | "updatedAt">
// ): Promise<Package> {
//   // Validate input
//   validatePackage(packageData);

//   // Read existing packages
//   const packages = await readPackages();

//   let companyName: string | undefined = packageData.companyName;
//   if (packageData.companyId) {
//     const companies = await readCompanies();
//     const company = companies.find((c) => c.companyId === packageData.companyId);
//     if (company) {
//       companyName = company.companyName;
//     }
//   }

//   // Check duplicate package name for the same scope (global or same company)
//   const packageExists = packages.some(
//     (pkg) =>
//       pkg.packageName.trim().toLowerCase() ===
//         packageData.packageName.trim().toLowerCase() &&
//       (pkg.companyId === packageData.companyId || (!pkg.companyId && !packageData.companyId))
//   );

//   if (packageExists) {
//     throw new Error("Package already exists.");
//   }

//   // Create new package
//   const newPackage: Package = {
//     ...packageData,
//     companyName,
//     packageId: generatePackageId(packages),

//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//   };

//   // Save
//   packages.push(newPackage);

//   await writePackages(packages);

//   return newPackage;
// }


export async function createPackage(
  packageData: Omit<Package, "packageId" | "createdAt" | "updatedAt">
): Promise<Package> {
  // Validate input
  validatePackage(packageData);

  // Read existing packages
  const packages = await readPackages();

  let companyName: string | undefined;

  // Validate Company if companyId is provided
  if (packageData.companyId) {
    const companies = await readCompanies();

    const company = companies.find(
      (c) => c.companyId === packageData.companyId
    );

    // ❌ Company does not exist
    if (!company) {
      throw new Error("Company not found.");
    }

    // ✅ Company exists
    companyName = company.companyName;
  }

  // Check duplicate package name for the same scope (global or same company)
  const packageExists = packages.some(
    (pkg) =>
      pkg.packageName.trim().toLowerCase() ===
        packageData.packageName.trim().toLowerCase() &&
      (pkg.companyId === packageData.companyId ||
        (!pkg.companyId && !packageData.companyId))
  );

  if (packageExists) {
    throw new Error("Package already exists.");
  }

  // Create new package
  const newPackage: Package = {
    ...packageData,
    companyName,
    packageId: generatePackageId(packages),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save
  packages.push(newPackage);

  await writePackages(packages);

  return newPackage;
}

export async function getPackages(
  page?: number,
  limit?: number,
  search?: string,
  status?: Package["status"],
  companyId?: string
): Promise<{
  packages: Package[];
  totalPackages: number;
  currentPage: number;
  totalPages: number;
}> {
  let packages = await readPackages();

  // Step 1: Filter by Company Scope if companyId is provided
  if (companyId) {
    if (companyId === "GLOBAL") {
      packages = packages.filter((pkg) => !pkg.companyId);
    } else {
      packages = packages.filter((pkg) => pkg.companyId === companyId);
    }
  }

  // Step 2: Search
  if (search) {
    const keyword = search.trim().toLowerCase();
    packages = packages.filter((pkg) =>
      pkg.packageName.toLowerCase().includes(keyword)
    );
  }

  // Step 3: Status Filter
  if (status) {
    packages = packages.filter((pkg) =>
      pkg.status === status
    );
  }

  // Step 4: Pagination
  const totalPackages = packages.length;

  let pagedPackages = packages;
  let currentPage = 1;
  let totalPages = 1;

  if (page && limit) {
    const start = (page - 1) * limit;
    const end = start + limit;
    pagedPackages = packages.slice(start, end);
    currentPage = page;
    totalPages = Math.ceil(totalPackages / limit);
  }

  // Step 5: Fetch related data for stats
  const globalRouteRates = await readGlobalRouteRates();
  const companyRouteRates = await readCompanyRouteRates();

  const packagesWithStats = pagedPackages.map((pkg) => {
    let routeRatesCount = 0;
    if (pkg.companyId) {
      routeRatesCount = companyRouteRates.filter(r => r.packageId === pkg.packageId).length;
    } else {
      routeRatesCount = globalRouteRates.filter(r => r.packageId === pkg.packageId).length;
    }

    return {
      ...pkg,
      stats: {
        routeRates: routeRatesCount,
      }
    };
  });

  return {
    packages: packagesWithStats,
    totalPackages,
    currentPage,
    totalPages,
  };
}

export async function getPackageById(
  packageId: string
): Promise<Package> {
  const packages = await readPackages();

  const pkg = packages.find(
    (p) => p.packageId === packageId
  );

  if (!pkg) {
    throw new Error("Package not found.");
  }

  return pkg;
}

// export async function updatePackage(
//   packageId: string,
//   packageData: Omit<Package, "packageId" | "createdAt" | "updatedAt">
// ): Promise<Package> {
//   // Validate input
//   validatePackage(packageData);

//   // Read all packages
//   const packages = await readPackages();

//   // Find package index
//   const packageIndex = packages.findIndex(
//     (pkg) => pkg.packageId === packageId
//   );

//   if (packageIndex === -1) {
//     throw new Error("Package not found.");
//   }

//   let companyName: string | undefined = packageData.companyName;
//   if (packageData.companyId) {
//     const companies = await readCompanies();
//     const company = companies.find((c) => c.companyId === packageData.companyId);
//     if (company) {
//       companyName = company.companyName;
//     }
//   }

//   // Check duplicate package name within the same companyId scope (global or same company)
//   const duplicatePackage = packages.find(
//     (pkg) =>
//       pkg.packageId !== packageId &&
//       pkg.packageName.trim().toLowerCase() ===
//         packageData.packageName.trim().toLowerCase() &&
//       (pkg.companyId === packageData.companyId || (!pkg.companyId && !packageData.companyId))
//   );

//   if (duplicatePackage) {
//     throw new Error("Package already exists.");
//   }

//   // Update package
//   packages[packageIndex] = {
//     ...packages[packageIndex],
//     ...packageData,
//     companyName,
//     updatedAt: new Date().toISOString(),
//   };

//   // Save
//   await writePackages(packages);

//   return packages[packageIndex];
// }

export async function updatePackage(
  packageId: string,
  packageData: Omit<Package, "packageId" | "createdAt" | "updatedAt">
): Promise<Package> {
  // Validate input
  validatePackage(packageData);

  // Read all packages
  const packages = await readPackages();

  // Find package index
  const packageIndex = packages.findIndex(
    (pkg) => pkg.packageId === packageId
  );

  if (packageIndex === -1) {
    throw new Error("Package not found.");
  }

  let companyName: string | undefined;

  // Validate Company if companyId is provided
  if (packageData.companyId) {
    const companies = await readCompanies();

    const company = companies.find(
      (c) => c.companyId === packageData.companyId
    );

    if (!company) {
      throw new Error("Company not found.");
    }

    companyName = company.companyName;
  }

  // Check duplicate package name within the same companyId scope
  const duplicatePackage = packages.find(
    (pkg) =>
      pkg.packageId !== packageId &&
      pkg.packageName.trim().toLowerCase() ===
        packageData.packageName.trim().toLowerCase() &&
      (pkg.companyId === packageData.companyId ||
        (!pkg.companyId && !packageData.companyId))
  );

  if (duplicatePackage) {
    throw new Error("Package already exists.");
  }

  // Update package
  packages[packageIndex] = {
    ...packages[packageIndex],
    ...packageData,
    companyName,
    updatedAt: new Date().toISOString(),
  };

  // Save
  await writePackages(packages);

  return packages[packageIndex];
}

export async function deletePackage(
  packageId: string
): Promise<{ deletedPackage: Package; isGlobal: boolean; deletedCounts: PackageCascadeCounts }> {
  const packages = await readPackages();

  const pkg = packages.find(
    (p) => p.packageId === packageId
  );

  if (!pkg) {
    throw new Error("Package not found.");
  }

  const isGlobal = !pkg.companyId;
  const remainingPackages = packages.filter(
    (p) => p.packageId !== packageId
  );

  if (isGlobal) {
    // Delete Global Route Rates configured for this package
    const globalRouteRates = await readGlobalRouteRates();
    const globalRouteRatesToDelete = globalRouteRates.filter(
      (r) => r.packageId === packageId
    );
    const remainingGlobalRouteRates = globalRouteRates.filter(
      (r) => r.packageId !== packageId
    );

    await writeGlobalRouteRates(remainingGlobalRouteRates);
    await writePackages(remainingPackages);

    return {
      deletedPackage: pkg,
      isGlobal: true,
      deletedCounts: {
        globalPackages: 1,
        globalRouteRates: globalRouteRatesToDelete.length,
      },
    };
  } else {
    // Delete Company Route Rates configured for this package
    const companyRouteRates = await readCompanyRouteRates();
    const companyRouteRatesToDelete = companyRouteRates.filter(
      (r) => r.packageId === packageId
    );
    const remainingCompanyRouteRates = companyRouteRates.filter(
      (r) => r.packageId !== packageId
    );

    await writeCompanyRouteRates(remainingCompanyRouteRates);
    await writePackages(remainingPackages);

    return {
      deletedPackage: pkg,
      isGlobal: false,
      deletedCounts: {
        packages: 1,
        companyRouteRates: companyRouteRatesToDelete.length,
      },
    };
  }
}

export async function inactivePackage(
  packageId: string
): Promise<{ updatedPackage: Package; isGlobal: boolean; updatedCounts: PackageCascadeCounts }> {
  const packages = await readPackages();

  const packageIndex = packages.findIndex(
    (p) => p.packageId === packageId
  );

  if (packageIndex === -1) {
    throw new Error("Package not found.");
  }

  const now = new Date().toISOString();
  const packageTag = `package:${packageId}`;

  packages[packageIndex] = {
    ...packages[packageIndex],
    status: "Inactive",
    inactiveReason: "manual",
    updatedAt: now,
  };
  const updatedPackage = packages[packageIndex];
  const isGlobal = !updatedPackage.companyId;

  if (isGlobal) {
    // Set Global Route Rates configured for this package -> Inactive ONLY IF Active
    const globalRouteRates = await readGlobalRouteRates();
    let updatedGlobalRatesCount = 0;

    globalRouteRates.forEach((r) => {
      if (r.packageId === packageId) {
        if (r.status === "Active") {
          r.status = "Inactive";
          r.inactiveReason = packageTag;
          r.updatedAt = now;
          updatedGlobalRatesCount++;
        }
      }
    });

    await writeGlobalRouteRates(globalRouteRates);
    await writePackages(packages);

    return {
      updatedPackage,
      isGlobal: true,
      updatedCounts: {
        globalPackages: 1,
        globalRouteRates: updatedGlobalRatesCount,
      },
    };
  } else {
    // Set Company Route Rates configured for this package -> Inactive ONLY IF Active
    const companyRouteRates = await readCompanyRouteRates();
    let updatedCompanyRatesCount = 0;

    companyRouteRates.forEach((r) => {
      if (r.packageId === packageId) {
        if (r.status === "Active") {
          r.status = "Inactive";
          r.inactiveReason = packageTag;
          r.updatedAt = now;
          updatedCompanyRatesCount++;
        }
      }
    });

    await writeCompanyRouteRates(companyRouteRates);
    await writePackages(packages);

    return {
      updatedPackage,
      isGlobal: false,
      updatedCounts: {
        packages: 1,
        companyRouteRates: updatedCompanyRatesCount,
      },
    };
  }
}

export async function activatePackage(
  packageId: string
): Promise<{ updatedPackage: Package; isGlobal: boolean; updatedCounts: PackageCascadeCounts }> {
  const packages = await readPackages();

  const packageIndex = packages.findIndex(
    (p) => p.packageId === packageId
  );

  if (packageIndex === -1) {
    throw new Error("Package not found.");
  }

  const now = new Date().toISOString();
  const packageTag = `package:${packageId}`;

  const updatedPkg = { ...packages[packageIndex] };
  updatedPkg.status = "Active";
  delete updatedPkg.inactiveReason;
  updatedPkg.updatedAt = now;
  packages[packageIndex] = updatedPkg;

  const updatedPackage = packages[packageIndex];
  const isGlobal = !updatedPackage.companyId;

  if (isGlobal) {
    // Set Global Route Rates configured for this package -> Active ONLY IF inactivated by this package cascade
    const globalRouteRates = await readGlobalRouteRates();
    let updatedGlobalRatesCount = 0;

    globalRouteRates.forEach((r) => {
      if (r.packageId === packageId) {
        if (r.inactiveReason === packageTag) {
          r.status = "Active";
          delete r.inactiveReason;
          r.updatedAt = now;
          updatedGlobalRatesCount++;
        }
      }
    });

    await writeGlobalRouteRates(globalRouteRates);
    await writePackages(packages);

    return {
      updatedPackage,
      isGlobal: true,
      updatedCounts: {
        globalPackages: 1,
        globalRouteRates: updatedGlobalRatesCount,
      },
    };
  } else {
    // Set Company Route Rates configured for this package -> Active ONLY IF inactivated by this package cascade
    const companyRouteRates = await readCompanyRouteRates();
    let updatedCompanyRatesCount = 0;

    companyRouteRates.forEach((r) => {
      if (r.packageId === packageId) {
        if (r.inactiveReason === packageTag) {
          r.status = "Active";
          delete r.inactiveReason;
          r.updatedAt = now;
          updatedCompanyRatesCount++;
        }
      }
    });

    await writeCompanyRouteRates(companyRouteRates);
    await writePackages(packages);

    return {
      updatedPackage,
      isGlobal: false,
      updatedCounts: {
        packages: 1,
        companyRouteRates: updatedCompanyRatesCount,
      },
    };
  }
}




export async function packageNameExists(
  packageName: string,
  excludePackageId?: string,
  companyId?: string
): Promise<boolean> {
  const packages = await readPackages();

  return packages.some(
    (pkg) =>
      pkg.packageName.trim().toLowerCase() ===
        packageName.trim().toLowerCase() &&
      pkg.packageId !== excludePackageId &&
      (pkg.companyId === companyId || (!pkg.companyId && !companyId))
  );
}