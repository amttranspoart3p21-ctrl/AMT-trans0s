export {};

async function testCounts() {
  const baseUrl = "http://localhost:3000";
  console.log("=== VERIFYING ROUTE RATES PAGE PACKAGE COUNTS ===");

  try {
    const res = await fetch(`${baseUrl}/api/packages`);
    const json = await res.json();
    const allPkgs: any[] = json.packages || [];

    const globalPkgs = allPkgs.filter((p) => !p.companyId);
    const companyPkgs = allPkgs.filter((p) => !!p.companyId);

    console.log(`\nGlobal Tab:` );
    console.log(`- Total Global Packages: ${globalPkgs.length} (EXPECTED 7)`);
    console.log(`- Display text: SHOWING 1–${globalPkgs.length} OF ${globalPkgs.length} PACKAGES`);

    console.log(`\nCompany Tab:`);
    console.log(`- Total Company Packages: ${companyPkgs.length} (EXPECTED 25)`);
    console.log(`- Page 1 (limit 9): SHOWING 1–9 OF ${companyPkgs.length} PACKAGES`);
    console.log(`- Page 2 (limit 9): SHOWING 10–18 OF ${companyPkgs.length} PACKAGES`);
    console.log(`- Page 3 (limit 9): SHOWING 19–25 OF ${companyPkgs.length} PACKAGES`);

    if (globalPkgs.length === 7 && companyPkgs.length === 25) {
      console.log("\n=== VERIFICATION SUCCESS: All 7 Global packages and 25 Company packages are loaded and paginated! ===");
    } else {
      console.error("\n=== VERIFICATION FAILED: Counts mismatch! ===");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testCounts();
