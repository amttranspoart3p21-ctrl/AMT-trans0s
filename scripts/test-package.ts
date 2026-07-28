// import {
//   createPackage,
//   getPackages,
//   getPackageById,
//   updatePackage,
//   deletePackage,
// } from "@/services/package.service";

// async function test() {
//   try {
//     console.log("========== CREATE ==========");

//     const pkg = await createPackage({
//       packageName: "Box 4*4",
//       description: "Small carton box",
//       status: "Active",
//     });

//     console.log(pkg);

//     console.log("\n========== GET ALL ==========");
//     console.log(await getPackages());

//     console.log("\n========== GET BY ID ==========");
//     console.log(await getPackageById(pkg.packageId));

//     console.log("\n========== UPDATE ==========");

//     const updated = await updatePackage(pkg.packageId, {
//       packageName: "Box 4*4 Updated",
//       description: "Updated description",
//       status: "Inactive",
//     });

//     console.log(updated);

//     console.log("\n========== DELETE ==========");

//     await deletePackage(pkg.packageId);

//     console.log("Package deleted successfully.");

//     console.log("\n========== FINAL LIST ==========");

//     console.log(await getPackages());
//   } catch (error) {
//     console.error(error);
//   }
// }

// test();


// Package Testing
// Run using: npm run test:package

import {
  createPackage,
  getPackages,
} from "@/services/package.service";

async function test() {
  try {
    console.log("========================================");
    console.log("       CREATING PACKAGE MASTER");
    console.log("========================================");

    const packages = [
  // ===== Global Packages =====
  {
    packageName: "Box",
    description: "Cardboard Box",
    status: "Active" as const,
  },
  {
    packageName: "Bag",
    description: "Plastic Bag",
    status: "Active" as const,
  },
  {
    packageName: "Carton",
    description: "Carton",
    status: "Active" as const,
  },
  {
    packageName: "Bundle",
    description: "Bundle",
    status: "Active" as const,
  },
  {
    packageName: "Roll",
    description: "Roll",
    status: "Active" as const,
  },
  {
    packageName: "Drum",
    description: "Drum",
    status: "Active" as const,
  },

  // ===== Company Packages =====

  {
    companyId: "CMP001",
    packageName: "Leather Bundle",
    description: "ABC Logistics Special",
    status: "Active" as const,
  },
  {
    companyId: "CMP001",
    packageName: "Shoe Carton",
    description: "ABC Logistics",
    status: "Active" as const,
  },

  {
    companyId: "CMP002",
    packageName: "Garments Box",
    description: "XYZ Exports",
    status: "Active" as const,
  },

  {
    companyId: "CMP003",
    packageName: "Rice Sack",
    description: "Sri Ganesh Traders",
    status: "Active" as const,
  },

  {
    companyId: "CMP005",
    packageName: "Leather Roll",
    description: "Ambur Leather",
    status: "Active" as const,
  },
  {
    companyId: "CMP005",
    packageName: "Leather Sheet",
    description: "Ambur Leather",
    status: "Active" as const,
  },

  {
    companyId: "CMP006",
    packageName: "Export Box",
    description: "Star Exports",
    status: "Active" as const,
  },

  {
    companyId: "CMP008",
    packageName: "Cotton Bundle",
    description: "Vellore Textiles",
    status: "Active" as const,
  },
  {
    companyId: "CMP008",
    packageName: "Fabric Roll",
    description: "Vellore Textiles",
    status: "Active" as const,
  },

  {
    companyId: "CMP009",
    packageName: "Chemical Drum",
    description: "PQR Traders",
    status: "Active" as const,
  },

  {
    companyId: "CMP011",
    packageName: "Chemical Barrel",
    description: "Ranipet Chemicals",
    status: "Active" as const,
  },
  {
    companyId: "CMP011",
    packageName: "Acid Can",
    description: "Ranipet Chemicals",
    status: "Active" as const,
  },

  {
    companyId: "CMP012",
    packageName: "Steel Coil",
    description: "Modern Steels",
    status: "Active" as const,
  },

  {
    companyId: "CMP014",
    packageName: "Air Cargo Box",
    description: "Airport Cargo",
    status: "Active" as const,
  },

  {
    companyId: "CMP015",
    packageName: "Household Items",
    description: "Fast Movers",
    status: "Active" as const,
  },
];

    for (const packageData of packages) {
      const pkg = await createPackage(packageData);

      console.log(
        `✅ ${pkg.packageId} | ${pkg.packageName}`
      );
    }

    console.log("\n========================================");
    console.log("          ALL PACKAGES");
    console.log("========================================");

    const allPackages = await getPackages();

    // console.table(
    //   allPackages.map((pkg) => ({
    //     ID: pkg.packageId,
    //     Package: pkg.packageName,
    //     Status: pkg.status,
    //   }))
    // );

    console.log("\n🎉 Package Master Created Successfully!");
  } catch (error) {
    console.error("❌ Test Failed");
    console.error(error);
  }
}

test();

// To test this run:
// npm run test:package