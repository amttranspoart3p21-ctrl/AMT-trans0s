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

export function calculateQuantity(quantityVal: string | number | undefined | null): number {
  if (quantityVal === undefined || quantityVal === null || quantityVal === "") return 0;
  if (typeof quantityVal === "number") return isNaN(quantityVal) ? 0 : quantityVal;

  const str = String(quantityVal).trim();
  if (!str) return 0;

  // Handle formulas like 10*20 or 10x20
  if (str.includes("*") || str.includes("x") || str.includes("X") || str.includes("×")) {
    const parts = str.split(/[*xX×]/).map((p) => parseFloat(p.trim())).filter((n) => !isNaN(n));
    if (parts.length > 0) {
      return parts.reduce((acc, curr) => acc * curr, 1);
    }
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export interface PaymentContext {
  paymentCompany: string | null;
  paymentBranch: string | null;
}

/**
 * Centralized helper for determining the actual payment context for Company Billing.
 * Evaluates paymentReceivingBranch to identify whether the FROM side or TO side is responsible
 * for payment, resolving the exact paymentCompany and paymentBranch.
 */
export function resolvePaymentContext(
  shipment: {
    paymentCompany?: string;
    paymentReceivingBranch?: string;
    fromCompany?: string;
    fromAmtBranch?: string;
    toCompany?: string;
    toAmtBranch?: string;
  },
  branches: { branchCode: string; branchName: string; branchId: string }[] = []
): PaymentContext {
  const prb = (shipment.paymentReceivingBranch || "").trim();

  // Helper to normalize branch values to clean branchCode (e.g. "AMB", "RNP", "CHE")
  const resolveBranchCode = (val: string | undefined): string => {
    if (!val) return "";
    const clean = val.trim();
    if (!clean) return "";
    const match = branches.find(
      (b) =>
        b.branchCode.toLowerCase() === clean.toLowerCase() ||
        b.branchName.toLowerCase() === clean.toLowerCase() ||
        b.branchId.toLowerCase() === clean.toLowerCase()
    );
    return match ? match.branchCode : clean;
  };

  // Rule 7 & Test 4: Missing/empty paymentReceivingBranch -> NO payment context resolved
  if (!prb) {
    return { paymentCompany: null, paymentBranch: null };
  }

  const prbLower = prb.toLowerCase();

  // Case 1: Payment Branch = "From Company" or "From Branch"
  if (prbLower === "from company" || prbLower === "from branch") {
    const pComp = (shipment.fromCompany || shipment.paymentCompany || "").trim();
    const pBranch = resolveBranchCode(shipment.fromAmtBranch);
    return {
      paymentCompany: pComp || null,
      paymentBranch: pBranch || null,
    };
  }

  // Case 2: Payment Branch = "To Company" or "To Branch"
  if (prbLower === "to company" || prbLower === "to branch") {
    const pComp = (shipment.toCompany || shipment.paymentCompany || "").trim();
    const pBranch = resolveBranchCode(shipment.toAmtBranch);
    return {
      paymentCompany: pComp || null,
      paymentBranch: pBranch || null,
    };
  }

  // Case 3: paymentReceivingBranch contains a specific branch code/name (e.g. "CHE", "AMB", "RNP")
  const prbBranchCode = resolveBranchCode(prb);
  const fromBranchCode = resolveBranchCode(shipment.fromAmtBranch);
  const toBranchCode = resolveBranchCode(shipment.toAmtBranch);

  let pComp = "";
  if (toBranchCode && prbBranchCode && toBranchCode.toLowerCase() === prbBranchCode.toLowerCase()) {
    pComp = (shipment.toCompany || "").trim();
  } else if (fromBranchCode && prbBranchCode && fromBranchCode.toLowerCase() === prbBranchCode.toLowerCase()) {
    pComp = (shipment.fromCompany || "").trim();
  } else {
    pComp = (shipment.paymentCompany || shipment.fromCompany || shipment.toCompany || "").trim();
  }

  return {
    paymentCompany: pComp || null,
    paymentBranch: prbBranchCode || null,
  };
}

