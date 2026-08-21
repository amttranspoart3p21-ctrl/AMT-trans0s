import { readBranches } from "@/lib/branch";
import { readCompanies } from "@/lib/company";
import { readPackages } from "@/lib/package";

export interface MasterDashboardStats {
  branches: {
    total: number;
    active: number;
    inactive: number;
  };
  companies: {
    total: number;
    active: number;
    inactive: number;
    associatedBranches: number;
  };
  packages: {
    total: number;
    active: number;
    inactive: number;
    global: number;
    company: number;
  };
}

export async function getMasterDashboardStats(): Promise<MasterDashboardStats> {
  const [branches, companies, packages] = await Promise.all([
    readBranches(),
    readCompanies(),
    readPackages(),
  ]);

  // Branch statistics
  const totalBranches = branches.length;
  const activeBranches = branches.filter((branch) => branch.status === "Active").length;
  const inactiveBranches = branches.filter((branch) => branch.status === "Inactive").length;

  // Company statistics
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((company) => company.status === "Active").length;
  const inactiveCompanies = companies.filter((company) => company.status === "Inactive").length;
  const associatedBranches = new Set(
    companies
      .map((company) => company.branchId)
      .filter(Boolean)
  ).size;

  // Package statistics (counted by packageId record identity, strictly preserving duplicate packageName items)
  const totalPackages = packages.length;
  const activePackages = packages.filter((pkg) => pkg.status === "Active").length;
  const inactivePackages = packages.filter((pkg) => pkg.status === "Inactive").length;
  const globalPackages = packages.filter((pkg) => !pkg.companyId).length;
  const companyPackages = packages.filter((pkg) => Boolean(pkg.companyId)).length;

  return {
    branches: {
      total: totalBranches,
      active: activeBranches,
      inactive: inactiveBranches,
    },
    companies: {
      total: totalCompanies,
      active: activeCompanies,
      inactive: inactiveCompanies,
      associatedBranches,
    },
    packages: {
      total: totalPackages,
      active: activePackages,
      inactive: inactivePackages,
      global: globalPackages,
      company: companyPackages,
    },
  };
}
