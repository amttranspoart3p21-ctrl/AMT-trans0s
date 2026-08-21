import { NextRequest, NextResponse } from "next/server";
import {
    getBranchById,
    updateBranch,
    deleteBranch,
    inactiveBranch,
    activateBranch,
} from "@/services/branch.service";

type RouteContext = {
  params: Promise<{
    branchId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { branchId } = await params;

    const branch = await getBranchById(branchId);

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message: "Branch not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Branch fetched successfully.",
      data: branch,
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

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { branchId } = await params;

    const body = await request.json();

    if (body.status === "Inactive") {
      const { updatedBranch, updatedCounts } = await inactiveBranch(branchId);

      return NextResponse.json({
        success: true,
        message: "Branch and related records marked inactive",
        updated: updatedCounts,
        data: updatedBranch,
      });
    } else if (body.status === "Active") {
      const { updatedBranch, updatedCounts } = await activateBranch(branchId);

      return NextResponse.json({
        success: true,
        message: "Branch and related records marked active",
        updated: updatedCounts,
        data: updatedBranch,
      });
    }

    const updatedBranch = await updateBranch(branchId, body);

    return NextResponse.json({
      success: true,
      message: "Branch updated successfully.",
      data: updatedBranch,
    });
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


export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { branchId } = await params;

    const { deletedBranch, deletedCounts } = await deleteBranch(branchId);

    return NextResponse.json({
      success: true,
      message: "Branch deleted successfully",
      deleted: deletedCounts,
      data: deletedBranch,
    });
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