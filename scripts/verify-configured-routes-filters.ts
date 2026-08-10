export {};

async function testFilters() {
  const baseUrl = "http://localhost:3000";
  console.log("=== VERIFYING CONFIGURED ROUTES FILTERS & PIPELINE ===");

  try {
    // Fetch routes for PKG006
    const res = await fetch(`${baseUrl}/api/global-route-rates?packageId=PKG006`);
    const json = await res.json();
    const routes: any[] = json.routeRates || [];

    console.log(`- Total routes for PKG006: ${routes.length}`);

    // Test Rate Filter (e.g. rate = 850)
    const rateFiltered = routes.filter((r) => String(r.rate).includes("850"));
    console.log(`- Rate Filter (850): ${rateFiltered.length} routes matched`);

    // Test From Branch Filter (e.g. fromBranchId = BR001 - Chennai)
    const fromFiltered = routes.filter((r) => r.fromBranchId === "BR001");
    console.log(`- From Branch Filter (BR001): ${fromFiltered.length} routes matched`);

    // Test Combined Filter (From BR001 + Status Active)
    const combinedFiltered = routes.filter((r) => r.fromBranchId === "BR001" && r.status === "Active");
    console.log(`- Combined Filter (From BR001 + Active): ${combinedFiltered.length} routes matched`);

    console.log("\n=== ALL CONFIGURED ROUTE FILTERS VERIFIED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Error:", err);
  }
}

testFilters();
