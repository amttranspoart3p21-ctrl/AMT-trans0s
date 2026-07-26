import type { GlobalRouteRate } from "@/types/global-route-rate";
import {
  readGlobalRouteRates,
  writeGlobalRouteRates,
} from "@/lib/global-route-rate";
import { readBranches } from "@/lib/branch";
import { readPackages } from "@/lib/package";
import { validateGlobalRouteRate } from "@/validators/global-route-rate.validator";
import { generateGlobalRouteRateId } from "@/utils/generateGlobalRouteRateId";

export async function createGlobalRouteRate(
  rateData: Omit<GlobalRouteRate, "routeRateId" | "createdAt" | "updatedAt">
): Promise<GlobalRouteRate> {
  const branches = await readBranches();
  const fromBranch = branches.find((b) => b.branchId === rateData.fromBranchId);
  if (!fromBranch) {
    throw new Error("From Branch does not exist.");
  }

  const toBranch = branches.find((b) => b.branchId === rateData.toBranchId);
  if (!toBranch) {
    throw new Error("To Branch does not exist.");
  }

  const packages = await readPackages();
  const pkg = packages.find((p) => p.packageId === rateData.packageId);
  if (!pkg) {
    throw new Error("Package does not exist.");
  }

  if (rateData.fromBranchId === rateData.toBranchId) {
    throw new Error("From Branch and To Branch cannot be the same.");
  }

  const fullRateData = {
    ...rateData,
    fromBranchName: fromBranch.branchName,
    toBranchName: toBranch.branchName,
    packageName: pkg.packageName,
  };

  validateGlobalRouteRate(fullRateData);

  const rates = await readGlobalRouteRates();

  const routeRateExists = rates.some(
    (item) =>
      item.fromBranchId === fullRateData.fromBranchId &&
      item.toBranchId === fullRateData.toBranchId &&
      item.packageId === fullRateData.packageId
  );

  if (routeRateExists) {
    throw new Error("Route rate already exists.");
  }

  const newRate: GlobalRouteRate = {
    ...fullRateData,
    routeRateId: generateGlobalRouteRateId(rates),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  rates.push(newRate);
  await writeGlobalRouteRates(rates);

  return newRate;
}

export async function getGlobalRouteRates(
  page?: number,
  limit?: number,
  search?: string,
  fromBranchId?: string,
  toBranchId?: string,
  packageId?: string,
  status?: GlobalRouteRate["status"]
): Promise<{
  routeRates: GlobalRouteRate[];
  totalRouteRates: number;
  currentPage: number;
  totalPages: number;
}> {
  let rates = await readGlobalRouteRates();

  if (search) {
    const keyword = search.trim().toLowerCase();
    rates = rates.filter(
      (r) =>
        r.fromBranchName.toLowerCase().includes(keyword) ||
        r.toBranchName.toLowerCase().includes(keyword) ||
        r.packageName.toLowerCase().includes(keyword)
    );
  }

  if (fromBranchId) {
    rates = rates.filter((r) => r.fromBranchId === fromBranchId);
  }

  if (toBranchId) {
    rates = rates.filter((r) => r.toBranchId === toBranchId);
  }

  if (packageId) {
    rates = rates.filter((r) => r.packageId === packageId);
  }

  if (status) {
    rates = rates.filter((r) => r.status === status);
  }

  const totalRouteRates = rates.length;

  if (!page || !limit) {
    return {
      routeRates: rates,
      totalRouteRates,
      currentPage: 1,
      totalPages: 1,
    };
  }

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    routeRates: rates.slice(start, end),
    totalRouteRates,
    currentPage: page,
    totalPages: Math.ceil(totalRouteRates / limit),
  };
}

export async function getGlobalRouteRateById(
  routeRateId: string
): Promise<GlobalRouteRate> {
  const rates = await readGlobalRouteRates();
  const rate = rates.find((r) => r.routeRateId === routeRateId);

  if (!rate) {
    throw new Error("Route rate not found.");
  }

  return rate;
}

export async function updateGlobalRouteRate(
  routeRateId: string,
  rateData: Omit<GlobalRouteRate, "routeRateId" | "createdAt" | "updatedAt">
): Promise<GlobalRouteRate> {
  const branches = await readBranches();
  const fromBranch = branches.find((b) => b.branchId === rateData.fromBranchId);
  if (!fromBranch) {
    throw new Error("From Branch does not exist.");
  }

  const toBranch = branches.find((b) => b.branchId === rateData.toBranchId);
  if (!toBranch) {
    throw new Error("To Branch does not exist.");
  }

  const packages = await readPackages();
  const pkg = packages.find((p) => p.packageId === rateData.packageId);
  if (!pkg) {
    throw new Error("Package does not exist.");
  }

  if (rateData.fromBranchId === rateData.toBranchId) {
    throw new Error("From Branch and To Branch cannot be the same.");
  }

  const fullRateData = {
    ...rateData,
    fromBranchName: fromBranch.branchName,
    toBranchName: toBranch.branchName,
    packageName: pkg.packageName,
  };

  validateGlobalRouteRate(fullRateData);

  const rates = await readGlobalRouteRates();

  const rateIndex = rates.findIndex((r) => r.routeRateId === routeRateId);
  if (rateIndex === -1) {
    throw new Error("Route rate not found.");
  }

  const routeRateExists = rates.some(
    (item) =>
      item.routeRateId !== routeRateId &&
      item.fromBranchId === fullRateData.fromBranchId &&
      item.toBranchId === fullRateData.toBranchId &&
      item.packageId === fullRateData.packageId
  );

  if (routeRateExists) {
    throw new Error("Route rate already exists.");
  }

  rates[rateIndex] = {
    ...rates[rateIndex],
    ...fullRateData,
    updatedAt: new Date().toISOString(),
  };

  await writeGlobalRouteRates(rates);

  return rates[rateIndex];
}

export async function deleteGlobalRouteRate(
  routeRateId: string
): Promise<void> {
  const rates = await readGlobalRouteRates();
  const rateExists = rates.some((r) => r.routeRateId === routeRateId);

  if (!rateExists) {
    throw new Error("Route rate not found.");
  }

  const updatedRates = rates.filter((r) => r.routeRateId !== routeRateId);

  await writeGlobalRouteRates(updatedRates);
}
