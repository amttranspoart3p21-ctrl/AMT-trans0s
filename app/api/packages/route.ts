import { NextRequest, NextResponse } from "next/server";

import {
  createPackage,
  getPackages,
} from "@/services/package.service";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page")) || undefined;
    const limit = Number(searchParams.get("limit")) || undefined;

    const search = searchParams.get("search") || undefined;
    const companyId = searchParams.get("companyId") || undefined;

    const status =
      (searchParams.get("status") as
        | "Active"
        | "Inactive"
        | null) ?? undefined;

    const result = await getPackages(
      page,
      limit,
      search,
      status,
      companyId
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

    const pkg = await createPackage(body);

    return NextResponse.json(pkg, {
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