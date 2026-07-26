import type { Package } from "@/types/packageType";

export function generatePackageId(packages: Package[]): string {
  if (packages.length === 0) {
    return "PKG001";
  }

  const maxId = Math.max(
    ...packages.map((pkg) => {
      const id = Number(pkg.packageId.replace("PKG", ""));
      return isNaN(id) ? 0 : id;
    })
  );

  return `PKG${String(maxId + 1).padStart(3, "0")}`;
}