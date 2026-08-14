import { resolvePaymentContext } from "../utils/shipment-shared";

const mockBranches = [
  { branchCode: "AMB", branchName: "Ambur", branchId: "B-AMB" },
  { branchCode: "RNP", branchName: "Ranipet", branchId: "B-RNP" },
  { branchCode: "CHE", branchName: "Chennai", branchId: "B-CHE" },
];

console.log("==================================================");
console.log("    RESOLVE PAYMENT CONFLICT TEST SUITE           ");
console.log("==================================================\n");

let passed = true;

// Test 1: Conflict case where paymentReceivingBranch = "To Company" but paymentCompany = "Road Sole"
const test1Shipment = {
  paymentReceivingBranch: "To Company",
  fromCompany: "Road Sole",
  fromAmtBranch: "AMB",
  toCompany: "Sigma Soles",
  toAmtBranch: "RNP",
  paymentCompany: "Road Sole", // Conflict!
};

const res1 = resolvePaymentContext(test1Shipment, mockBranches);
console.log("Test 1 (Conflict Case: paymentReceivingBranch = 'To Company', paymentCompany = 'Road Sole'):");
console.log("  Input:", JSON.stringify(test1Shipment, null, 2));
console.log("  Resolved Output:", res1);
if (res1.paymentCompany === "Sigma Soles" && res1.paymentBranch === "RNP") {
  console.log("  ✓ PASS: Resolved to TO side ('Sigma Soles' + 'RNP') despite paymentCompany conflict!\n");
} else {
  console.log("  ❌ FAIL: Did not resolve to TO side correctly!\n");
  passed = false;
}

// Test 2: Opposite conflict case where paymentReceivingBranch = "From Company" but paymentCompany = "Sigma Soles"
const test2Shipment = {
  paymentReceivingBranch: "From Company",
  fromCompany: "Road Sole",
  fromAmtBranch: "AMB",
  toCompany: "Sigma Soles",
  toAmtBranch: "RNP",
  paymentCompany: "Sigma Soles", // Conflict!
};

const res2 = resolvePaymentContext(test2Shipment, mockBranches);
console.log("Test 2 (Opposite Conflict Case: paymentReceivingBranch = 'From Company', paymentCompany = 'Sigma Soles'):");
console.log("  Input:", JSON.stringify(test2Shipment, null, 2));
console.log("  Resolved Output:", res2);
if (res2.paymentCompany === "Road Sole" && res2.paymentBranch === "AMB") {
  console.log("  ✓ PASS: Resolved to FROM side ('Road Sole' + 'AMB') despite paymentCompany conflict!\n");
} else {
  console.log("  ❌ FAIL: Did not resolve to FROM side correctly!\n");
  passed = false;
}

// Test 3: Missing paymentReceivingBranch
const test3Shipment = {
  paymentReceivingBranch: "",
  fromCompany: "Road Sole",
  fromAmtBranch: "AMB",
  toCompany: "Sigma Soles",
  toAmtBranch: "RNP",
};

const res3 = resolvePaymentContext(test3Shipment, mockBranches);
console.log("Test 3 (Missing paymentReceivingBranch):");
console.log("  Resolved Output:", res3);
if (res3.paymentCompany === null && res3.paymentBranch === null) {
  console.log("  ✓ PASS: Resolved to null (excluded from billing)!\n");
} else {
  console.log("  ❌ FAIL: Did not resolve to null!\n");
  passed = false;
}

console.log("==================================================");
if (passed) {
  console.log("  ALL PAYMENT CONFLICT TEST CASES PASSED SUCCESSFULLY!");
} else {
  console.log("  SOME TEST CASES FAILED!");
}
console.log("==================================================");
