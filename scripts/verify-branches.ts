async function verify() {
  const PORT = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${PORT}`;
  console.log(`Checking API server at ${baseUrl}...`);

  try {
    // 1. Check statistics
    const statsRes = await fetch(`${baseUrl}/api/branches/statistics`);
    const statsJson = await statsRes.json();
    console.log("Statistics response:", JSON.stringify(statsJson, null, 2));

    // 2. Check paginated list with limit=9
    const branchesRes = await fetch(`${baseUrl}/api/branches?page=1&limit=9`);
    const branchesJson = await branchesRes.json();
    console.log("Pagination list (limit=9) response:", JSON.stringify(branchesJson, null, 2));

    // 3. Check search
    const searchRes = await fetch(`${baseUrl}/api/branches?page=1&limit=9&search=CHE`);
    const searchJson = await searchRes.json();
    console.log("Search response:", JSON.stringify(searchJson, null, 2));
  } catch (err) {
    console.error("Verification failed:", err);
  }
}

verify();
