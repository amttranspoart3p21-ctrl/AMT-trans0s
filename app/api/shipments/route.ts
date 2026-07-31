import { NextResponse } from "next/server";
import { createShipmentsBatch } from "@/services/shipment.service";
import type { Shipment } from "@/types/shipment";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year, month, shipments } = body;

    if (!shipments || !Array.isArray(shipments)) {
      return NextResponse.json(
        { error: "Invalid payload. 'shipments' must be an array of records." },
        { status: 400 }
      );
    }

    // Default to current year and month if not provided
    const now = new Date();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const targetMonth = month || now.toLocaleString("default", { month: "long" });

    // Map the simplified frontend shipment structure to the backend's expected Shipment fields
    const formattedShipments: Shipment[] = shipments.map((s: any) => {
      // Preserve quantity as a string exactly as it appears
      let quantity = "1";
      if (s.quantity !== null && s.quantity !== undefined && s.quantity !== "") {
        quantity = String(s.quantity);
      }

      // Map paymentStatus. The database model type says "Pending" | "Paid" | "Free".
      let paymentStatus: "Pending" | "Paid" | "Free" = "Pending";
      const statusText = String(s.paymentStatus || "").toLowerCase();
      if (statusText.includes("paid")) {
        paymentStatus = "Paid";
      } else if (statusText.includes("free")) {
        paymentStatus = "Free";
      }

      // Build database-aligned Shipment object with sensible default fields
      const shipmentDate = s.date || now.toISOString().split("T")[0]; // YYYY-MM-DD format

      return {
        date: shipmentDate,
        vehicleNumber: s.vehicleNumber || "MOCK-1234",
        fromAmtBranch: s.fromAmtBranch || "HO",
        fromCompany: s.fromCompany || "",
        toAmtBranch: s.toAmtBranch || "BO",
        toCompany: s.toCompany || "",
        packageType: s.packageType || "Box",
        quantity: quantity,
        ourInvoiceNumber: s.ourInvoiceNumber || "",
        customerInvoiceNumber: s.customerInvoice || "",
        paymentCompany: s.paymentCompany || s.fromCompany || "",
        paymentReceivingBranch: "From Company",
        pickupService: "Branch",
        deliveryService: "Branch",
        deliveryStatus: "Not Delivered",
        paymentStatus: paymentStatus,
      };
    });

    console.log(`Writing batch of ${formattedShipments.length} shipments to ${targetYear}-${targetMonth}.xlsx`);

    // Call high-performance batch write
    const { results, failed } = await createShipmentsBatch(
      targetYear,
      targetMonth,
      formattedShipments
    );

    return NextResponse.json({
      success: failed.length === 0,
      totalSaved: results.length,
      failedRows: failed.map((f) => ({
        shipment: {
          fromCompany: f.shipment.fromCompany,
          customerInvoice: f.shipment.customerInvoiceNumber,
          toCompany: f.shipment.toCompany,
          packageType: f.shipment.packageType,
          quantity: f.shipment.quantity,
          paymentStatus: f.shipment.paymentStatus,
        },
        error: f.error,
      })),
    });
  } catch (error: any) {
    console.error("Failed to save shipments to Excel:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
