import type { GlobalRouteRate } from "@/types/global-route-rate";

export function generateGlobalRouteRateId(rates: GlobalRouteRate[]): string {
  if (rates.length === 0) {
    return "RTR001";
  }

  const maxId = Math.max(
    ...rates.map((rate) => {
      const id = Number(rate.routeRateId.replace("RTR", ""));
      return isNaN(id) ? 0 : id;
    })
  );

  return `RTR${String(maxId + 1).padStart(3, "0")}`;
}
