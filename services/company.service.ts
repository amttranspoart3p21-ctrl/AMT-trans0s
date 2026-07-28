import type { Company } from "@/types/company";

import {
    readCompanies,
    writeCompanies,
} from "@/lib/company";

import { readBranches } from "@/lib/branch";

import { validateCompany } from "@/validators/company.validator";

import { generateCompanyId } from "@/utils/generateCompanyId";


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

  return {
    companies: companies.slice(start, end),
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
): Promise<void> {
    const companies = await readCompanies();

    const companyExists = companies.some(
        (company) => company.companyId === companyId
    );

    if (!companyExists) {
        throw new Error("Company not found.");
    }

    const updatedCompanies = companies.filter(
        (company) => company.companyId !== companyId
    );

    await writeCompanies(updatedCompanies);
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