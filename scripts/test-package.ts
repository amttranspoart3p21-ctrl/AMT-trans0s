import {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} from "@/services/package.service";

async function test() {
  try {
    console.log("========== CREATE ==========");

    const pkg = await createPackage({
      packageName: "Box 4*4",
      description: "Small carton box",
      status: "Active",
    });

    console.log(pkg);

    console.log("\n========== GET ALL ==========");
    console.log(await getPackages());

    console.log("\n========== GET BY ID ==========");
    console.log(await getPackageById(pkg.packageId));

    console.log("\n========== UPDATE ==========");

    const updated = await updatePackage(pkg.packageId, {
      packageName: "Box 4*4 Updated",
      description: "Updated description",
      status: "Inactive",
    });

    console.log(updated);

    console.log("\n========== DELETE ==========");

    await deletePackage(pkg.packageId);

    console.log("Package deleted successfully.");

    console.log("\n========== FINAL LIST ==========");

    console.log(await getPackages());
  } catch (error) {
    console.error(error);
  }
}

test();

// To test this run:
// npm run test:package