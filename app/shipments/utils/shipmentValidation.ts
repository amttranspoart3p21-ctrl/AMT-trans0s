import type { ShipmentRecord } from "@/types/shipment";
import { calculateQuantity } from "./calculateQuantity";

/**
 * Returns validation warning messages for a shipment record.
 */
export function getRowWarnings(s: ShipmentRecord): string[] {
  const warnings: string[] = [];
  if (!s.date) warnings.push("Date is required.");
  if (!s.vehicleNumber || s.vehicleNumber === "MOCK-1234") warnings.push("Vehicle number is required.");
  if (!s.fromAmtBranch) warnings.push("From Branch is required.");
  if (!s.fromCompany) warnings.push("From Company is required.");
  if (!s.toAmtBranch) warnings.push("To Branch is required.");
  if (!s.toCompany) warnings.push("To Company is required.");
  if (!s.paymentCompany) warnings.push("Payment Company is required.");
  if (s.fromAmtBranch && s.toAmtBranch && s.fromAmtBranch === s.toAmtBranch) {
    warnings.push("Origin and destination branches cannot be the same.");
  }
  if (!s.packageType) warnings.push("Package Type is required.");

  const qtyVal = calculateQuantity(s.quantity);
  if (qtyVal <= 0) {
    warnings.push("Quantity must be greater than 0.");
  }
  if (s.pricePerPiece === null || s.pricePerPiece === undefined || s.pricePerPiece <= 0) {
    warnings.push("Price per piece must be greater than 0.");
  }
  return warnings;
}

/**
 * Checks if an individual field in a shipment has a validation warning.
 */
export function isFieldWarning(
  field: keyof ShipmentRecord,
  val: any,
  shipment: ShipmentRecord
): boolean {
  if (field === "date" && !val) return true;
  if (field === "vehicleNumber" && (!val || val === "MOCK-1234")) return true;
  if (field === "fromAmtBranch") {
    if (!val) return true;
    if (val === shipment.toAmtBranch) return true;
  }
  if (field === "toAmtBranch") {
    if (!val) return true;
    if (val === shipment.fromAmtBranch) return true;
  }
  if (field === "fromCompany" && !val) return true;
  if (field === "toCompany" && !val) return true;
  if (field === "paymentCompany" && !val) return true;
  if (field === "packageType" && !val) return true;
  if (field === "quantity") {
    const qtyVal = calculateQuantity(val);
    if (qtyVal <= 0) return true;
  }
  if (field === "pricePerPiece" && (val === null || val === undefined || val <= 0)) return true;
  return false;
}
