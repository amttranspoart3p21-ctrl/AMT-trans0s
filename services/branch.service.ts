import { generateBranchId } from "@/utils/generateBranchId";
import { validateBranch } from "@/validators/branch.validator";
import { readBranches, writeBranches } from "@/lib/branch";
import { readCompanies, writeCompanies } from "@/lib/company";
import { readPackages, writePackages } from "@/lib/package";
import { readCompanyRouteRates, writeCompanyRouteRates } from "@/lib/company-route-rate";
import { readGlobalRouteRates, writeGlobalRouteRates } from "@/lib/global-route-rate";

import type { Branch } from "@/types/branch";

export interface BranchCascadeCounts {
  branch?: number;
  companies?: number;
  companyPackages?: number;
  companyRouteRates?: number;
  globalRouteRates?: number;
}



export async function createBranch(
  branchData: Omit<Branch, "branchId" | "createdAt" | "updatedAt">
): Promise<Branch> {
  // Validate input fields
  const errors = validateBranch(branchData);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  // Check duplicate branch name
  if (await branchNameExists(branchData.branchName)) {
    throw new Error("Branch Name already exists.");
  }

  // Check duplicate branch code
  if (await branchCodeExists(branchData.branchCode)) {
    throw new Error("Branch Code already exists.");
  }

  // Read existing branches
  const branches = await readBranches();

  // Create timestamps
  const now = new Date().toISOString();

  // Create new branch
  const newBranch: Branch = {
    branchId: generateBranchId(branches),
    ...branchData,
    createdAt: now,
    updatedAt: now,
  };

  // Add new branch
  branches.push(newBranch);

  // Save to Excel
  await writeBranches(branches);

  return newBranch;
}

export async function branchNameExists(
  branchName: string
): Promise<boolean> {
  const branches = await readBranches();

  return branches.some(
    (branch) =>
      branch.branchName.toLowerCase() ===
      branchName.toLowerCase()
  );
}

export async function branchCodeExists(
  branchCode: string
): Promise<boolean> {
  const branches = await readBranches();

  return branches.some(
    (branch) =>
      branch.branchCode.toLowerCase() ===
      branchCode.toLowerCase()
  );
}

export async function getBranches(): Promise<Branch[]> {
  return readBranches();
}

export async function getBranchById(
  branchId: string
): Promise<Branch | undefined> {
  const branches = await readBranches();

  return branches.find(
    (branch) => branch.branchId === branchId
  );
}

export async function updateBranch(
  branchId: string,
  branchData: Omit<Branch, "branchId" | "createdAt" | "updatedAt">
): Promise<Branch> {
  // Validate input fields
  const errors = validateBranch(branchData);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  // Read existing branches
  const branches = await readBranches();

  // Find branch index
  const branchIndex = branches.findIndex(
    (branch) => branch.branchId === branchId
  );

  if (branchIndex === -1) {
    throw new Error("Branch not found.");
  }

  // Check duplicate branch name
  const duplicateName = branches.some(
    (branch) =>
      branch.branchId !== branchId &&
      branch.branchName.toLowerCase() ===
        branchData.branchName.toLowerCase()
  );

  if (duplicateName) {
    throw new Error("Branch Name already exists.");
  }

  // Check duplicate branch code
  const duplicateCode = branches.some(
    (branch) =>
      branch.branchId !== branchId &&
      branch.branchCode.toLowerCase() ===
        branchData.branchCode.toLowerCase()
  );

  if (duplicateCode) {
    throw new Error("Branch Code already exists.");
  }

  // Update branch
  const updatedBranch: Branch = {
    ...branches[branchIndex],
    ...branchData,
    updatedAt: new Date().toISOString(),
  };

  branches[branchIndex] = updatedBranch;

  // Save changes
  await writeBranches(branches);

  return updatedBranch;
}

export async function deleteBranch(
  branchId: string
): Promise<{ deletedBranch: Branch; deletedCounts: BranchCascadeCounts }> {
  // Read existing branches
  const branches = await readBranches();

  // Find branch index
  const branchIndex = branches.findIndex(
    (branch) => branch.branchId === branchId
  );

  if (branchIndex === -1) {
    throw new Error("Branch not found.");
  }

  // Remove branch
  const [deletedBranch] = branches.splice(branchIndex, 1);

  // 1. Find Companies registered under Branch
  const companies = await readCompanies();
  const companyIdsToDelete = new Set(
    companies.filter((c) => c.branchId === branchId).map((c) => c.companyId)
  );

  // 2. Find Company Packages belonging to those Companies
  const packages = await readPackages();
  const companyPackagesToDelete = packages.filter(
    (p) => p.companyId && companyIdsToDelete.has(p.companyId)
  );
  const remainingPackages = packages.filter(
    (p) => !p.companyId || !companyIdsToDelete.has(p.companyId)
  );

  // 3. Find Company Route Rates belonging to those Companies
  const companyRouteRates = await readCompanyRouteRates();
  const companyRouteRatesToDelete = companyRouteRates.filter(
    (r) => companyIdsToDelete.has(r.companyId)
  );
  const remainingCompanyRouteRates = companyRouteRates.filter(
    (r) => !companyIdsToDelete.has(r.companyId)
  );

  // 4. Remaining Companies
  const remainingCompanies = companies.filter((c) => c.branchId !== branchId);

  // 5. Global Route Rates where this Branch is FROM or TO
  const globalRouteRates = await readGlobalRouteRates();
  const globalRouteRatesToDelete = globalRouteRates.filter(
    (r) => r.fromBranchId === branchId || r.toBranchId === branchId
  );
  const remainingGlobalRouteRates = globalRouteRates.filter(
    (r) => r.fromBranchId !== branchId && r.toBranchId !== branchId
  );

  // Write updated data files
  await writeGlobalRouteRates(remainingGlobalRouteRates);
  await writeCompanyRouteRates(remainingCompanyRouteRates);
  await writePackages(remainingPackages);
  await writeCompanies(remainingCompanies);
  await writeBranches(branches);

  return {
    deletedBranch,
    deletedCounts: {
      branch: 1,
      companies: companyIdsToDelete.size,
      companyPackages: companyPackagesToDelete.length,
      companyRouteRates: companyRouteRatesToDelete.length,
      globalRouteRates: globalRouteRatesToDelete.length,
    },
  };
}

export async function inactiveBranch(
  branchId: string
): Promise<{ updatedBranch: Branch; updatedCounts: BranchCascadeCounts }> {
  const branches = await readBranches();
  const branchIndex = branches.findIndex(
    (branch) => branch.branchId === branchId
  );

  if (branchIndex === -1) {
    throw new Error("Branch not found.");
  }

  const now = new Date().toISOString();
  branches[branchIndex] = {
    ...branches[branchIndex],
    status: "Inactive",
    updatedAt: now,
  };
  const updatedBranch = branches[branchIndex];
  const branchTag = `branch:${branchId}`;

  // 1. Mark Companies registered under Branch -> Inactive
  const companies = await readCompanies();
  const companyIdsToInactivate = new Set<string>();
  let updatedCompaniesCount = 0;

  companies.forEach((c) => {
    if (c.branchId === branchId) {
      companyIdsToInactivate.add(c.companyId);
      if (c.status === "Active") {
        c.status = "Inactive";
        c.inactiveReason = branchTag;
        c.updatedAt = now;
        updatedCompaniesCount++;
      }
    }
  });

  // 2. Mark Company Packages belonging to those Companies -> Inactive
  const packages = await readPackages();
  let updatedCompanyPackagesCount = 0;

  packages.forEach((p) => {
    if (p.companyId && companyIdsToInactivate.has(p.companyId)) {
      if (p.status === "Active") {
        p.status = "Inactive";
        p.inactiveReason = branchTag;
        p.updatedAt = now;
        updatedCompanyPackagesCount++;
      }
    }
  });

  // 3. Mark Company Route Rates belonging to those Companies -> Inactive
  const companyRouteRates = await readCompanyRouteRates();
  let updatedCompanyRouteRatesCount = 0;

  companyRouteRates.forEach((r) => {
    if (companyIdsToInactivate.has(r.companyId)) {
      if (r.status === "Active") {
        r.status = "Inactive";
        r.inactiveReason = branchTag;
        r.updatedAt = now;
        updatedCompanyRouteRatesCount++;
      }
    }
  });

  // 4. Mark Global Route Rates where this Branch is FROM or TO -> Inactive
  const globalRouteRates = await readGlobalRouteRates();
  let updatedGlobalRouteRatesCount = 0;

  globalRouteRates.forEach((r) => {
    if (r.fromBranchId === branchId || r.toBranchId === branchId) {
      if (r.status === "Active") {
        r.status = "Inactive";
        r.inactiveReason = branchTag;
        r.updatedAt = now;
        updatedGlobalRouteRatesCount++;
      }
    }
  });

  // Save all updated datasets
  await writeGlobalRouteRates(globalRouteRates);
  await writeCompanyRouteRates(companyRouteRates);
  await writePackages(packages);
  await writeCompanies(companies);
  await writeBranches(branches);

  return {
    updatedBranch,
    updatedCounts: {
      branch: 1,
      companies: updatedCompaniesCount,
      companyPackages: updatedCompanyPackagesCount,
      companyRouteRates: updatedCompanyRouteRatesCount,
      globalRouteRates: updatedGlobalRouteRatesCount,
    },
  };
}

export async function activateBranch(
  branchId: string
): Promise<{ updatedBranch: Branch; updatedCounts: BranchCascadeCounts }> {
  const branches = await readBranches();
  const branchIndex = branches.findIndex(
    (branch) => branch.branchId === branchId
  );

  if (branchIndex === -1) {
    throw new Error("Branch not found.");
  }

  const now = new Date().toISOString();
  branches[branchIndex] = {
    ...branches[branchIndex],
    status: "Active",
    updatedAt: now,
  };
  const updatedBranch = branches[branchIndex];
  const branchTag = `branch:${branchId}`;

  // 1. Restore Companies registered under Branch ONLY IF inactivated by this branch cascade
  const companies = await readCompanies();
  const companyIdsInBranch = new Set<string>();
  let updatedCompaniesCount = 0;

  companies.forEach((c) => {
    if (c.branchId === branchId) {
      companyIdsInBranch.add(c.companyId);
      if (c.inactiveReason === branchTag) {
        c.status = "Active";
        delete c.inactiveReason;
        c.updatedAt = now;
        updatedCompaniesCount++;
      }
    }
  });

  // 2. Restore Company Packages belonging to those Companies ONLY IF inactivated by this branch cascade
  const packages = await readPackages();
  let updatedCompanyPackagesCount = 0;

  packages.forEach((p) => {
    if (p.companyId && companyIdsInBranch.has(p.companyId)) {
      if (p.inactiveReason === branchTag) {
        p.status = "Active";
        delete p.inactiveReason;
        p.updatedAt = now;
        updatedCompanyPackagesCount++;
      }
    }
  });

  // 3. Restore Company Route Rates belonging to those Companies ONLY IF inactivated by this branch cascade
  const companyRouteRates = await readCompanyRouteRates();
  let updatedCompanyRouteRatesCount = 0;

  companyRouteRates.forEach((r) => {
    if (companyIdsInBranch.has(r.companyId)) {
      if (r.inactiveReason === branchTag) {
        r.status = "Active";
        delete r.inactiveReason;
        r.updatedAt = now;
        updatedCompanyRouteRatesCount++;
      }
    }
  });

  // 4. Restore Global Route Rates where this Branch is FROM or TO ONLY IF inactivated by this branch cascade
  const globalRouteRates = await readGlobalRouteRates();
  let updatedGlobalRouteRatesCount = 0;

  globalRouteRates.forEach((r) => {
    if (r.fromBranchId === branchId || r.toBranchId === branchId) {
      if (r.inactiveReason === branchTag) {
        r.status = "Active";
        delete r.inactiveReason;
        r.updatedAt = now;
        updatedGlobalRouteRatesCount++;
      }
    }
  });

  // Save all updated datasets
  await writeGlobalRouteRates(globalRouteRates);
  await writeCompanyRouteRates(companyRouteRates);
  await writePackages(packages);
  await writeCompanies(companies);
  await writeBranches(branches);

  return {
    updatedBranch,
    updatedCounts: {
      branch: 1,
      companies: updatedCompaniesCount,
      companyPackages: updatedCompanyPackagesCount,
      companyRouteRates: updatedCompanyRouteRatesCount,
      globalRouteRates: updatedGlobalRouteRatesCount,
    },
  };
}




export async function getBranchesWithPagination(
  page: number,
  limit: number,
  search?: string,
  status?: "Active" | "Inactive"
)
{
  
  let branches = await getBranches();

if (search) {
  const searchTerm = search.trim().toLowerCase();

  branches = branches.filter(
    (branch) =>
      branch.branchName.toLowerCase().includes(searchTerm) ||
      branch.branchCode.toLowerCase().includes(searchTerm) ||
      branch.address.toLowerCase().includes(searchTerm)
  );
}

if (status) {
  branches = branches.filter(
    (branch) => branch.status === status
  );
}

  const totalRecords = branches.length;
  const totalPages = Math.ceil(totalRecords / limit);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const pagedBranches = branches.slice(startIndex, endIndex);

  // Fetch related data for stats
  const companies = await readCompanies();
  const packages = await readPackages();
  const companyRouteRates = await readCompanyRouteRates();
  const globalRouteRates = await readGlobalRouteRates();

  const data = pagedBranches.map(branch => {
    // 1. Companies for this branch
    const branchCompanies = companies.filter(c => c.branchId === branch.branchId);
    const companyIds = new Set(branchCompanies.map(c => c.companyId));
    
    // 2. Company Packages for these companies
    const companyPackagesCount = packages.filter(p => p.companyId && companyIds.has(p.companyId)).length;
    
    // 3. Company Route Rates for these companies
    const companyRouteRatesCount = companyRouteRates.filter(r => companyIds.has(r.companyId)).length;
    
    // 4. Global Route Rates involving this branch
    const branchGlobalRouteRates = globalRouteRates.filter(r => r.fromBranchId === branch.branchId || r.toBranchId === branch.branchId);
    
    // 5. Unique Global Packages utilized in these global route rates
    const globalPackagesCount = new Set(branchGlobalRouteRates.map(r => r.packageId)).size;

    return {
      ...branch,
      stats: {
        companies: branchCompanies.length,
        companyPackages: companyPackagesCount,
        companyRouteRates: companyRouteRatesCount,
        globalPackages: globalPackagesCount,
        globalRouteRates: branchGlobalRouteRates.length,
      }
    };
  });

  return {
    data,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
    },
  };
}

export async function filterBranchesByStatus(
  status: "Active" | "Inactive"
) {
  const branches = await getBranches();

  return branches.filter((branch) => branch.status === status);
}

export async function getBranchStatistics() {
  const branches = await getBranches();

  const totalBranches = branches.length;

  const activeBranches = branches.filter(
    (branch) => branch.status === "Active"
  ).length;

  const inactiveBranches = branches.filter(
    (branch) => branch.status === "Inactive"
  ).length;

  return {
    totalBranches,
    activeBranches,
    inactiveBranches,
  };
}