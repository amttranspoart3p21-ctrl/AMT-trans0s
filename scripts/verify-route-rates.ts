export {};

async function check() {
  const baseUrl = "http://localhost:3000";
  console.log("=== CHECKING ROUTE RATE APIS ===");

  try {
    const globalRes = await fetch(`${baseUrl}/api/global-route-rates`);
    const globalJson = await globalRes.json();
    console.log("GET /api/global-route-rates response:", JSON.stringify(globalJson, null, 2));

    const compRes = await fetch(`${baseUrl}/api/company-route-rates`);
    const compJson = await compRes.json();
    console.log("GET /api/company-route-rates response:", JSON.stringify(compJson, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
