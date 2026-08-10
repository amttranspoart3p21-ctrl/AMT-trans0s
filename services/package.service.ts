import type { Package } from "@/types/packageType";

import {
  readPackages,
  writePackages,
} from "@/lib/package";

import { validatePackage } from "@/validators/package.validator";

import { generatePackageId } from "@/utils/generatePackageId";

import { readCompanies } from "@/lib/company";

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
    packages = packages.filter(
      (pkg) => pkg.companyId === companyId
    );
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

  if (!page || !limit) {
    return {
      packages,
      totalPackages,
      currentPage: 1,
      totalPages: 1,
    };
  }

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    packages: packages.slice(start, end),
    totalPackages,
    currentPage: page,
    totalPages: Math.ceil(totalPackages / limit),
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
): Promise<void> {
  const packages = await readPackages();

  const packageExists = packages.some(
    (pkg) => pkg.packageId === packageId
  );

  if (!packageExists) {
    throw new Error("Package not found.");
  }

  const updatedPackages = packages.filter(
    (pkg) => pkg.packageId !== packageId
  );

  await writePackages(updatedPackages);
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