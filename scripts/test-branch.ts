



// branch testing  with terminal using command npm run test:branch 

import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "@/services/branch.service";

async function test() {
  try {
    console.log("========== CREATE ==========");

    const branch = await createBranch({
      branchName: "Ambur",
      branchCode: "AMB",
      address: "Ambur Bus Stand",
      phoneNumber1: "9876543210",
      phoneNumber2: "",
      phoneNumber3: "",
      phoneNumber4: "",
      phoneNumber5: "",
      status: "Active",
    });

    console.log(branch);

    console.log("\n========== GET ALL ==========");
    console.log(await getBranches());

    console.log("\n========== GET BY ID ==========");
    console.log(await getBranchById(branch.branchId));

    console.log("\n========== UPDATE ==========");

    const updated = await updateBranch(branch.branchId, {
      branchName: "Ambur Updated",
      branchCode: "AMB",
      address: "New Address",
      phoneNumber1: "9999999999",
      phoneNumber2: "",
      phoneNumber3: "",
      phoneNumber4: "",
      phoneNumber5: "",
      status: "Active",
    });

    console.log(updated);

    console.log("\n========== DELETE ==========");

    const deleted = await deleteBranch(branch.branchId);

    console.log(deleted);

    console.log("\n========== FINAL LIST ==========");

    console.log(await getBranches());

  } catch (error) {
    console.error(error);
  }
}

test();


// // to test this run this [ npm run test:branch ] in terminal 