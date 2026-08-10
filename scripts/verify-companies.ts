export {};

async function check() {
  const baseUrl = "http://localhost:3000";
  console.log("Checking API responses...");

  try {
    const compRes = await fetch(`${baseUrl}/api/companies`);
    const compJson = await compRes.json();
    console.log("GET /api/companies response:", JSON.stringify(compJson, null, 2));

    const branchRes = await fetch(`${baseUrl}/api/branches?limit=100`);
    const branchJson = await branchRes.json();
    console.log("GET /api/branches response sample:", JSON.stringify(branchJson.data?.slice(0, 3), null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
