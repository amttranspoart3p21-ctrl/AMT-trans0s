

// v1

// branch testing  with terminal using command npm run test:branch 

// import {
//   createBranch,
//   getBranches,
//   getBranchById,
//   updateBranch,
//   deleteBranch,
// } from "@/services/branch.service";

// async function test() {
//   try {
//     console.log("========== CREATE ==========");

//     const branch = await createBranch({
//       branchName: "Ambur",
//       branchCode: "AMB",
//       address: "Ambur Bus Stand",
//       phoneNumber1: "9876543210",
//       phoneNumber2: "",
//       phoneNumber3: "",
//       phoneNumber4: "",
//       phoneNumber5: "",
//       status: "Active",
//     });

//     console.log(branch);

//     console.log("\n========== GET ALL ==========");
//     console.log(await getBranches());

//     console.log("\n========== GET BY ID ==========");
//     console.log(await getBranchById(branch.branchId));

//     console.log("\n========== UPDATE ==========");

//     const updated = await updateBranch(branch.branchId, {
//       branchName: "Ambur Updated",
//       branchCode: "AMB",
//       address: "New Address",
//       phoneNumber1: "9999999999",
//       phoneNumber2: "",
//       phoneNumber3: "",
//       phoneNumber4: "",
//       phoneNumber5: "",
//       status: "Active",
//     });

//     console.log(updated);

//     console.log("\n========== DELETE ==========");

//     const deleted = await deleteBranch(branch.branchId);

//     console.log(deleted);

//     console.log("\n========== FINAL LIST ==========");

//     console.log(await getBranches());

//   } catch (error) {
//     console.error(error);
//   }
// }

// test();


// // to test this run this [ npm run test:branch ] in terminal 

// v2

// Branch Testing
// Run using: npm run test:branch

import {
  createBranch,
  getBranches,
} from "@/services/branch.service";

async function test() {
  try {
    console.log("========================================");
    console.log("     CREATING DEFAULT BRANCHES");
    console.log("========================================");

    const branches = [
      {
        branchName: "Chennai",
        branchCode: "CHE",
        address: "Chennai Branch",
        phoneNumber1: "9876543210",
        phoneNumber2: "",
        phoneNumber3: "",
        phoneNumber4: "",
        phoneNumber5: "",
        status: "Active" as const,
      },
      {
        branchName: "Ambur",
        branchCode: "AMB",
        address: "Ambur Branch",
        phoneNumber1: "9876543211",
        phoneNumber2: "",
        phoneNumber3: "",
        phoneNumber4: "",
        phoneNumber5: "",
        status: "Active" as const,
      },
      {
        branchName: "Vellore",
        branchCode: "VEL",
        address: "Vellore Branch",
        phoneNumber1: "9876543212",
        phoneNumber2: "",
        phoneNumber3: "",
        phoneNumber4: "",
        phoneNumber5: "",
        status: "Active" as const,
      },
      {
        branchName: "Ranipet",
        branchCode: "RNP",
        address: "Ranipet Branch",
        phoneNumber1: "9876543213",
        phoneNumber2: "",
        phoneNumber3: "",
        phoneNumber4: "",
        phoneNumber5: "",
        status: "Active" as const,
      },
      {
        branchName: "Pallavaram",
        branchCode: "PLV",
        address: "Pallavaram Branch",
        phoneNumber1: "9876543214",
        phoneNumber2: "",
        phoneNumber3: "",
        phoneNumber4: "",
        phoneNumber5: "",
        status: "Active" as const,
      },
    ];

    for (const branchData of branches) {
      const branch = await createBranch(branchData);

      console.log(
        `✅ ${branch.branchName} (${branch.branchCode}) -> ${branch.branchId}`
      );
    }

    console.log("\n========================================");
    console.log("         ALL BRANCHES");
    console.log("========================================");

    const allBranches = await getBranches();

    console.table(
      allBranches.map((branch) => ({
        ID: branch.branchId,
        Name: branch.branchName,
        Code: branch.branchCode,
        Status: branch.status,
      }))
    );

    console.log("\n🎉 Branch Master Created Successfully!");
  } catch (error) {
    console.error("❌ Test Failed");
    console.error(error);
  }
}

test();