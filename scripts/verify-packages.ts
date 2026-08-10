export {};

async function check() {
  const baseUrl = "http://localhost:3000";
  console.log("Checking Package API responses...");

  try {
    const pkgRes = await fetch(`${baseUrl}/api/packages`);
    const pkgJson = await pkgRes.json();
    console.log("GET /api/packages (all):", JSON.stringify(pkgJson, null, 2));

    const compRes = await fetch(`${baseUrl}/api/companies`);
    const compJson = await compRes.json();
    console.log("Companies count:", compJson.companies?.length);
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
