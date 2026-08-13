import type { Branch } from "@/types/branch";

export function validateBranch(
  branch: Omit<Branch, "branchId" | "createdAt" | "updatedAt">
): string[] {
  const errors: string[] = [];

  if (!branch.branchName.trim()) {
    errors.push("Branch Name is required.");
  }

  if (!branch.branchCode.trim()) {
    errors.push("Branch Code is required.");
  }

  if (!branch.address.trim()) {
    errors.push("Address is required.");
  }

  if (!branch.phoneNumber1.trim()) {
    errors.push("Phone Number 1 is required.");
  }

  if (!["Active", "Inactive", "Shutdown"].includes(branch.status)) {
    errors.push("Invalid Branch Status.");
  }

  return errors;
}
