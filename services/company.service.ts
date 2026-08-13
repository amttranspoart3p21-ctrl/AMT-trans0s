import type { Company } from "@/types/company";

import {
    readCompanies,
    writeCompanies,
} from "@/lib/company";

import { readBranches } from "@/lib/branch";
import { readPackages, writePackages } from "@/lib/package";
import { readCompanyRouteRates, writeCompanyRouteRates } from "@/lib/company-route-rate";

import { validateCompany } from "@/validators/company.validator";

import { generateCompanyId } from "@/utils/generateCompanyId";

export interface CompanyCascadeCounts {
  company?: number;
  packages?: number;
  companyRouteRates?: number;
}



export async function createCompany(
    companyData: Omit<Company, "companyId" | "createdAt" | "updatedAt">
): Promise<Company> {
    // Read all branches and validate branch reference
    const branches = await readBranches();
    const branch = branches.find((b) => b.branchId === companyData.branchId);
    if (!branch) {
        throw new Error("Branch does not exist.");
    }

    const companyDataWithRealBranch = {
        ...companyData,
        branchName: branch.branchName,
    };

    // Validate input
    validateCompany(companyDataWithRealBranch);

    // Read existing companies
    const companies = await readCompanies();

    // Check duplicate company name within the same branch
    const companyExists = companies.some(
        (company) =>
            company.branchId === companyDataWithRealBranch.branchId &&
            company.companyName.trim().toLowerCase() ===
            companyDataWithRealBranch.companyName.trim().toLowerCase()
    );

    if (companyExists) {
        throw new Error(
            "Company already exists in this branch."
        );
    }

    // Create new company
    const newCompany: Company = {
        ...companyDataWithRealBranch,

        companyId: generateCompanyId(companies),
        branchCode: branch.branchCode,
        displayName: `${companyDataWithRealBranch.companyName} - ${branch.branchCode}`,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Save
    companies.push(newCompany);

    await writeCompanies(companies);

    return newCompany;
}

// export async function getCompanies(): Promise<Company[]> {
//     return await readCompanies();
// }

export async function getCompanies(
  page?: number,
  limit?: number,
  search?: string,
  branchId?: string,
  status?: Company["status"]
): Promise<{
  companies: Company[];
  totalCompanies: number;
  currentPage: number;
  totalPages: number;
}> {
  let companies = await readCompanies();

  // Step 1: Search
  if (search) {
    const keyword = search.trim().toLowerCase();
    companies = companies.filter((company) =>
      company.companyName.toLowerCase().includes(keyword)
    );
  }

  // Step 2: Branch Filter
  if (branchId) {
    companies = companies.filter((company) =>
      company.branchId === branchId
    );
  }

  // Step 3: Status Filter
  if (status) {
    companies = companies.filter((company) =>
      company.status === status
    );
  }

  // Step 4: Pagination
  const totalCompanies = companies.length;

  if (!page || !limit) {
    return {
      companies,
      totalCompanies,
      currentPage: 1,
      totalPages: 1,
    };
  }

  const start = (page - 1) * limit;
  const end = start + limit;

  const pagedCompanies = companies.slice(start, end);

  // Fetch related data for stats
  const packages = await readPackages();
  const companyRouteRates = await readCompanyRouteRates();

  const companiesWithStats = pagedCompanies.map((company) => {
    const companyPackagesCount = packages.filter(p => p.companyId === company.companyId).length;
    const companyRouteRatesCount = companyRouteRates.filter(r => r.companyId === company.companyId).length;

    return {
      ...company,
      stats: {
        companyPackages: companyPackagesCount,
        companyRouteRates: companyRouteRatesCount,
      }
    };
  });

  return {
    companies: companiesWithStats,
    totalCompanies,
    currentPage: page,
    totalPages: Math.ceil(totalCompanies / limit),
  };
}

export async function getCompanyById(
    companyId: string
): Promise<Company> {
    const companies = await readCompanies();

    const company = companies.find(
        (company) => company.companyId === companyId
    );

    if (!company) {
        throw new Error("Company not found.");
    }

    return company;
}

export async function updateCompany(
    companyId: string,
    companyData: Omit<Company, "companyId" | "createdAt" | "updatedAt">
): Promise<Company> {
    // Read all branches and validate branch reference
    const branches = await readBranches();
    const branch = branches.find((b) => b.branchId === companyData.branchId);
    if (!branch) {
        throw new Error("Branch does not exist.");
    }

    const companyDataWithRealBranch = {
        ...companyData,
        branchName: branch.branchName,
    };

    // Validate input
    validateCompany(companyDataWithRealBranch);

    // Read all companies
    const companies = await readCompanies();

    // Find company index
    const companyIndex = companies.findIndex(
        (company) => company.companyId === companyId
    );

    if (companyIndex === -1) {
        throw new Error("Company not found.");
    }

    // Check duplicate company name in the same branch
    const duplicateCompany = companies.find(
        (company) =>
            company.companyId !== companyId &&
            company.branchId === companyDataWithRealBranch.branchId &&
            company.companyName.trim().toLowerCase() ===
            companyDataWithRealBranch.companyName.trim().toLowerCase()
    );

    if (duplicateCompany) {
        throw new Error("Company already exists in this branch.");
    }

    // Update company
    companies[companyIndex] = {
        ...companies[companyIndex],
        ...companyDataWithRealBranch,
        branchCode: branch.branchCode,
        displayName: `${companyDataWithRealBranch.companyName} - ${branch.branchCode}`,
        updatedAt: new Date().toISOString(),
    };

    // Save
    await writeCompanies(companies);

    return companies[companyIndex];
}

export async function deleteCompany(
    companyId: string
): Promise<{ deletedCompany: Company; deletedCounts: CompanyCascadeCounts }> {
    const companies = await readCompanies();

    const company = companies.find(
        (c) => c.companyId === companyId
    );

    if (!company) {
        throw new Error("Company not found.");
    }

    // 1. Delete Company Packages belonging to this Company
    const packages = await readPackages();
    const companyPackagesToDelete = packages.filter((p) => p.companyId === companyId);
    const remainingPackages = packages.filter((p) => p.companyId !== companyId);

    // 2. Delete Company Route Rates belonging to this Company
    const companyRouteRates = await readCompanyRouteRates();
    const companyRouteRatesToDelete = companyRouteRates.filter((r) => r.companyId === companyId);
    const remainingCompanyRouteRates = companyRouteRates.filter((r) => r.companyId !== companyId);

    // 3. Delete Company
    const remainingCompanies = companies.filter(
        (c) => c.companyId !== companyId
    );

    await writeCompanyRouteRates(remainingCompanyRouteRates);
    await writePackages(remainingPackages);
    await writeCompanies(remainingCompanies);

    return {
        deletedCompany: company,
        deletedCounts: {
            company: 1,
            packages: companyPackagesToDelete.length,
            companyRouteRates: companyRouteRatesToDelete.length,
        },
    };
}

export async function inactiveCompany(
    companyId: string
): Promise<{ updatedCompany: Company; updatedCounts: CompanyCascadeCounts }> {
    const companies = await readCompanies();

    const companyIndex = companies.findIndex(
        (c) => c.companyId === companyId
    );

    if (companyIndex === -1) {
        throw new Error("Company not found.");
    }

    const now = new Date().toISOString();
    const companyTag = `company:${companyId}`;

    companies[companyIndex] = {
        ...companies[companyIndex],
        status: "Inactive",
        inactiveReason: "manual",
        updatedAt: now,
    };
    const updatedCompany = companies[companyIndex];

    // 1. Set Company Packages belonging to this company -> Inactive ONLY IF Active
    const packages = await readPackages();
    let updatedPackagesCount = 0;

    packages.forEach((p) => {
        if (p.companyId === companyId) {
            if (p.status === "Active") {
                p.status = "Inactive";
                p.inactiveReason = companyTag;
                p.updatedAt = now;
                updatedPackagesCount++;
            }
        }
    });

    // 2. Set Company Route Rates belonging to this company -> Inactive ONLY IF Active
    const companyRouteRates = await readCompanyRouteRates();
    let updatedRouteRatesCount = 0;

    companyRouteRates.forEach((r) => {
        if (r.companyId === companyId) {
            if (r.status === "Active") {
                r.status = "Inactive";
                r.inactiveReason = companyTag;
                r.updatedAt = now;
                updatedRouteRatesCount++;
            }
        }
    });

    await writeCompanyRouteRates(companyRouteRates);
    await writePackages(packages);
    await writeCompanies(companies);

    return {
        updatedCompany,
        updatedCounts: {
            company: 1,
            packages: updatedPackagesCount,
            companyRouteRates: updatedRouteRatesCount,
        },
    };
}

export async function activateCompany(
    companyId: string
): Promise<{ updatedCompany: Company; updatedCounts: CompanyCascadeCounts }> {
    const companies = await readCompanies();

    const companyIndex = companies.findIndex(
        (c) => c.companyId === companyId
    );

    if (companyIndex === -1) {
        throw new Error("Company not found.");
    }

    const now = new Date().toISOString();
    const companyTag = `company:${companyId}`;

    const updatedComp = { ...companies[companyIndex] };
    updatedComp.status = "Active";
    delete updatedComp.inactiveReason;
    updatedComp.updatedAt = now;
    companies[companyIndex] = updatedComp;

    const updatedCompany = companies[companyIndex];

    // 1. Set Company Packages belonging to this company -> Active ONLY IF inactivated by this company cascade
    const packages = await readPackages();
    let updatedPackagesCount = 0;

    packages.forEach((p) => {
        if (p.companyId === companyId) {
            if (p.inactiveReason === companyTag) {
                p.status = "Active";
                delete p.inactiveReason;
                p.updatedAt = now;
                updatedPackagesCount++;
            }
        }
    });

    // 2. Set Company Route Rates belonging to this company -> Active ONLY IF inactivated by this company cascade
    const companyRouteRates = await readCompanyRouteRates();
    let updatedRouteRatesCount = 0;

    companyRouteRates.forEach((r) => {
        if (r.companyId === companyId) {
            if (r.inactiveReason === companyTag) {
                r.status = "Active";
                delete r.inactiveReason;
                r.updatedAt = now;
                updatedRouteRatesCount++;
            }
        }
    });

    await writeCompanyRouteRates(companyRouteRates);
    await writePackages(packages);
    await writeCompanies(companies);

    return {
        updatedCompany,
        updatedCounts: {
            company: 1,
            packages: updatedPackagesCount,
            companyRouteRates: updatedRouteRatesCount,
        },
    };
}



export async function companyNameExists(
    branchId: string,
    companyName: string,
    excludeCompanyId?: string
): Promise<boolean> {
    const companies = await readCompanies();

    return companies.some(
        (company) =>
            company.branchId === branchId &&
            company.companyName.trim().toLowerCase() ===
            companyName.trim().toLowerCase() &&
            company.companyId !== excludeCompanyId
    );
}