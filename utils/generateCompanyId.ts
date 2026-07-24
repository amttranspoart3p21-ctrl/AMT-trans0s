import type { Company } from "@/types/company";

export function generateCompanyId(companies: Company[]): string {
  if (companies.length === 0) {
    return "CMP001";
  }

  let maxId = 0;

  companies.forEach((company) => {
    const id = Number(company.companyId.replace("CMP", ""));

    if (id > maxId) {
      maxId = id;
    }
  });

  const nextId = maxId + 1;

  return `CMP${nextId.toString().padStart(3, "0")}`;
}