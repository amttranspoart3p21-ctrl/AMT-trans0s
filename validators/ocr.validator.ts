import type { Branch } from "@/types/branch";
import type { OcrShipmentRow, RowValidationResult } from "@/types/ocr";

/**
 * Validates the quantity format for OCR / manual entries.
 * Supports positive integers and multiplication formulas (e.g. 10 x 2, 5*4, 12 × 3).
 * Ensures all numbers are strictly positive (> 0).
 */
export function validateQuantityFormat(
  quantity: string | number | null | undefined
): boolean {
  if (quantity === null || quantity === undefined) {
    return false;
  }

  const qtyStr = String(quantity).trim();
  const pattern = /^\d+(?:\s*[xX*×]\s*\d+)*$/;
  if (!pattern.test(qtyStr)) {
    return false;
  }

  const numbers = qtyStr.match(/\d+/g);
  if (!numbers) {
    return false;
  }

  const hasZeroOrNegative = numbers.some((n) => parseInt(n, 10) <= 0);
  if (hasZeroOrNegative) {
    return false;
  }

  return true;
}

/**
 * Validates a single shipment row against required fields and quantity syntax.
 * Returns { isValid: boolean, errors: string[] }.
 */
export function validateShipmentRow(
  shipment: Pick<
    OcrShipmentRow,
    "fromCompany" | "customerInvoice" | "toCompany" | "packageType" | "quantity"
  >
): RowValidationResult {
  const errors: string[] = [];

  if (!shipment.fromCompany || shipment.fromCompany.trim() === "") {
    errors.push("Missing From Company");
  }
  if (!shipment.customerInvoice || shipment.customerInvoice.trim() === "") {
    errors.push("Missing Customer Invoice");
  }
  if (!shipment.toCompany || shipment.toCompany.trim() === "") {
    errors.push("Missing To Company");
  }
  if (!shipment.packageType || shipment.packageType.trim() === "") {
    errors.push("Missing Package Type");
  }

  if (shipment.quantity === null || shipment.quantity === undefined) {
    errors.push("Invalid Quantity");
  } else {
    const isValidQty = validateQuantityFormat(shipment.quantity);
    if (!isValidQty) {
      errors.push("Invalid Quantity");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Backward-compatible alias for validateShipmentRow.
 */
export const validateRow = validateShipmentRow;

/**
 * Validates whether origin and destination branch selections are valid:
 * - Both must be non-empty
 * - Origin must be distinct from destination
 */
export function validateBranchSelection(
  fromAmtBranch?: string | null,
  toAmtBranch?: string | null
): boolean {
  const from = (fromAmtBranch || "").trim();
  const to = (toAmtBranch || "").trim();
  return from !== "" && to !== "" && from !== to;
}

export interface BranchReconciliationResult {
  updatedFrom: string;
  updatedTo: string;
  errorMessage: string;
}

/**
 * Reconciles previously selected branches against an updated list of active branches.
 * Resets any invalid selection and generates an appropriate error message if needed.
 */
export function reconcileActiveBranches(
  fromAmtBranch: string,
  toAmtBranch: string,
  activeBranches: Branch[]
): BranchReconciliationResult {
  let updatedFrom = fromAmtBranch;
  let updatedTo = toAmtBranch;
  let fromInvalid = false;
  let toInvalid = false;

  if (fromAmtBranch) {
    const isActive = activeBranches.some((b) => b.branchName === fromAmtBranch);
    if (!isActive) {
      updatedFrom = "";
      fromInvalid = true;
    }
  }

  if (toAmtBranch) {
    const isActive = activeBranches.some((b) => b.branchName === toAmtBranch);
    if (!isActive) {
      updatedTo = "";
      toInvalid = true;
    }
  }

  let errorMessage = "";
  if (fromInvalid || toInvalid) {
    const invalidFields: string[] = [];
    if (fromInvalid) invalidFields.push("From Branch");
    if (toInvalid) invalidFields.push("To Branch");
    errorMessage = `Selected ${invalidFields.join(" and ")} is no longer active or has been deleted. Please select a valid branch.`;
  }

  return {
    updatedFrom,
    updatedTo,
    errorMessage,
  };
}
