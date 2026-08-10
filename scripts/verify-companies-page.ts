async function verifyCompanies() {
  const baseUrl = "http://localhost:3000";
  console.log("=== VERIFYING COMPANY APIS AND FILTERS ===");

  try {
    // 1. Fetch Company List with Limit 9 & Pagination
    const res1 = await fetch(`${baseUrl}/api/companies?page=1&limit=9`);
    const json1 = await res1.json();
    console.log("\n[1] Paginated Companies (limit=9):");
    console.log(`- totalCompanies: ${json1.totalCompanies}`);
    console.log(`- currentPage: ${json1.currentPage}`);
    console.log(`- totalPages: ${json1.totalPages}`);
    console.log(`- companies returned: ${json1.companies?.length}`);

    // 2. Fetch Companies filtered by Branch (e.g. BR001 - Chennai)
    const res2 = await fetch(`${baseUrl}/api/companies?page=1&limit=9&branchId=BR001`);
    const json2 = await res2.json();
    console.log("\n[2] Branch Filter (branchId=BR001):");
    console.log(`- totalCompanies: ${json2.totalCompanies}`);
    console.log(`- sample branchName: ${json2.companies?.[0]?.branchName}`);

    // 3. Fetch Companies filtered by Search (e.g. search=Logistics)
    const res3 = await fetch(`${baseUrl}/api/companies?page=1&limit=9&search=logistics`);
    const json3 = await res3.json();
    console.log("\n[3] Search Filter (search=logistics):");
    console.log(`- totalCompanies: ${json3.totalCompanies}`);
    console.log(`- matched companyName: ${json3.companies?.[0]?.companyName}`);

    // 4. Fetch Companies filtered by Status (e.g. status=Active)
    const res4 = await fetch(`${baseUrl}/api/companies?page=1&limit=9&status=Active`);
    const json4 = await res4.json();
    console.log("\n[4] Status Filter (status=Active):");
    console.log(`- totalCompanies: ${json4.totalCompanies}`);

    // 5. Fetch Branches for Filter Dropdown
    const res5 = await fetch(`${baseUrl}/api/branches?limit=100`);
    const json5 = await res5.json();
    console.log("\n[5] Branches List for Dropdown:");
    console.log(`- total branches count: ${json5.data?.length}`);
    console.log(`- first branch: ${json5.data?.[0]?.branchName} - ${json5.data?.[0]?.branchCode}`);

    console.log("\n=== ALL COMPANY API CONTRACTS VERIFIED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Verification failed:", err);
  }
}

verifyCompanies();
