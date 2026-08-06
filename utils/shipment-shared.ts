import type { Company } from "@/types/company";

export function resolveCompanyDetails(
  name: string | undefined,
  branch: string | undefined,
  companies: Company[]
): { companyId: string; companyName: string } {
  if (!name) return { companyId: "", companyName: "" };
  const trimmedName = name.trim().toLowerCase();
  const trimmedBranch = branch ? branch.trim().toLowerCase() : "";

  // 1. Try matching by displayName first (e.g. "XYZ Exports - AMB")
  const byDisplayName = companies.find(
    (c) => c.displayName && c.displayName.trim().toLowerCase() === trimmedName
  );
  if (byDisplayName) {
    return { companyId: byDisplayName.companyId, companyName: byDisplayName.companyName };
  }

  // If a branch is specified, we must only match if both company name/ID and branch match.
  if (trimmedBranch) {
    // A. Try matching by companyName and branch
    const byNameAndBranch = companies.find(
      (c) =>
        c.companyName.trim().toLowerCase() === trimmedName &&
        (c.branchName.trim().toLowerCase() === trimmedBranch ||
          (c.branchCode && c.branchCode.trim().toLowerCase() === trimmedBranch) ||
          c.branchId.trim().toLowerCase() === trimmedBranch)
    );
    if (byNameAndBranch) {
      return { companyId: byNameAndBranch.companyId, companyName: byNameAndBranch.companyName };
    }

    // B. Try matching by companyId and branch
    const byIdAndBranch = companies.find(
      (c) =>
        c.companyId.trim().toLowerCase() === trimmedName &&
        (c.branchName.trim().toLowerCase() === trimmedBranch ||
          (c.branchCode && c.branchCode.trim().toLowerCase() === trimmedBranch) ||
          c.branchId.trim().toLowerCase() === trimmedBranch)
    );
    if (byIdAndBranch) {
      return { companyId: byIdAndBranch.companyId, companyName: byIdAndBranch.companyName };
    }

    // C. Try matching extracted name (from "XYZ Exports - RPT" suffix) and branch
    const suffixMatch = name.trim().match(/^(.*?)\s*-\s*[A-Za-z0-9]+$/);
    if (suffixMatch) {
      const extractedName = suffixMatch[1].trim();
      const byExtractedNameAndBranch = companies.find(
        (c) =>
          c.companyName.trim().toLowerCase() === extractedName.toLowerCase() &&
          (c.branchName.trim().toLowerCase() === trimmedBranch ||
            (c.branchCode && c.branchCode.trim().toLowerCase() === trimmedBranch) ||
            c.branchId.trim().toLowerCase() === trimmedBranch)
      );
      if (byExtractedNameAndBranch) {
        return { companyId: byExtractedNameAndBranch.companyId, companyName: byExtractedNameAndBranch.companyName };
      }
    }

    // If branch is specified but no match is found, do NOT fall back to name only.
    // Instead return the trimmed name directly (supports manual/unregistered entries)
    return { companyId: "", companyName: name.trim() };
  }

  // 2. If no branch is specified, fallback to matches by name only
  const byNameOnly = companies.find(
    (c) => c.companyName.trim().toLowerCase() === trimmedName
  );
  if (byNameOnly) {
    return { companyId: byNameOnly.companyId, companyName: byNameOnly.companyName };
  }

  // 3. Try matching by companyId directly
  const byId = companies.find(
    (c) => c.companyId.trim().toLowerCase() === trimmedName
  );
  if (byId) {
    return { companyId: byId.companyId, companyName: byId.companyName };
  }

  // 4. Try matching by extracted name only
  const suffixMatch = name.trim().match(/^(.*?)\s*-\s*[A-Za-z0-9]+$/);
  if (suffixMatch) {
    const extractedName = suffixMatch[1].trim();
    const byExtractedName = companies.find(
      (c) => c.companyName.trim().toLowerCase() === extractedName.toLowerCase()
    );
    if (byExtractedName) {
      return { companyId: byExtractedName.companyId, companyName: byExtractedName.companyName };
    }
    return { companyId: "", companyName: extractedName };
  }

  return { companyId: "", companyName: name.trim() };
}
