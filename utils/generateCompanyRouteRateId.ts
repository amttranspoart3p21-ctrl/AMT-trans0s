import type { CompanyRouteRate } from "@/types/company-route-rate";

export function generateCompanyRouteRateId(rates: CompanyRouteRate[]): string {
  if (rates.length === 0) {
    return "CRT001";
  }

  const maxId = Math.max(
    ...rates.map((rate) => {
      const id = Number(rate.companyRouteRateId.replace("CRT", ""));
      return isNaN(id) ? 0 : id;
    })
  );

  return `CRT${String(maxId + 1).padStart(3, "0")}`;
}
