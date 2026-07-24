import { NextRequest, NextResponse } from "next/server";

import {
  createCompany,
  getCompanies,
} from "@/services/company.service";

// export async function GET() {
//   try {
//     const companies = await getCompanies();

//     return NextResponse.json(companies);
//   } catch (error) {
//     return NextResponse.json(
//       {
//         message:
//           error instanceof Error
//             ? error.message
//             : "Something went wrong.",
//       },
//       { status: 500 }
//     );
//   }
// }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page")) || undefined;
    const limit = Number(searchParams.get("limit")) || undefined;

    const search = searchParams.get("search") || undefined;
    const branchId = searchParams.get("branchId") || undefined;

    const status =
      (searchParams.get("status") as
        | "Active"
        | "Inactive"
        | null) ?? undefined;

    const result = await getCompanies(
      page,
      limit,
      search,
      branchId,
      status
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const company = await createCompany(body);

    return NextResponse.json(company, {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 400 }
    );
  }
}