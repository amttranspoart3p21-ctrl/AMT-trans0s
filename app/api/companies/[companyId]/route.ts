import { NextRequest, NextResponse } from "next/server";

import {
  getCompanyById,
  updateCompany,
  deleteCompany,
  inactiveCompany,
  activateCompany,
} from "@/services/company.service";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    const company = await getCompanyById(companyId);

    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    const body = await request.json();

    if (body.status === "Inactive") {
      const { updatedCompany, updatedCounts } = await inactiveCompany(companyId);

      return NextResponse.json({
        success: true,
        message: "Company and related records marked inactive",
        updated: updatedCounts,
        data: updatedCompany,
      });
    } else if (body.status === "Active") {
      const { updatedCompany, updatedCounts } = await activateCompany(companyId);

      return NextResponse.json({
        success: true,
        message: "Company and related records marked active",
        updated: updatedCounts,
        data: updatedCompany,
      });
    }

    const company = await updateCompany(companyId, body);

    return NextResponse.json(company);
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


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    const { deletedCompany, deletedCounts } = await deleteCompany(companyId);

    return NextResponse.json({
      success: true,
      message: "Company deleted successfully",
      deleted: deletedCounts,
      data: deletedCompany,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 404 }
    );
  }
}