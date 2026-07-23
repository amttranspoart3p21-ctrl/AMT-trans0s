import { generateBranchId } from "@/utils/generateBranchId";
import { validateBranch } from "@/validators/branch.validator";
import { readBranches, writeBranches } from "@/lib/branch";

import type { Branch } from "@/types/branch";


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
): Promise<Branch> {
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

  // Save changes
  await writeBranches(branches);

  return deletedBranch;
}

export async function getBranchesWithPagination(
  page: number,
  limit: number,
  search?: string,
  status?: "Active" | "Shutdown"
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

  const data = branches.slice(startIndex, endIndex);

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
  status: "Active" | "Shutdown"
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

  const shutdownBranches = branches.filter(
    (branch) => branch.status === "Shutdown"
  ).length;

  return {
    totalBranches,
    activeBranches,
    shutdownBranches,
  };
}