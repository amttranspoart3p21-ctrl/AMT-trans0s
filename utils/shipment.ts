// this file code is use for  unique id generation for  main excel sheet for CRUD operation with the help of unique id genration 

import fs from "fs/promises";
import path from "path";
import { readCompanies } from "@/lib/company";
import type { Company } from "@/types/company";
import type { Shipment } from "@/types/shipment";

const COUNTER_FILE = path.join(
  process.cwd(),
  "storage",
  "metadata",
  "shipment-counter.json"
);

interface ShipmentCounter {
  lastShipmentNumber: number;
}

export async function generateShipmentId(): Promise<string> {
  const file = await fs.readFile(COUNTER_FILE, "utf-8");

  const counter: ShipmentCounter = JSON.parse(file);

  counter.lastShipmentNumber++;

  await fs.writeFile(
    COUNTER_FILE,
    JSON.stringify(counter, null, 2)
  );

  return `SHP${counter.lastShipmentNumber
    .toString()
    .padStart(6, "0")}`;
}

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

  // 2. Try matching by companyName and branch (matching branchName, branchCode, or branchId)
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

  // 3. Try matching by companyName only
  const byNameOnly = companies.find(
    (c) => c.companyName.trim().toLowerCase() === trimmedName
  );
  if (byNameOnly) {
    return { companyId: byNameOnly.companyId, companyName: byNameOnly.companyName };
  }

  // 4. Try matching by companyId directly
  const byId = companies.find(
    (c) => c.companyId.trim().toLowerCase() === trimmedName
  );
  if (byId) {
    return { companyId: byId.companyId, companyName: byId.companyName };
  }

  // Fallback: Check if it has a suffix " - CODE" and try to extract it
  const match = name.trim().match(/^(.*?)\s*-\s*[A-Za-z0-9]+$/);
  if (match) {
    const extractedName = match[1].trim();
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

export async function resolveCompanyNamesInShipment<T extends Partial<Shipment>>(shipment: T): Promise<T> {
  const companies = await readCompanies();
  const resolved = { ...shipment };

  if (resolved.fromCompany) {
    const details = resolveCompanyDetails(resolved.fromCompany, resolved.fromAmtBranch, companies);
    resolved.fromCompany = details.companyName;
  }
  if (resolved.toCompany) {
    const details = resolveCompanyDetails(resolved.toCompany, resolved.toAmtBranch, companies);
    resolved.toCompany = details.companyName;
  }
  if (resolved.paymentCompany) {
    let branchVal = "";
    if (resolved.paymentReceivingBranch === "From Company") {
      branchVal = resolved.fromAmtBranch || "";
    } else if (resolved.paymentReceivingBranch === "To Company") {
      branchVal = resolved.toAmtBranch || "";
    }
    const details = resolveCompanyDetails(resolved.paymentCompany, branchVal, companies);
    resolved.paymentCompany = details.companyName;
  }

  return resolved;
}

export function calculateQuantity(qty: string | null | undefined): number {
  if (qty === null || qty === undefined) {
    return 1;
  }
  const clean = qty.trim();
  if (clean === "") {
    return 1;
  }

  // Validate that the format is number(s) optionally separated by x/X/*/×
  const pattern = /^\d+(?:\s*[xX*×]\s*\d+)*$/;
  if (!pattern.test(clean)) {
    return 1;
  }

  const parts = clean.split(/[xX*×]/);
  let product = 1;
  for (const part of parts) {
    const valStr = part.trim();
    // Validate positive integer check
    if (!/^\d+$/.test(valStr)) {
      return 1;
    }
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val <= 0) {
      return 1;
    }
    product *= val;
  }

  return product;
}

export function parseYearMonthFromDate(dateStr: string): { year: number; month: string } {
  const clean = (dateStr || "").trim();
  if (clean === "") {
    throw new Error("Register Date is missing or empty.");
  }
  
  // Try YYYY-MM-DD
  let match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const monthIndex = parseInt(match[2], 10) - 1; // 0-indexed
    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error(`Invalid month value in Register Date: ${clean}`);
    }
    const dateObj = new Date(year, monthIndex, 1);
    const month = dateObj.toLocaleString("default", { month: "long" });
    return { year, month };
  }

  // Try DD-MM-YYYY
  match = clean.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    const year = parseInt(match[3], 10);
    const monthIndex = parseInt(match[2], 10) - 1; // 0-indexed
    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error(`Invalid month value in Register Date: ${clean}`);
    }
    const dateObj = new Date(year, monthIndex, 1);
    const month = dateObj.toLocaleString("default", { month: "long" });
    return { year, month };
  }

  // Try standard Date parsing
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = parsed.toLocaleString("default", { month: "long" });
    return { year, month };
  }

  throw new Error(`Register Date format is invalid: "${clean}". Expected YYYY-MM-DD or DD-MM-YYYY.`);
}