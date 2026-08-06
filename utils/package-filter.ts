import type { SearchableSelectOption } from "@/components/ui/SearchableSelect";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import type { Company } from "@/types/company";
import type { Branch } from "@/types/branch";
import type { Package } from "@/types/packageType";

export function getFilteredPackageOptions(
  fromBranch: string | null | undefined,
  toBranch: string | null | undefined,
  paymentCompany: string | null | undefined,
  companyRouteRates: CompanyRouteRate[] = [],
  globalRouteRates: GlobalRouteRate[] = [],
  companies: Company[] = [],
  branches: Branch[] = [],
  paymentReceivingBranch?: string | null | undefined
): SearchableSelectOption[] {
  if (!fromBranch || !toBranch) {
    return [];
  }

  const fromBranchKey = fromBranch.trim().toLowerCase();
  const toBranchKey = toBranch.trim().toLowerCase();

  const options: SearchableSelectOption[] = [];
  const seenCompanyBaseNames = new Set<string>();

  // 1. Fetch Company Route Rates (if Pay Company is selected)
  if (paymentCompany) {
    const payCompName = paymentCompany.trim().toLowerCase();

    // Find branch objects corresponding to From and To branches
    const fromBranchObj = branches.find(
      (b) => b.branchName?.trim().toLowerCase() === fromBranchKey
    );
    const toBranchObj = branches.find(
      (b) => b.branchName?.trim().toLowerCase() === toBranchKey
    );

    // Find company registered at the source branch or target branch based on paymentReceivingBranch
    let targetCompany: Company | undefined;
    if (paymentReceivingBranch === "From Company" && fromBranchObj) {
      targetCompany = companies.find(
        (co) =>
          co.companyName.trim().toLowerCase() === payCompName &&
          co.branchId === fromBranchObj.branchId
      );
    } else if (paymentReceivingBranch === "To Company" && toBranchObj) {
      targetCompany = companies.find(
        (co) =>
          co.companyName.trim().toLowerCase() === payCompName &&
          co.branchId === toBranchObj.branchId
      );
    } else {
      // Fallback
      targetCompany =
        companies.find(
          (co) =>
            co.companyName.trim().toLowerCase() === payCompName &&
            fromBranchObj &&
            co.branchId === fromBranchObj.branchId
        ) ||
        companies.find(
          (co) =>
            co.companyName.trim().toLowerCase() === payCompName &&
            toBranchObj &&
            co.branchId === toBranchObj.branchId
        );
    }

    if (targetCompany) {
      // Find all matching company rates
      const matchingCompanyRates = companyRouteRates.filter((c) => {
        return (
          c.status === "Active" &&
          c.companyId === targetCompany.companyId &&
          c.fromBranchName.trim().toLowerCase() === fromBranchKey &&
          c.toBranchName.trim().toLowerCase() === toBranchKey
        );
      });

      matchingCompanyRates.forEach((c) => {
        const comp = companies.find((co) => co.companyId === c.companyId);
        const compBranch = branches.find(
          (b) => b.branchId === comp?.branchId || b.branchName === comp?.branchName
        );
        const bCode =
          compBranch?.branchCode ||
          comp?.branchCode ||
          comp?.branchName?.slice(0, 3).toUpperCase() ||
          "";
        const displayBranchCode = bCode ? ` - ${bCode}` : "";

        // Option label is like: Drum (XYZ Exports - RPT)
        const cName = comp?.companyName || c.companyName || paymentCompany;
        const val = `${c.packageName} (${cName}${displayBranchCode})`;
        const label = `📦 ${val}`;

        const baseKey = c.packageName.toLowerCase().trim();
        if (!seenCompanyBaseNames.has(baseKey)) {
          seenCompanyBaseNames.add(baseKey);
          options.push({
            value: val,
            label: label,
          });
        }
      });
    }
  }

  // 2. Fetch Global Route Rates
  const matchingGlobalRates = globalRouteRates.filter((g) => {
    return (
      g.status === "Active" &&
      g.fromBranchName.trim().toLowerCase() === fromBranchKey &&
      g.toBranchName.trim().toLowerCase() === toBranchKey
    );
  });

  const seenGlobalBaseNames = new Set<string>();
  matchingGlobalRates.forEach((g) => {
    const val = g.packageName;
    const label = `📦 ${val}`;
    const baseKey = val.toLowerCase().trim();

    // Append ONLY if it's not already in the Company list (no duplication)
    if (!seenCompanyBaseNames.has(baseKey) && !seenGlobalBaseNames.has(baseKey)) {
      seenGlobalBaseNames.add(baseKey);
      options.push({
        value: val,
        label: label,
        isGlobal: true, // Mark it so buildPackageOptionsList can distinguish
      });
    }
  });

  return options;
}

/**
 * Determines the badge status of a package value given the current route context.
 * Returns:
 *   - "rated"        → value is already in the rated options list (no badge needed)
 *   - "no-rate"      → value exists in the Package Master but has no route rate configured
 *   - "unregistered" → value does not exist in the Package Master at all
 *   - "empty"        → value is empty / not yet selected
 */
export type PackageBadgeStatus = "rated" | "no-rate" | "unregistered" | "empty";

export function getPackageBadgeStatus(
  currentValue: string | null | undefined,
  fromBranch: string | null | undefined,
  toBranch: string | null | undefined,
  paymentCompany: string | null | undefined,
  companyRouteRates: CompanyRouteRate[] = [],
  globalRouteRates: GlobalRouteRate[] = [],
  companies: Company[] = [],
  branches: Branch[] = [],
  packages: Package[] = [],
  paymentReceivingBranch?: string | null | undefined
): PackageBadgeStatus {
  if (!currentValue || !currentValue.trim()) return "empty";

  const currTrimmed = currentValue.trim();
  const currKey = currTrimmed.toLowerCase();
  const currBaseKey = currKey.includes("(") ? currKey.substring(0, currKey.indexOf("(")).trim() : currKey;

  // Check rated options
  const ratedOptions = getFilteredPackageOptions(
    fromBranch,
    toBranch,
    paymentCompany,
    companyRouteRates,
    globalRouteRates,
    companies,
    branches,
    paymentReceivingBranch
  );

  const getBasePackageName = (val: string): string => {
    const idx = val.indexOf("(");
    if (idx !== -1) return val.substring(0, idx).trim();
    return val.trim();
  };

  const isRated = ratedOptions.some((opt) => {
    const optVal = opt.value.toLowerCase().trim();
    return optVal === currKey || getBasePackageName(optVal).toLowerCase().trim() === currBaseKey;
  });

  if (isRated) return "rated";

  // Check master list
  const isInMaster = packages.some(
    (p) => p.packageName.trim().toLowerCase() === currBaseKey
  );

  if (isInMaster) return "no-rate";

  return "unregistered";
}

/**
 * Builds the full ordered options list for the Package dropdown — in the same
 * order / structure as the Company dropdown:
 *
 *   1. Current OCR / saved value (pinned at top, with its badge status)
 *   2. Registered & Rate Available packages (no badge)
 *   3. Master packages with no route rate (RATE NOT CONFIGURED badge)
 *   4. Manual entry footer is handled by SearchableSelect's allowManualEntry prop
 */
export function buildPackageOptionsList(
  currentValue: string | null | undefined,
  fromBranch: string | null | undefined,
  toBranch: string | null | undefined,
  paymentCompany: string | null | undefined,
  companyRouteRates: CompanyRouteRate[] = [],
  globalRouteRates: GlobalRouteRate[] = [],
  companies: Company[] = [],
  branches: Branch[] = [],
  packages: Package[] = [],
  paymentReceivingBranch?: string | null | undefined
): SearchableSelectOption[] {
  // 1. Get the list of packages that have a rate configured (Registered & Rate Available)
  const ratedOptions = getFilteredPackageOptions(
    fromBranch,
    toBranch,
    paymentCompany,
    companyRouteRates,
    globalRouteRates,
    companies,
    branches,
    paymentReceivingBranch
  );

  const getBasePackageName = (val: string): string => {
    const idx = val.indexOf("(");
    if (idx !== -1) return val.substring(0, idx).trim();
    return val.trim();
  };

  const companyOptions = ratedOptions.filter(opt => !opt.isGlobal);
  const globalOptions = ratedOptions.filter(opt => opt.isGlobal);

  const options: SearchableSelectOption[] = [];
  const seenBaseNames = new Set<string>();

  // ── Section 1: Current OCR / saved value pinned at top ─────────────────────
  if (currentValue && currentValue.trim()) {
    const currTrimmed = currentValue.trim();
    const currKey = currTrimmed.toLowerCase();
    const currBaseKey = getBasePackageName(currTrimmed).toLowerCase();

    // Check if it is already present in either Company Route package list or Global Route package list
    const isRated = ratedOptions.some((opt) => {
      const optVal = opt.value.toLowerCase().trim();
      return optVal === currKey || getBasePackageName(optVal).toLowerCase().trim() === currBaseKey;
    });

    if (isRated) {
      // If the OCR package is already present in either the Company Route package list or the Global Route package list, do not render it twice.
      // The OCR package should simply be selected by default.
    } else {
      // It is NOT present in either list (i.e. has no matching rate configured for this route).
      // Render it at the top with the appropriate badge.
      const isInMaster = packages.some(
        (p) => p.packageName.trim().toLowerCase() === currBaseKey || p.packageName.trim().toLowerCase() === currKey
      );

      seenBaseNames.add(currBaseKey);

      if (isInMaster) {
        options.push({
          value: currTrimmed,
          label: currTrimmed,
          badge: "RATE NOT CONFIGURED",
          badgeType: "shipment",
        });
      } else {
        options.push({
          value: currTrimmed,
          label: currTrimmed,
          badge: "UNREGISTERED",
          badgeType: "shipment",
        });
      }

      // Add a divider below the unrated OCR option if there are subsequent options
      if (companyOptions.length > 0 || globalOptions.length > 0) {
        options.push({
          value: "divider-ocr",
          label: "",
          isDivider: true,
        });
      }
    }
  }

  // ── Section 2: Company Route Packages ─────────────────────────────────────
  let addedCompanyOptions = false;
  companyOptions.forEach((opt) => {
    const baseKey = getBasePackageName(opt.value).toLowerCase().trim();
    if (!seenBaseNames.has(baseKey)) {
      seenBaseNames.add(baseKey);
      options.push({ ...opt });
      addedCompanyOptions = true;
    }
  });

  // ── Section 3: Global Route Packages ──────────────────────────────────────
  // If we have any global options that haven't been seen yet, and we added company options, add a divider
  const hasUnseenGlobalOptions = globalOptions.some(opt => !seenBaseNames.has(opt.value.toLowerCase().trim()));
  if (addedCompanyOptions && hasUnseenGlobalOptions) {
    options.push({
      value: "divider-global",
      label: "",
      isDivider: true,
    });
  }

  globalOptions.forEach((opt) => {
    const baseKey = opt.value.toLowerCase().trim();
    if (!seenBaseNames.has(baseKey)) {
      seenBaseNames.add(baseKey);
      options.push({ ...opt });
    }
  });

  return options;
}

export function isGlobalRoutePackage(
  pkgVal: string | null | undefined,
  fromBranch: string | null | undefined,
  toBranch: string | null | undefined,
  paymentCompany: string | null | undefined,
  companyRouteRates: CompanyRouteRate[] = [],
  globalRouteRates: GlobalRouteRate[] = [],
  companies: Company[] = [],
  branches: Branch[] = [],
  paymentReceivingBranch?: string | null | undefined
): boolean {
  if (!pkgVal) return false;

  const getBasePackageName = (val: string): string => {
    const idx = val.indexOf("(");
    if (idx !== -1) return val.substring(0, idx).trim();
    return val.trim();
  };
  const packageKey = getBasePackageName(pkgVal).trim().toLowerCase();

  const fromBranchKey = (fromBranch || "").trim().toLowerCase();
  const toBranchKey = (toBranch || "").trim().toLowerCase();
  const payCompName = (paymentCompany || "").trim().toLowerCase();

  const fromBranchObj = branches.find((b) => b.branchName?.trim().toLowerCase() === fromBranchKey);
  const toBranchObj = branches.find((b) => b.branchName?.trim().toLowerCase() === toBranchKey);

  let targetCompany: Company | undefined;
  if (paymentReceivingBranch === "From Company" && fromBranchObj) {
    targetCompany = companies.find((co) => co.companyName.trim().toLowerCase() === payCompName && co.branchId === fromBranchObj.branchId);
  } else if (paymentReceivingBranch === "To Company" && toBranchObj) {
    targetCompany = companies.find((co) => co.companyName.trim().toLowerCase() === payCompName && co.branchId === toBranchObj.branchId);
  } else {
    targetCompany =
      companies.find((co) => co.companyName.trim().toLowerCase() === payCompName && fromBranchObj && co.branchId === fromBranchObj.branchId) ||
      companies.find((co) => co.companyName.trim().toLowerCase() === payCompName && toBranchObj && co.branchId === toBranchObj.branchId);
  }

  // Check if matching company route rate exists
  const matchedCompanyRate = companyRouteRates.some(
    (c) =>
      c.status === "Active" &&
      c.companyId === targetCompany?.companyId &&
      c.fromBranchName.trim().toLowerCase() === fromBranchKey &&
      c.toBranchName.trim().toLowerCase() === toBranchKey &&
      c.packageName.trim().toLowerCase() === packageKey
  );

  if (matchedCompanyRate) return false;

  // Check if global route rate exists
  const matchedGlobalRate = globalRouteRates.some(
    (g) =>
      g.status === "Active" &&
      g.fromBranchName.trim().toLowerCase() === fromBranchKey &&
      g.toBranchName.trim().toLowerCase() === toBranchKey &&
      g.packageName.trim().toLowerCase() === packageKey
  );

  return matchedGlobalRate;
}
