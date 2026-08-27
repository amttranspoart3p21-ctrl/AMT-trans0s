import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { SearchableSelectOption } from "@/components/ui/SearchableSelect";

export interface BuildPaymentCompanyOptionsParams {
  paymentReceivingBranch?: string | null;
  fromAmtBranch?: string | null;
  toAmtBranch?: string | null;
  fromCompany?: string | null;
  toCompany?: string | null;
  currentPaymentCompany?: string | null;
  branches: Branch[];
  companies: Company[];
}

/**
 * Builds the 3-section options list for the Payment Company searchable select dropdown:
 * 1. Current shipment company (From or To company based on paymentReceivingBranch)
 * 2. Registered companies for the selected Pay Branch (with a divider if current company is present)
 * 3. Unregistered/manual badge option if the currently selected value is not registered
 */
export function buildPaymentCompanyOptions({
  paymentReceivingBranch,
  fromAmtBranch,
  toAmtBranch,
  fromCompany,
  toCompany,
  currentPaymentCompany,
  branches,
  companies,
}: BuildPaymentCompanyOptionsParams): SearchableSelectOption[] {
  // Find selected Pay Branch
  const payBranchName =
    paymentReceivingBranch === "From Company"
      ? fromAmtBranch
      : paymentReceivingBranch === "To Company"
      ? toAmtBranch
      : "";

  const payBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === payBranchName?.trim().toLowerCase()
  );
  const payBranchId = payBranchObj?.branchId || "";
  const payBranchCode = payBranchObj?.branchCode || "";

  const payCompanyOptions: SearchableSelectOption[] = [];

  // 1. Current shipment company
  const curCompanyName =
    paymentReceivingBranch === "From Company"
      ? fromCompany
      : paymentReceivingBranch === "To Company"
      ? toCompany
      : "";

  if (curCompanyName) {
    let curCompanyLabel = curCompanyName;
    const curCompanyObj = companies.find(
      (c) => c.companyName === curCompanyName && c.branchId === payBranchId
    );
    if (curCompanyObj?.displayName) {
      curCompanyLabel = curCompanyObj.displayName;
    } else if (payBranchCode) {
      curCompanyLabel = `${curCompanyName} - ${payBranchCode}`;
    }
    payCompanyOptions.push({
      value: curCompanyName,
      label: curCompanyLabel,
    });
  }

  // 2. All registered companies for the selected Pay Branch (excluding the current shipment company)
  const registeredCompanies = companies.filter((c) => c.branchId === payBranchId);
  const otherCompanies = registeredCompanies.filter((c) => c.companyName !== curCompanyName);

  if (curCompanyName && otherCompanies.length > 0) {
    payCompanyOptions.push({
      value: "divider-current",
      label: "",
      isDivider: true,
    });
  }

  otherCompanies.forEach((c) => {
    payCompanyOptions.push({
      value: c.companyName,
      label: c.displayName || c.companyName,
    });
  });

  // 3. Current selected value if unregistered/manual
  const val = currentPaymentCompany;
  const isCurrentMatch = curCompanyName && val === curCompanyName;
  const isInRegistered = registeredCompanies.some((c) => c.companyName === val);
  const isUnregistered = val && !isCurrentMatch && !isInRegistered;

  if (isUnregistered) {
    payCompanyOptions.push({
      value: String(val),
      label: String(val),
      badge: "Unregistered",
      badgeType: "shipment" as any,
    });
  }

  return payCompanyOptions;
}

/**
 * Resolves the display label for a payment company in read-only / preview mode.
 */
export function getPaymentCompanyDisplayText({
  paymentCompany,
  paymentReceivingBranch,
  fromAmtBranch,
  toAmtBranch,
  branches,
  companies,
}: {
  paymentCompany?: string | null;
  paymentReceivingBranch?: string | null;
  fromAmtBranch?: string | null;
  toAmtBranch?: string | null;
  branches: Branch[];
  companies: Company[];
}): string {
  if (!paymentCompany) return "-";
  const payBranchName =
    paymentReceivingBranch === "From Company"
      ? fromAmtBranch
      : paymentReceivingBranch === "To Company"
      ? toAmtBranch
      : "";
  const payBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === payBranchName?.trim().toLowerCase()
  );
  const payBranchId = payBranchObj?.branchId || "";
  const payBranchCode = payBranchObj?.branchCode || "";
  const compObj = companies.find(
    (c) => c.companyName === paymentCompany && c.branchId === payBranchId
  );
  return compObj?.displayName || (payBranchCode ? `${paymentCompany} - ${payBranchCode}` : paymentCompany);
}
