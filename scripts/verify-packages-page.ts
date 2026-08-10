export {};

async function verifyPackages() {
  const baseUrl = "http://localhost:3000";
  console.log("=== VERIFYING COMPANY PACKAGE FILTER FIX ===");

  try {
    // 1. All Companies -> Global + All Company packages
    const resAll = await fetch(`${baseUrl}/api/packages?page=1&limit=9`);
    const jsonAll = await resAll.json();
    console.log("\n[1] All Companies (no companyId):");
    console.log(`- totalPackages: ${jsonAll.totalPackages}`);
    console.log(`- packages returned: ${jsonAll.packages?.length}`);

    // 2. ABC Logistics (CMP001)
    const resABC = await fetch(`${baseUrl}/api/packages?page=1&limit=9&companyId=CMP001`);
    const jsonABC = await resABC.json();
    const abcPkgs = jsonABC.packages || [];
    const globalCountInABC = abcPkgs.filter((p: any) => !p.companyId).length;
    console.log("\n[2] Company Filter (ABC Logistics - CMP001):");
    console.log(`- totalPackages: ${jsonABC.totalPackages}`);
    console.log(`- Global packages in result: ${globalCountInABC} (MUST BE 0)`);
    console.log(`- Package IDs returned: ${abcPkgs.map((p: any) => p.packageId).join(", ")}`);

    // 3. XYZ Exports (CMP002)
    const resXYZ = await fetch(`${baseUrl}/api/packages?page=1&limit=9&companyId=CMP002`);
    const jsonXYZ = await resXYZ.json();
    const xyzPkgs = jsonXYZ.packages || [];
    const globalCountInXYZ = xyzPkgs.filter((p: any) => !p.companyId).length;
    console.log("\n[3] Company Filter (XYZ Exports - CMP002):");
    console.log(`- totalPackages: ${jsonXYZ.totalPackages}`);
    console.log(`- Global packages in result: ${globalCountInXYZ} (MUST BE 0)`);

    // 4. Combined Filter: ABC Logistics + Active + Search "Leather"
    const resComb = await fetch(`${baseUrl}/api/packages?page=1&limit=9&companyId=CMP001&status=Active&search=Leather`);
    const jsonComb = await resComb.json();
    const combPkgs = jsonComb.packages || [];
    console.log("\n[4] Combined Filter (CMP001 + Active + search='Leather'):");
    console.log(`- totalPackages matched: ${jsonComb.totalPackages}`);
    console.log(`- Matched package names: ${combPkgs.map((p: any) => p.packageName).join(", ")}`);

    if (globalCountInABC === 0 && globalCountInXYZ === 0) {
      console.log("\n=== VERIFICATION SUCCESS: Global packages strictly excluded when filtering by company! ===");
    } else {
      console.error("\n=== VERIFICATION FAILED: Global packages still present! ===");
    }
  } catch (err) {
    console.error("Verification failed:", err);
  }
}

verifyPackages();
