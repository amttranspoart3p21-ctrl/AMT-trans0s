import { NextRequest, NextResponse } from "next/server";
import {
    createBranch,
    getBranches,
    getBranchesWithPagination
} from "@/services/branch.service";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? undefined;

    const status =
      (searchParams.get("status") as "Active" | "Inactive" | null) ??
      undefined;

    const page = Number(searchParams.get("page"));
    const limit = Number(searchParams.get("limit"));

    if (page > 0 && limit > 0) {
      const result = await getBranchesWithPagination(
        page,
        limit,
        search,
        status
      );

      return NextResponse.json({
        success: true,
        message: "Branches fetched successfully.",
        ...result,
      });
    }

    let branches = await getBranches();

    if (search) {
      branches = branches.filter(
        (branch) =>
          branch.branchName.toLowerCase().includes(search.toLowerCase()) ||
          branch.branchCode.toLowerCase().includes(search.toLowerCase()) ||
          branch.address.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status) {
      branches = branches.filter((branch) => branch.status === status);
    }

    return NextResponse.json({
      success: true,
      message: "Branches fetched successfully.",
      data: branches,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const branch = await createBranch(body);

        return NextResponse.json(
            {
                success: true,
                message: "Branch created successfully.",
                data: branch,
            },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : "Something went wrong.",
            },
            { status: 400 }
        );
    }
}


