import type { Package } from "@/types/packageType";
import type { Company } from "@/types/company";
import type { Branch } from "@/types/branch";

export interface PackageOptionItem {
  value: string;
  label: string;
  badge: string;
  badgeType: "global" | "company" | "shipment";
}

export function buildPackageOptions(
  packages: Package[],
  companies: Company[],
  branches: Branch[],
  shipmentPackages: string[]
): PackageOptionItem[] {
  const list: PackageOptionItem[] = [];
  const seenValues = new Set<string>();

  // 1. Global packages
  const globalPkgs = packages.filter((p) => !p.companyName && p.status === "Active");
  globalPkgs.forEach((p) => {
    const val = p.packageName;
    if (!seenValues.has(val.toLowerCase())) {
      seenValues.add(val.toLowerCase());
      list.push({
        value: val,
        label: `📦 ${val}`,
        badge: "Global",
        badgeType: "global",
      });
    }
  });

  // 2. Company packages
  const companyPkgs = packages.filter((p) => p.companyName && p.status === "Active");
  companyPkgs.forEach((p) => {
    const comp = companies.find((c) => c.companyId === p.companyId);
    const branch = branches.find((b) => b.branchId === comp?.branchId || b.branchName === comp?.branchName);
    
    const bCode = branch?.branchCode || comp?.branchCode || comp?.branchName?.slice(0, 3).toUpperCase() || "";
    const displayBranchCode = bCode ? ` - ${bCode}` : "";
    
    const val = `${p.packageName} (${p.companyName}${displayBranchCode})`;
    if (!seenValues.has(val.toLowerCase())) {
      seenValues.add(val.toLowerCase());
      list.push({
        value: val,
        label: `📦 ${val}`,
        badge: "Company",
        badgeType: "company",
      });
    }
  });

  // 3. Unknown / OCR packages from shipments
  shipmentPackages.forEach((pkgVal) => {
    const isRegistered = packages.some(
      (p) => p.packageName.toLowerCase().trim() === pkgVal.toLowerCase().trim()
    );
    if (!isRegistered && !seenValues.has(pkgVal.toLowerCase())) {
      seenValues.add(pkgVal.toLowerCase());
      list.push({
        value: pkgVal,
        label: `⚠ ${pkgVal}`,
        badge: "Shipment Only",
        badgeType: "shipment",
      });
    }
  });

  return list;
}
