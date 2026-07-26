import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "@/services/company.service";

async function test() {
  try {
    console.log("========== CREATE ==========");

    const company = await createCompany({
      branchId: "BR001",
      branchName: "Ambur",

      companyName: "ABC Logistics",

      address: "Ambur Bus Stand",

      phoneNumber1: "9876543210",
      phoneNumber2: "",
      phoneNumber3: "",

      email: "abc@gmail.com",

      gstNumber: "33ABCDE1234F1Z5",

      status: "Active",
    });

    console.log(company);

    console.log("\n========== GET ALL ==========");
    console.log(await getCompanies());

    console.log("\n========== GET BY ID ==========");
    console.log(await getCompanyById(company.companyId));

    console.log("\n========== UPDATE ==========");

    const updated = await updateCompany(company.companyId, {
      branchId: "BR001",
      branchName: "Ambur",

      companyName: "ABC Logistics Updated",

      address: "New Address",

      phoneNumber1: "9999999999",
      phoneNumber2: "",
      phoneNumber3: "",

      email: "updated@gmail.com",

      gstNumber: "33ABCDE1234F1Z5",

      status: "Active",
    });

    console.log(updated);

    console.log("\n========== DELETE ==========");

    await deleteCompany(company.companyId);

    console.log("Company deleted successfully.");

    console.log("\n========== FINAL LIST ==========");

    console.log(await getCompanies());

  } catch (error) {
    console.error(error);
  }
}

test(); 


// to test this run this [ npm run test:company ] in terminal 