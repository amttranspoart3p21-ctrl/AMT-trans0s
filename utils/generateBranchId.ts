import type { Branch } from "@/types/branch";   // importing types for type script its only for branch 

// this file code is use for  unique id generation for  main excel sheet for CRUD operation with the help of unique id genration 

export function generateBranchId(branches: Branch[]): string {
  if (branches.length === 0) {
    return "BR001";
  }

  const maxId = branches.reduce((max, branch) => {
    const id = Number(branch.branchId.replace("BR", ""));
    return Math.max(max, id);
  }, 0);

  return `BR${String(maxId + 1).padStart(3, "0")}`;
}