import type { Company } from "@/types/company";

export function validateCompany(
  company: Omit<Company, "companyId" | "createdAt" | "updatedAt">
): void {
  // Branch ID
  if (!company.branchId.trim()) {
    throw new Error("Branch ID is required.");
  }

  // Branch Name
  if (!company.branchName.trim()) {
    throw new Error("Branch Name is required.");
  }

  // Company Name
  if (!company.companyName.trim()) {
    throw new Error("Company Name is required.");
  }

  // Status
  if (!["Active", "Inactive"].includes(company.status)) {
    throw new Error("Status must be either Active or Inactive.");
  }

  // Email (Optional)
  if (company.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(company.email)) {
      throw new Error("Invalid email address.");
    }
  }
}