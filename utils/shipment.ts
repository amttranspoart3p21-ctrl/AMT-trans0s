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

import { resolveCompanyDetails } from "./shipment-shared";
export { resolveCompanyDetails };

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

export function calculateQuantity(qty: string | number | null | undefined): number {
  if (qty === null || qty === undefined) {
    return 1;
  }
  if (typeof qty === "number") {
    return qty;
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