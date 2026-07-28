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