export {};

async function checkPackageCounts() {
  const baseUrl = "http://localhost:3000";
  console.log("=== CHECKING PACKAGE COUNTS ===");

  try {
    const res = await fetch(`${baseUrl}/api/packages`);
    const json = await res.json();
    const allPkgs: any[] = json.packages || [];

    const globalPkgs = allPkgs.filter((p) => !p.companyId);
    const companyPkgs = allPkgs.filter((p) => !!p.companyId);

    console.log(`- Total packages in DB: ${allPkgs.length}`);
    console.log(`- Global packages count: ${globalPkgs.length}`);
    console.log(`- Company packages count: ${companyPkgs.length}`);

    console.log("\nGlobal Package Names & IDs:");
    globalPkgs.forEach((p) => console.log(`  • ${p.packageId} - ${p.packageName}`));

    console.log("\nCompany Package Names & IDs (first 10):");
    companyPkgs.slice(0, 10).forEach((p) => console.log(`  • ${p.packageId} - ${p.packageName} (${p.companyName || p.companyId})`));
  } catch (err) {
    console.error("Error checking package counts:", err);
  }
}

checkPackageCounts();
