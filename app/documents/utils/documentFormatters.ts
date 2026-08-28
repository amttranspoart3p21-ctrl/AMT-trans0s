import type { Branch } from "@/types/branch";

/**
 * Dynamic branch code lookup helper using active system branches list.
 * Resolves branch code (e.g., "AMB") from a branch code, branch name, or branch ID.
 * Returns the matching branchCode, or the cleaned raw string if unknown,
 * or fallback if the input is empty/falsy.
 */
export function resolveBranchCode(
  val: string | number | undefined | null | unknown,
  branches: Branch[] = [],
  fallback: string = "-"
): string {
  if (!val) return fallback;
  const clean = String(val).trim();
  if (!clean) return fallback;

  const match = branches.find(
    (b) =>
      b.branchCode.toLowerCase() === clean.toLowerCase() ||
      b.branchName.toLowerCase() === clean.toLowerCase() ||
      b.branchId.toLowerCase() === clean.toLowerCase()
  );
  return match ? match.branchCode : clean;
}

/**
 * Formats a monetary amount in Indian Rupees (INR) with configurable decimal precision.
 * Returns formatted string prefixed with ₹ (e.g. "₹1,500" for 0 decimals, "₹1,500.00" for 2 decimals).
 * Falls back to String(val) or "-" for invalid/empty inputs.
 */
export function formatCurrency(
  val: number | string | undefined | null,
  decimals: number = 0
): string {
  if (val === null || val === undefined || val === "") return "-";
  const num = typeof val === "number" ? val : Number(val);
  if (isNaN(num)) return String(val);

  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Formats a date string, number, or Date instance into Indian localized date format.
 * Supports configurable year format: "numeric" (e.g., "28 Aug 2026") or "2-digit" (e.g., "28 Aug 26").
 * Falls back to String(val) or "-" for invalid/empty inputs.
 */
export function formatDate(
  val: string | number | Date | undefined | null,
  yearFormat: "numeric" | "2-digit" = "numeric"
): string {
  if (!val) return "-";
  try {
    const d = val instanceof Date ? val : new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: yearFormat,
      });
    }
  } catch (_) {}
  return String(val);
}
