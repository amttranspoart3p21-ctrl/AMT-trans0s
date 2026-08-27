export function performCompanyRouteRateLookupAndLog(
  label: string,
  companyRates: any[],
  expectedCompanyId: string,
  expectedCompanyName: string,
  expectedFromBranchId: string,
  expectedFromBranchName: string,
  expectedToBranchId: string,
  expectedToBranchName: string,
  expectedPackageId: string,
  expectedPackageName: string
) {
  const fromBranchKey = expectedFromBranchName.trim().toLowerCase();
  const toBranchKey = expectedToBranchName.trim().toLowerCase();
  const packageKey = expectedPackageName.trim().toLowerCase();

  console.log(`%c\n========================================`, "color: #3b82f6; font-weight: bold;");
  console.log(`%c${label} LOOKUP`, "color: #3b82f6; font-weight: bold; font-size: 1.1em;");
  console.log(`%c========================================`, "color: #3b82f6; font-weight: bold;");
  console.log(`Expected keys:`);
  console.log(`- Company Name   : ${expectedCompanyName}`);
  console.log(`- Company ID     : ${expectedCompanyId}`);
  console.log(`- From Branch ID : ${expectedFromBranchId} (${expectedFromBranchName})`);
  console.log(`- To Branch ID   : ${expectedToBranchId} (${expectedToBranchName})`);
  console.log(`- Package ID     : ${expectedPackageId} (${expectedPackageName})`);

  let matchedRate = null;
  const candidates: any[] = [];

  for (const c of companyRates) {
    if (c.status !== "Active") continue;

    // Check if company matches (case-insensitive)
    const isCompanyMatch = c.companyId.toLowerCase() === expectedCompanyId.toLowerCase();
    if (!isCompanyMatch) continue;

    // Company matched, this is a candidate!
    const fromBranchMatch = expectedFromBranchId ? (c.fromBranchId === expectedFromBranchId || c.fromBranchName.trim().toLowerCase() === fromBranchKey) : c.fromBranchName.trim().toLowerCase() === fromBranchKey;
    const toBranchMatch = expectedToBranchId ? (c.toBranchId === expectedToBranchId || c.toBranchName.trim().toLowerCase() === toBranchKey) : c.toBranchName.trim().toLowerCase() === toBranchKey;
    const packageMatch = expectedPackageId ? (c.packageId === expectedPackageId || c.packageName.trim().toLowerCase() === packageKey) : c.packageName.trim().toLowerCase() === packageKey;

    const isMatch = fromBranchMatch && toBranchMatch && packageMatch;

    candidates.push({
      rate: c,
      checks: {
        companyId: true,
        fromBranch: fromBranchMatch,
        toBranch: toBranchMatch,
        package: packageMatch
      }
    });

    if (isMatch) {
      matchedRate = c;
    }
  }

  // Print near-matches / candidates
  if (candidates.length > 0) {
    console.log(`\nCandidates (Company matched):`);
    candidates.forEach((cand, idx) => {
      const c = cand.rate;
      const ch = cand.checks;
      console.log(`Candidate #${idx + 1}:`);
      console.log(`  Row Details: CompanyId=${c.companyId}, FromBranchId=${c.fromBranchId} (${c.fromBranchName}), ToBranchId=${c.toBranchId} (${c.toBranchName}), PackageId=${c.packageId} (${c.packageName})`);
      console.log(`  Checks:`);
      console.log(`    Company ID  : %c✅`, "color: green;");
      console.log(`    From Branch : ${ch.fromBranch ? "%c✅" : "%c❌ (Expected: " + (expectedFromBranchId || "none") + "/" + expectedFromBranchName + ", Found: " + c.fromBranchId + "/" + c.fromBranchName + ")"}`, ch.fromBranch ? "color: green;" : "color: red;");
      console.log(`    To Branch   : ${ch.toBranch ? "%c✅" : "%c❌ (Expected: " + (expectedToBranchId || "none") + "/" + expectedToBranchName + ", Found: " + c.toBranchId + "/" + c.toBranchName + ")"}`, ch.toBranch ? "color: green;" : "color: red;");
      console.log(`    Package     : ${ch.package ? "%c✅" : "%c❌ (Expected: " + (expectedPackageId || "none") + "/" + expectedPackageName + ", Found: " + c.packageId + "/" + c.packageName + ")"}`, ch.package ? "color: green;" : "color: red;");
    });
  } else {
    console.log(`\nNo candidates found for Company ID ${expectedCompanyId} in active rates.`);
  }

  if (matchedRate) {
    console.log(`%c\n✅ MATCH FOUND`, "color: green; font-weight: bold;");
    console.log(`Rate Row:`, matchedRate);
  } else {
    console.log(`%c\n❌ NO MATCH`, "color: red; font-weight: bold;");
  }
  console.log(`========================================\n`);

  return matchedRate;
}
